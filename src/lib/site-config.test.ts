import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { siteConfig } from "@/lib/site-config";

it("allows search indexes after publish was authorized", () => {
  expect(siteConfig.robots).toEqual({ index: true, follow: true });
});

it("ignores secrets and build output and keeps the env example", () => {
  const gitignore = readFileSync(".gitignore", "utf8");

  expect(gitignore).toMatch(/^\.env\*$/m);
  expect(gitignore).toMatch(/^!\.env\.example$/m);
  expect(gitignore).toMatch(/^\/node_modules$/m);
  expect(gitignore).toMatch(/^\/\.next\/$/m);
  expect(gitignore).not.toMatch(/pnpm-lock\.yaml/);
});
