import type { Metadata } from "next";
import { ConsentBanner } from "@/features/analytics/ConsentBanner";
import { GoogleAnalytics } from "@/features/analytics/GoogleAnalytics";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  robots: siteConfig.robots,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={siteConfig.locale}>
      <body>
        {children}
        <ConsentBanner />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
