"use client";

import Script from "next/script";
import { useEffect, useSyncExternalStore } from "react";
import "@/features/analytics/gtag.d";
import { consentStore } from "@/features/analytics/consent-store";

const gaId = process.env.NEXT_PUBLIC_GA_ID;

export function GoogleAnalytics() {
  const choice = useSyncExternalStore(
    consentStore.subscribe,
    consentStore.getChoice,
    consentStore.getServerChoice,
  );
  const isEnabled = choice === "granted" && Boolean(gaId);

  useEffect(() => {
    if (!gaId) return;
    // gtag.js reads this flag before sending anything, so a rejection stops events at once.
    window[`ga-disable-${gaId}`] = !isEnabled;
    if (choice === "denied" && typeof window.gtag === "function") {
      window.gtag("consent", "update", { analytics_storage: "denied" });
    }
  }, [choice, isEnabled]);

  if (!isEnabled) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${gaId}');`}
      </Script>
    </>
  );
}
