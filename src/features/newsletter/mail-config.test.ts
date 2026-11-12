import { expect, it } from "vitest";
import { readMailConfig } from "@/features/newsletter/mail-config";

it("names every missing mail variable", () => {
  expect(readMailConfig({}).missing).toEqual(["RESEND_API_KEY", "RESEND_FROM", "RESEND_TO"]);
  expect(readMailConfig({}).config).toBeNull();
});

it("reads the three variables when they are present", () => {
  const result = readMailConfig({
    RESEND_API_KEY: "re_example",
    RESEND_FROM: "noticias@example.com",
    RESEND_TO: "estudio@example.com",
  });

  expect(result.missing).toEqual([]);
  expect(result.config).toEqual({
    apiKey: "re_example",
    from: "noticias@example.com",
    to: "estudio@example.com",
  });
});
