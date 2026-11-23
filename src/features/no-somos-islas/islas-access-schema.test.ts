import { expect, it } from "vitest";
import { createIslasAccessSchema } from "@/features/no-somos-islas/islas-access-schema";
import { islasAccessMessages } from "@/features/no-somos-islas/messages";

const schema = createIslasAccessSchema();

it("trims the email and accepts a valid request", () => {
  const result = schema.safeParse({ email: "  persona@example.com ", newsletter: false });

  expect(result.success && result.data.email).toBe("persona@example.com");
});

it.each(["", "   ", "no-es-un-correo", `${"a".repeat(250)}@example.com`])(
  "rejects the email %#  with the contract message",
  (email) => {
    const result = schema.safeParse({ email, newsletter: true });

    expect(result.success).toBe(false);
    expect(!result.success && result.error.issues[0]?.message).toBe(islasAccessMessages.invalidEmail);
  },
);

it("requires the newsletter flag to be a boolean", () => {
  expect(schema.safeParse({ email: "persona@example.com" }).success).toBe(false);
});

it("rejects a honeypot longer than 500 characters", () => {
  const result = schema.safeParse({
    email: "persona@example.com",
    newsletter: false,
    company: "a".repeat(501),
  });

  expect(result.success).toBe(false);
});
