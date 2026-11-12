import { z } from "zod";
import { newsletterMessages } from "@/features/newsletter/messages";

export function createNewsletterSchema() {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, { error: newsletterMessages.invalidEmail })
      .max(254, { error: newsletterMessages.invalidEmail })
      .email({ error: newsletterMessages.invalidEmail }),
    consent: z.boolean().refine((isAccepted) => isAccepted, {
      error: newsletterMessages.missingConsent,
    }),
    company: z.string().max(500).optional(),
  });
}

export type NewsletterFormValues = z.infer<ReturnType<typeof createNewsletterSchema>>;
