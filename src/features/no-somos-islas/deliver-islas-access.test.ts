import { Writable } from "node:stream";
import type { Logger } from "pino";
import { expect, it } from "vitest";
import { createLogger } from "@/lib/logger";
import type { MailClient, OutboundEmail } from "@/lib/mail/mail-config";
import { islasAccessMessages } from "@/features/no-somos-islas/messages";
import { deliverIslasAccess } from "@/features/no-somos-islas/deliver-islas-access";

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
        throw new Error(`Resend rejected the mail message for ${address}`);
      }

      sent.push(message);
    },
  };
}

function deliver(
  input: unknown,
  mailClient: MailClient | null,
  logger: Logger,
  missingConfig: string[] = [],
) {
  return deliverIslasAccess({
    input,
    mailClient,
    from: mailClient ? "noticias@example.com" : null,
    to: mailClient ? "estudio@example.com" : null,
    now: sentAt,
    logger,
    correlationId: "corr-1",
    missingConfig,
  });
}

it("sends the notice and then the confirmation with the exact texts when newsletter is true", async () => {
  const sent: OutboundEmail[] = [];
  const { logger, lines } = captureLogger();
  const result = await deliver(
    { email: address, newsletter: true, company: "" },
    recordingClient(sent),
    logger,
  );

  expect(result).toEqual({ status: "success" });
  expect(sent).toEqual([
    {
      from: "noticias@example.com",
      to: "estudio@example.com",
      subject: "Nuevo pedido de No somos islas",
      text: [
        `Correo: ${address}`,
        "Fecha UTC: 2026-01-02T03:04:05.000Z",
        "Recurso: No somos islas",
        "Novedades: Sí",
      ].join("\n"),
    },
    {
      from: "noticias@example.com",
      to: address,
      subject: "Tu ebook y audio de No somos islas",
      text: [
        'Gracias por pedir "No somos islas".',
        "",
        "Ebook: https://rutharias.emotia.ar/no-somos-islas/No_somos_islas_Ruth_Arias.pdf",
        "Audio: https://rutharias.emotia.ar/no-somos-islas/?origen=ebook#audio",
        "",
        "Novedades: Sí, quiero recibir novedades y recursos.",
        "",
        "Este sitio no guarda tu dirección. El aviso quedó en la bandeja de Emotia.",
        "Para no recibir más mensajes, respondé este correo.",
      ].join("\n"),
    },
  ]);
  const log = lines.join("");
  expect(log).toContain("Islas access sent");
  expect(log).not.toContain(address);
});

it("states the newsletter was not requested when the box is unchecked", async () => {
  const sent: OutboundEmail[] = [];
  const { logger } = captureLogger();
  await deliver({ email: ` ${address} `, newsletter: false }, recordingClient(sent), logger);

  expect(sent[0]?.text).toContain("Novedades: No");
  expect(sent[0]?.text).toContain(`Correo: ${address}\n`);
  expect(sent[1]?.to).toBe(address);
  expect(sent[1]?.text).toContain("No pediste recibir novedades.");
  expect(sent[1]?.text).not.toContain(islasAccessMessages.newsletterYes);
});

it("rejects a malformed address without sending or logging it", async () => {
  const sent: OutboundEmail[] = [];
  const { logger, lines } = captureLogger();
  const result = await deliver(
    { email: "no-es-un-correo", newsletter: true },
    recordingClient(sent),
    logger,
  );

  expect(result).toEqual({
    status: "invalid",
    field: "email",
    message: "Revisá el correo electrónico ingresado.",
  });
  expect(sent).toHaveLength(0);
  expect(lines.join("")).not.toContain("no-es-un-correo");
});

it("rejects an empty address", async () => {
  const sent: OutboundEmail[] = [];
  const { logger } = captureLogger();
  const result = await deliver({ email: "", newsletter: false }, recordingClient(sent), logger);

  expect(result.status).toBe("invalid");
  expect(sent).toHaveLength(0);
});

it("pretends to succeed when the honeypot is filled and does not send", async () => {
  const sent: OutboundEmail[] = [];
  const { logger, lines } = captureLogger();
  const result = await deliver(
    { email: address, newsletter: true, company: "acme" },
    recordingClient(sent),
    logger,
  );

  expect(result).toEqual({ status: "success" });
  expect(sent).toHaveLength(0);
  expect(lines.join("")).not.toContain(address);
});

it("refuses to send when the mail configuration is missing", async () => {
  const { logger, lines } = captureLogger();
  const result = await deliver({ email: address, newsletter: true }, null, logger, [
    "RESEND_API_KEY",
  ]);

  expect(result).toEqual({ status: "error" });
  const log = lines.join("");
  expect(log).toContain("Islas access refused");
  expect(log).toContain("RESEND_API_KEY");
  expect(log).not.toContain(address);
});

it("does not confirm the person when the notice fails", async () => {
  const sent: OutboundEmail[] = [];
  const { logger, lines } = captureLogger();
  const result = await deliver(
    { email: address, newsletter: true },
    failingOnCall(sent, 1),
    logger,
  );

  expect(result).toEqual({ status: "error" });
  expect(sent).toHaveLength(0);
  const log = lines.join("");
  expect(log).toContain('"failedLeg":"notice"');
  expect(log).not.toContain(address);
});

it("reports an error when the confirmation fails after the notice", async () => {
  const sent: OutboundEmail[] = [];
  const { logger, lines } = captureLogger();
  const result = await deliver(
    { email: address, newsletter: false },
    failingOnCall(sent, 2),
    logger,
  );

  expect(result).toEqual({ status: "error" });
  expect(sent.map((message) => message.to)).toEqual(["estudio@example.com"]);
  const log = lines.join("");
  expect(log).toContain('"failedLeg":"confirmation"');
  expect(log).not.toContain(address);
});
