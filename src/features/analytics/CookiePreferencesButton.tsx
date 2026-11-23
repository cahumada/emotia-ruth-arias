"use client";

import { consentStore } from "@/features/analytics/consent-store";
import { consentMessages } from "@/features/analytics/messages";

export function CookiePreferencesButton() {
  return (
    <button
      className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-[length:inherit] text-inherit underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
      onClick={consentStore.reopen}
      type="button"
    >
      {consentMessages.preferences}
    </button>
  );
}
