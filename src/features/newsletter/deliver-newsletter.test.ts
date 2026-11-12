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
  const confirmation = sent.find((message) => message.to === address);
  const notice = sent.find((message) => message.to === "estudio@example.com");
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
