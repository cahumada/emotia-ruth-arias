import type { NextConfig } from "next";
import { legacyRedirects } from "./src/lib/legacy-redirects";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  allowedDevOrigins: ["127.0.0.1"],
  async redirects() {
    return legacyRedirects.map((redirect) => ({ ...redirect }));
  },
  async headers() {
    return [
      {
        // One week of browser and CDN cache for the ebook, the audio and the cover;
        // `:file+` keeps the page route itself out.
        source: "/no-somos-islas/:file+",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
    ];
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
