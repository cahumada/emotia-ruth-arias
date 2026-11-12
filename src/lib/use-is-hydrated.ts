"use client";

import { useSyncExternalStore } from "react";

function subscribe(): () => void {
  return () => undefined;
}

export function useIsHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
