import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
