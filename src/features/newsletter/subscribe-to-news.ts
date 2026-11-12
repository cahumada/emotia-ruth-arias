"use server";

import { headers } from "next/headers";
import { logger } from "@/lib/logger";
import { deliverNewsletter, type SubscribeResult } from "@/features/newsletter/deliver-newsletter";
import { readMailConfig } from "@/features/newsletter/mail-config";
import { createResendMailClient } from "@/features/newsletter/resend-mail-client";

// Public on purpose: the page has no session. Next.js checks the request origin.
// The body is validated here, and a missing mail secret refuses every send.
export async function subscribeToNews(input: unknown): Promise<SubscribeResult> {
  const headerStore = await headers();
  const correlationId = headerStore.get("x-correlation-id") ?? crypto.randomUUID();
  const mail = readMailConfig(process.env);

  return deliverNewsletter({
    input,
    mailClient: mail.config ? createResendMailClient(mail.config) : null,
    from: mail.config?.from ?? null,
    to: mail.config?.to ?? null,
    now: new Date(),
    logger,
    correlationId,
    missingConfig: mail.missing,
  });
}
