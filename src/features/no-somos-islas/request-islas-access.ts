"use server";

import { headers } from "next/headers";
import { logger } from "@/lib/logger";
import { readMailConfig } from "@/lib/mail/mail-config";
import { createResendMailClient } from "@/lib/mail/resend-mail-client";
import {
  deliverIslasAccess,
  type IslasAccessResult,
} from "@/features/no-somos-islas/deliver-islas-access";

// Public on purpose: the page has no session. Next.js checks the request origin.
// The body is validated here, and a missing mail secret refuses every send.
export async function requestIslasAccess(input: unknown): Promise<IslasAccessResult> {
  const headerStore = await headers();
  const correlationId = headerStore.get("x-correlation-id") ?? crypto.randomUUID();
  const mail = readMailConfig(process.env);

  return deliverIslasAccess({
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
