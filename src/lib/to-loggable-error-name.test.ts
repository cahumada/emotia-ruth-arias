import { expect, it } from "vitest";
import { toLoggableErrorName } from "@/lib/to-loggable-error-name";

it("keeps a short error name and drops anything else", () => {
  expect(toLoggableErrorName("TypeError")).toBe("TypeError");
  expect(toLoggableErrorName("user@example.com")).toBe("UnknownError");
  expect(toLoggableErrorName("")).toBe("UnknownError");
});
