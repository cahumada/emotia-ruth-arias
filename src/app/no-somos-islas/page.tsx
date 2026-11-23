import type { Metadata, Viewport } from "next";
import { IslasPage } from "@/features/no-somos-islas/IslasPage";
import { islasMeta } from "@/features/no-somos-islas/messages";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: islasMeta.title,
  description: islasMeta.description,
  robots: siteConfig.robots,
};

export const viewport: Viewport = {
  themeColor: "#512681",
};

export default function NoSomosIslasRoute() {
  return <IslasPage />;
}