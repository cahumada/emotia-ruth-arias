import { expect, it } from "vitest";
import { createNewsletterSchema, isNewsletterEmailValid } from "@/features/newsletter/newsletter-schema";

const schema = createNewsletterSchema();

it("rejects an address that is not an email", () => {
  const parsed = schema.safeParse({ email: "no-es-un-correo", consent: true, company: "" });

  expect(parsed.success).toBe(false);
});

it("rejects a signup without consent", () => {
  const parsed = schema.safeParse({
    email: "persona@example.com",
    consent: false,
    company: "",
  });

  expect(parsed.success).toBe(false);
  if (!parsed.success) {
    expect(parsed.error.issues.some((issue) => issue.path[0] === "consent")).toBe(true);
  }
});

it("keeps subscribe unavailable until the address is a valid email", () => {
  expect(isNewsletterEmailValid("")).toBe(false);
  expect(isNewsletterEmailValid("   ")).toBe(false);
  expect(isNewsletterEmailValid("no-es-un-correo")).toBe(false);
  expect(isNewsletterEmailValid("  persona@example.com  ")).toBe(true);
});

it("accepts an address and an explicit consent", () => {
  const parsed = schema.safeParse({
    email: "  persona@example.com  ",
    consent: true,
    company: "",
  });

  expect(parsed.success).toBe(true);
  if (parsed.success) {
    expect(parsed.data.email).toBe("persona@example.com");
  }
});
