import type { Metadata, Viewport } from "next";
import { TestPage } from "@/features/test/TestPage";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "¿Qué hacés cuando una discusión empieza a repetirse? | Emotia®",
  robots: siteConfig.robots,
};

export const viewport: Viewport = {
  themeColor: "#512681",
};

export default function TestRoute() {
  return <TestPage />;
}
