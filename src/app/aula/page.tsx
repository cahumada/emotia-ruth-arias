import type { Metadata, Viewport } from "next";
import { AulaPage } from "@/features/aula/AulaPage";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "La misma pelea, otra vez · Emotia® · Vista de revisión",
  robots: siteConfig.robots,
};

export const viewport: Viewport = {
  themeColor: "#E2CAFD",
};

export default function AulaRoute() {
  return <AulaPage />;
}
