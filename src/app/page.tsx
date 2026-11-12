import type { Metadata } from "next";
import { HomePage } from "@/features/home/HomePage";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  robots: siteConfig.robots,
};

export default function Home() {
  return <HomePage />;
}
