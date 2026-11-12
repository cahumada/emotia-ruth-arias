import { Resend } from "resend";
import type { MailClient, MailConfig } from "@/features/newsletter/mail-config";

export function createResendMailClient(config: MailConfig): MailClient {
  const resend = new Resend(config.apiKey);

  return {
    async send(message) {
      const result = await resend.emails.send({
        from: message.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
      });

      if (result.error) {
        throw new Error("Resend rejected the newsletter message");
      }
    },
  };
}
