import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { siteConfig } from "@/lib/site-config";

it("keeps the site out of search indexes until publish is authorized", () => {
  expect(siteConfig.robots).toEqual({ index: false, follow: false });
});

it("ignores secrets and build output and keeps the env example", () => {
  const gitignore = readFileSync(".gitignore", "utf8");

  expect(gitignore).toMatch(/^\.env\*$/m);
  expect(gitignore).toMatch(/^!\.env\.example$/m);
  expect(gitignore).toMatch(/^\/node_modules$/m);
  expect(gitignore).toMatch(/^\/\.next\/$/m);
  expect(gitignore).not.toMatch(/pnpm-lock\.yaml/);
});
