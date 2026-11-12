import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("keeps the designer palette as theme tokens", () => {
  const theme = readFileSync("src/app/globals.css", "utf8");

  expect(theme).toContain("--color-vio: #512681");
  expect(theme).toContain("--color-lav: #e2cafd");
  expect(theme).toContain("--color-ink: #39235a");
  expect(theme).toContain("--color-focus: #024f97");
});
