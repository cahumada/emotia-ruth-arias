import path from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Mocked delivery tests stay in the repo and are not executed until the
    // Resend send check is resumed.
    exclude: [...configDefaults.exclude, "src/features/newsletter/deliver-newsletter.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
