import type { NextConfig } from "next";
import { legacyRedirects } from "./src/lib/legacy-redirects";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  allowedDevOrigins: ["127.0.0.1"],
  async redirects() {
    return legacyRedirects.map((redirect) => ({ ...redirect }));
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
