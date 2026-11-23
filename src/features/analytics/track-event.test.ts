import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const choice = vi.hoisted(() => ({ value: null as "granted" | "denied" | null }));

vi.mock("@/features/analytics/consent-store", () => ({
  consentStore: { getChoice: () => choice.value },
}));

import { trackEvent, trackIslasEvent, trackIslasSignup } from "@/features/analytics/track-event";

describe("trackEvent", () => {
  const gtag = vi.fn();

  beforeEach(() => {
    gtag.mockClear();
    choice.value = null;
    vi.stubGlobal("window", { gtag });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the event with its exact payload when consent is granted", () => {
    choice.value = "granted";

    expect(trackIslasEvent("nsis_ebook_download_click")).toBe(true);

    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith("event", "nsis_ebook_download_click", { resource: "no_somos_islas" });
  });

  it.each([["denied" as const], [null]])("does nothing when the choice is %s", (value) => {
    choice.value = value;

    expect(trackIslasEvent("nsis_audio_start")).toBe(false);

    expect(gtag).not.toHaveBeenCalled();
  });

  it("does nothing when gtag is not loaded", () => {
    choice.value = "granted";
    vi.stubGlobal("window", {});

    expect(trackIslasEvent("nsis_audio_complete")).toBe(false);
  });

  it("does nothing without a window", () => {
    choice.value = "granted";
    vi.unstubAllGlobals();

    expect(trackEvent("nsis_qr_arrival", { resource: "no_somos_islas" })).toBe(false);
  });

  it("sends nsis_signup with newsletter yes or no and no other field", () => {
    choice.value = "granted";

    trackIslasSignup(true);
    trackIslasSignup(false);

    expect(gtag).toHaveBeenNthCalledWith(1, "event", "nsis_signup", { resource: "no_somos_islas", newsletter: "yes" });
    expect(gtag).toHaveBeenNthCalledWith(2, "event", "nsis_signup", { resource: "no_somos_islas", newsletter: "no" });
  });

  it("does not send nsis_signup without consent", () => {
    choice.value = "denied";

    expect(trackIslasSignup(true)).toBe(false);
    expect(gtag).not.toHaveBeenCalled();
  });
});
