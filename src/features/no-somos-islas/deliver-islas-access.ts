import type { Logger } from "pino";
import { toLoggableErrorName } from "@/lib/to-loggable-error-name";
import type { MailClient } from "@/lib/mail/mail-config";
import { createIslasAccessSchema } from "@/features/no-somos-islas/islas-access-schema";
import { islasAccessMessages } from "@/features/no-somos-islas/messages";

export type IslasAccessResult =
  | { status: "success" }
  | { status: "invalid"; field: "email"; message: string }
  | { status: "error" };

type DeliverIslasAccessInput = {
  input: unknown;
  mailClient: MailClient | null;
  from: string | null;
  to: string | null;
  now: Date;
  logger: Logger;
  correlationId: string;
  missingConfig: string[];
};

const schema = createIslasAccessSchema();

export async function deliverIslasAccess({
  input,
  mailClient,
  from,
  to,
  now,
  logger,
  correlationId,
  missingConfig,
}: DeliverIslasAccessInput): Promise<IslasAccessResult> {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    const companyOnly = parsed.error.issues.every((issue) => issue.path[0] === "company");

    if (companyOnly) {
      logger.info({ outcome: "ignored", correlationId }, "Islas access ignored");
      return { status: "success" };
    }

    logger.warn({ reason: "invalid", correlationId }, "Islas access rejected");
    return { status: "invalid", field: "email", message: islasAccessMessages.invalidEmail };
  }

  if ((parsed.data.company ?? "").trim().length > 0) {
    logger.info({ outcome: "ignored", correlationId }, "Islas access ignored");
    return { status: "success" };
  }

  if (!mailClient || !from || !to) {
    logger.warn(
      { reason: "missing-config", correlationId, missing: missingConfig },
      "Islas access refused",
    );
    return { status: "error" };
  }

  // La bandeja del estudio es el único registro. La confirmación sale solo
  // después de que ese aviso fue aceptado.
  const notice = buildIslasNoticeEmail(from, to, parsed.data.email, parsed.data.newsletter, now);
  const confirmation = buildIslasConfirmationEmail(from, parsed.data.email, parsed.data.newsletter);

  try {
    await mailClient.send(notice);
  } catch (error) {
    logSendFailure(logger, correlationId, error, "notice");
    return { status: "error" };
  }

  try {
    await mailClient.send(confirmation);
  } catch (error) {
    logSendFailure(logger, correlationId, error, "confirmation");
    return { status: "error" };
  }

  logger.info({ outcome: "sent", correlationId }, "Islas access sent");
  return { status: "success" };
}

function logSendFailure(
  logger: Logger,
  correlationId: string,
  error: unknown,
  failedLeg: "notice" | "confirmation",
): void {
  const errorName = error instanceof Error ? error.name : "Error";

  logger.error(
    { correlationId, errorName: toLoggableErrorName(errorName), failedLeg },
    "Islas access send failed",
  );
}

export function buildIslasNoticeEmail(
  from: string,
  inbox: string,
  address: string,
  wantsNewsletter: boolean,
  now: Date,
) {
  return {
    from,
    to: inbox,
    subject: islasAccessMessages.noticeSubject,
    text: [
      `Correo: ${address}`,
      `Fecha UTC: ${now.toISOString()}`,
      `Recurso: ${islasAccessMessages.noticeResource}`,
      `Novedades: ${wantsNewsletter ? "Sí" : "No"}`,
    ].join("\n"),
  };
}

export function buildIslasConfirmationEmail(from: string, to: string, wantsNewsletter: boolean) {
  return {
    from,
    to,
    subject: islasAccessMessages.confirmationSubject,
    text: [
      islasAccessMessages.confirmationIntro,
      "",
      `Ebook: ${islasAccessMessages.ebookUrl}`,
      `Audio: ${islasAccessMessages.audioUrl}`,
      "",
      `Novedades: ${
        wantsNewsletter ? islasAccessMessages.newsletterYes : islasAccessMessages.newsletterNo
      }`,
      "",
      islasAccessMessages.confirmationPrivacy,
      islasAccessMessages.confirmationOptOut,
    ].join("\n"),
  };
}
