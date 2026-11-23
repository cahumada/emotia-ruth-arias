"use client";

import { useSyncExternalStore } from "react";
import { consentStore } from "@/features/analytics/consent-store";
import { consentMessages } from "@/features/analytics/messages";

const buttonClass =
  "min-h-11 rounded-full border-2 border-vio px-5 py-2 text-sm font-bold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus";

export function ConsentBanner() {
  const isOpen = useSyncExternalStore(
    consentStore.subscribe,
    consentStore.getIsNoticeOpen,
    consentStore.getServerIsNoticeOpen,
  );

  if (!isOpen) return null;

  return (
    <div
      aria-label={consentMessages.region}
      className="fixed inset-x-0 bottom-0 z-50 max-h-[50vh] overflow-y-auto border-t border-line bg-lav p-4 text-ink shadow-[0_-6px_24px_rgba(81,38,129,0.12)] sm:p-5"
      role="region"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="m-0 text-sm leading-relaxed">{consentMessages.text}</p>
        <div className="flex shrink-0 gap-3">
          <button
            className={`${buttonClass} bg-vio text-white`}
            onClick={() => consentStore.setChoice("granted")}
            type="button"
          >
            {consentMessages.accept}
          </button>
          <button
            className={`${buttonClass} bg-white text-vio`}
            onClick={() => consentStore.setChoice("denied")}
            type="button"
          >
            {consentMessages.reject}
          </button>
        </div>
      </div>
    </div>
  );
}
