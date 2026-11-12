import { Writable } from "node:stream";
import type { Logger } from "pino";
import { expect, it } from "vitest";
import { createLogger } from "@/lib/logger";
import type { MailClient, OutboundEmail } from "@/features/newsletter/mail-config";
import { newsletterMessages } from "@/features/newsletter/messages";
import { deliverNewsletter } from "@/features/newsletter/deliver-newsletter";

const address = "persona@example.com";
const sentAt = new Date("2026-01-02T03:04:05.000Z");

function captureLogger(): { logger: Logger; lines: string[] } {
  const lines: string[] = [];
  const destination = new Writable({
    write(chunk, _encoding, callback) {
      lines.push(chunk.toString());
      callback();
    },
  });

  return { logger: createLogger(destination), lines };
}

function recordingClient(sent: OutboundEmail[]): MailClient {
  return {
    async send(message) {
      sent.push(message);
    },
  };
}

function failingOnCall(sent: OutboundEmail[], failingCall: number): MailClient {
  let calls = 0;

  return {
    async send(message) {
      calls += 1;

      if (calls === failingCall) {
        throw new Error("Resend rejected the newsletter message");
      }

      sent.push(message);
    },
  };
}

it("rejects a malformed address without sending or logging it", async () => {
  const sent: OutboundEmail[] = [];
  const { logger, lines } = captureLogger();
  const result = await deliverNewsletter({
    input: { email: "no-es-un-correo", consent: true, company: "" },
    mailClient: recordingClient(sent),
    from: "noticias@example.com",
    to: "estudio@example.com",
    now: sentAt,
    logger,
    correlationId: "corr-invalid",
    missingConfig: [],
  });

  expect(result).toEqual({
    status: "invalid",
    field: "email",
    message: newsletterMessages.invalidEmail,
  });
  expect(sent).toHaveLength(0);
  expect(lines.join("")).not.toContain("no-es-un-correo");
});

it("rejects a signup that did not accept the notice", async () => {
  const sent: OutboundEmail[] = [];
  const { logger } = captureLogger();
  const result = await deliverNewsletter({
    input: { email: address, consent: false, company: "" },
    mailClient: recordingClient(sent),
    from: "noticias@example.com",
    to: "estudio@example.com",
    now: sentAt,
    logger,
    correlationId: "corr-consent",
    missingConfig: [],
  });

  expect(result).toEqual({
    status: "invalid",
    field: "consent",
    message: newsletterMessages.missingConsent,
  });
  expect(sent).toHaveLength(0);
});

it("pretends to succeed when the honeypot is filled and does not send", async () => {
  const sent: OutboundEmail[] = [];
  const { logger, lines } = captureLogger();
  const result = await deliverNewsletter({
    input: { email: address, consent: true, company: "acme" },
    mailClient: recordingClient(sent),
    from: "noticias@example.com",
    to: "estudio@example.com",
    now: sentAt,
    logger,
    correlationId: "corr-honeypot",
    missingConfig: [],
  });

  expect(result).toEqual({ status: "success" });
  expect(sent).toHaveLength(0);
  expect(lines.join("")).not.toContain(address);
  expect(lines.join("")).not.toContain(newsletterMessages.consent);
});

it("refuses to send when the mail secret is missing", async () => {
  const { logger, lines } = captureLogger();
  const result = await deliverNewsletter({
    input: { email: address, consent: true, company: "" },
    mailClient: null,
    from: null,
    to: null,
    now: sentAt,
    logger,
    correlationId: "corr-missing",
    missingConfig: ["RESEND_API_KEY"],
  });

  expect(result).toEqual({ status: "error" });
  expect(lines.join("")).toContain("Newsletter send refused");
  expect(lines.join("")).not.toContain(address);
});

it("sends the confirmation and the studio notice without logging the address", async () => {
  const sent: OutboundEmail[] = [];
  const { logger, lines } = captureLogger();
  const result = await deliverNewsletter({
    input: { email: address, consent: true, company: "" },
    mailClient: recordingClient(sent),
    from: "noticias@example.com",
    to: "estudio@example.com",
    now: sentAt,
    logger,
    correlationId: "corr-sent",
    missingConfig: [],
  });

  expect(result).toEqual({ status: "success" });
  expect(sent).toHaveLength(2);
  expect(sent[0]?.to).toBe("estudio@example.com");
  expect(sent[1]?.to).toBe(address);
  const notice = sent[0];
  const confirmation = sent[1];
  expect(confirmation?.text).toContain(newsletterMessages.consent);
  expect(confirmation?.text).toContain(newsletterMessages.confirmationPrivacy);
  expect(confirmation?.text).toContain(newsletterMessages.confirmationOptOut);
  expect(notice?.text).toContain(address);
  expect(notice?.text).toContain("2026-01-02T03:04:05.000Z");
  expect(notice?.text).toContain(newsletterMessages.consent);
  const log = lines.join("");
  expect(log).toContain("Newsletter notices sent");
  expect(log).not.toContain(address);
  expect(log).not.toContain(newsletterMessages.consent);
});

it("does not confirm the person when the studio notice fails", async () => {
  const sent: OutboundEmail[] = [];
  const { logger, lines } = captureLogger();
  const result = await deliverNewsletter({
    input: { email: address, consent: true, company: "" },
    mailClient: failingOnCall(sent, 1),
    from: "noticias@example.com",
    to: "estudio@example.com",
    now: sentAt,
    logger,
    correlationId: "corr-notice-failed",
    missingConfig: [],
  });

  expect(result).toEqual({ status: "error" });
  expect(sent).toHaveLength(0);
  const log = lines.join("");
  expect(log).toContain('"failedLeg":"notice"');
  expect(log).not.toContain(address);
});

it("reports an error when the confirmation fails after the studio notice", async () => {
  const sent: OutboundEmail[] = [];
  const { logger, lines } = captureLogger();
  const result = await deliverNewsletter({
    input: { email: address, consent: true, company: "" },
    mailClient: failingOnCall(sent, 2),
    from: "noticias@example.com",
    to: "estudio@example.com",
    now: sentAt,
    logger,
    correlationId: "corr-confirmation-failed",
    missingConfig: [],
  });

  expect(result).toEqual({ status: "error" });
  expect(sent.map((message) => message.to)).toEqual(["estudio@example.com"]);
  const log = lines.join("");
  expect(log).toContain('"failedLeg":"confirmation"');
  expect(log).not.toContain(address);
  expect(log).not.toContain(newsletterMessages.consent);
});
