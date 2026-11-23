import { z } from "zod";
import { islasAccessMessages } from "@/features/no-somos-islas/messages";

export function createIslasAccessSchema() {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, { error: islasAccessMessages.invalidEmail })
      .max(254, { error: islasAccessMessages.invalidEmail })
      .email({ error: islasAccessMessages.invalidEmail }),
    newsletter: z.boolean(),
    company: z.string().max(500).optional(),
  });
}

export type IslasAccessValues = z.infer<ReturnType<typeof createIslasAccessSchema>>;
