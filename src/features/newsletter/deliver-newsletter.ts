import type { Logger } from "pino";
import { toLoggableErrorName } from "@/lib/to-loggable-error-name";
import type { MailClient } from "@/features/newsletter/mail-config";
import { newsletterMessages } from "@/features/newsletter/messages";
import { createNewsletterSchema } from "@/features/newsletter/newsletter-schema";

export type SubscribeResult =
  | { status: "success" }
  | { status: "invalid"; field: "email" | "consent"; message: string }
  | { status: "error" };

type DeliverNewsletterInput = {
  input: unknown;
  mailClient: MailClient | null;
  from: string | null;
  to: string | null;
  now: Date;
  logger: Logger;
  correlationId: string;
  missingConfig: string[];
};

const schema = createNewsletterSchema();

export async function deliverNewsletter({
  input,
  mailClient,
  from,
  to,
  now,
  logger,
  correlationId,
  missingConfig,
}: DeliverNewsletterInput): Promise<SubscribeResult> {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    const companyOnly = parsed.error.issues.every((issue) => issue.path[0] === "company");

    if (companyOnly) {
      logger.info({ outcome: "ignored", correlationId }, "Newsletter signup ignored");
      return { status: "success" };
    }

    logger.warn({ reason: "invalid", correlationId }, "Newsletter signup rejected");
    const emailIssue = parsed.error.issues.find((issue) => issue.path[0] === "email");

    if (emailIssue) {
      return {
        status: "invalid",
        field: "email",
        message: newsletterMessages.invalidEmail,
      };
    }

    return {
      status: "invalid",
      field: "consent",
      message: newsletterMessages.missingConsent,
    };
  }

  if ((parsed.data.company ?? "").trim().length > 0) {
    logger.info({ outcome: "ignored", correlationId }, "Newsletter signup ignored");
    return { status: "success" };
  }

  if (!mailClient || !from || !to) {
    logger.warn(
      { reason: "missing-config", correlationId, missing: missingConfig },
      "Newsletter send refused",
    );
    return { status: "error" };
  }

  // La bandeja del estudio es el único registro. La confirmación sale solo
  // después de que ese aviso fue aceptado.
  const notice = buildNoticeEmail(from, to, parsed.data.email, now);
  const confirmation = buildConfirmationEmail(from, parsed.data.email);

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

  logger.info({ outcome: "sent", correlationId }, "Newsletter notices sent");
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
    "Newsletter send failed",
  );
}

export function buildConfirmationEmail(from: string, to: string) {
  return {
    from,
    to,
    subject: newsletterMessages.confirmationSubject,
    text: [
      newsletterMessages.confirmationIntro,
      "",
      `Consentimiento: ${newsletterMessages.consent}`,
      "",
      newsletterMessages.confirmationPrivacy,
      newsletterMessages.confirmationOptOut,
    ].join("\n"),
  };
}

export function buildNoticeEmail(from: string, inbox: string, address: string, now: Date) {
  return {
    from,
    to: inbox,
    subject: newsletterMessages.noticeSubject,
    text: [
      `Correo: ${address}`,
      `Fecha UTC: ${now.toISOString()}`,
      `Consentimiento: ${newsletterMessages.consent}`,
    ].join("\n"),
  };
}
