const mailVariableNames = ["RESEND_API_KEY", "RESEND_FROM", "RESEND_TO"] as const;

export type MailConfig = {
  apiKey: string;
  from: string;
  to: string;
};

export type OutboundEmail = {
  from: string;
  to: string;
  subject: string;
  text: string;
};

export type MailClient = {
  send: (message: OutboundEmail) => Promise<void>;
};

export type MailConfigResult =
  | { config: MailConfig; missing: [] }
  | { config: null; missing: string[] };

export function readMailConfig(env: Record<string, string | undefined>): MailConfigResult {
  const missing = mailVariableNames.filter((name) => !env[name]?.trim());

  if (missing.length > 0) {
    return { config: null, missing: [...missing] };
  }

  return {
    config: {
      apiKey: env.RESEND_API_KEY?.trim() ?? "",
      from: env.RESEND_FROM?.trim() ?? "",
      to: env.RESEND_TO?.trim() ?? "",
    },
    missing: [],
  };
}
