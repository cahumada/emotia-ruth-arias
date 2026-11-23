import "@/features/analytics/gtag.d";
import { consentStore } from "@/features/analytics/consent-store";

type Resource = { resource: "no_somos_islas" };

// Closed payload shapes: no free-form string can reach Analytics, so an email cannot leak.
export type AnalyticsEvent =
  | { name: "nsis_signup"; params: Resource & { newsletter: "yes" | "no" } }
  | { name: "nsis_ebook_download_click"; params: Resource }
  | { name: "nsis_audio_start"; params: Resource }
  | { name: "nsis_audio_complete"; params: Resource }
  | { name: "nsis_qr_arrival"; params: Resource }
  | { name: "nsis_pdf_link_arrival"; params: Resource };

/** Sends the event to GA4 only with consent granted and gtag loaded. Returns whether it was sent. */
export function trackEvent(event: AnalyticsEvent): boolean {
  if (typeof window === "undefined") return false;
  if (consentStore.getChoice() !== "granted" || typeof window.gtag !== "function") return false;
  window.gtag("event", event.name, event.params);
  return true;
}

export function trackIslasEvent(name: Exclude<AnalyticsEvent["name"], "nsis_signup">): boolean {
  return trackEvent({ name, params: { resource: "no_somos_islas" } });
}

export function trackIslasSignup(newsletter: boolean): boolean {
  return trackEvent({
    name: "nsis_signup",
    params: { resource: "no_somos_islas", newsletter: newsletter ? "yes" : "no" },
  });
}
