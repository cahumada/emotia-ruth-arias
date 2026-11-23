export type ConsentChoice = "granted" | "denied";

export const consentStorageKey = "emotia-analytics-consent";

type StorageProvider = () => Storage;

function isConsentChoice(value: string | null): value is ConsentChoice {
  return value === "granted" || value === "denied";
}

export function createConsentStore(getStorage: StorageProvider) {
  const listeners = new Set<() => void>();
  // Fallback when storage is blocked: the choice lasts for the current page session only.
  let sessionChoice: ConsentChoice | null = null;
  let isReopened = false;

  function emit() {
    listeners.forEach((listener) => listener());
  }

  function getChoice(): ConsentChoice | null {
    try {
      const stored = getStorage().getItem(consentStorageKey);
      if (isConsentChoice(stored)) return stored;
    } catch {
      // Storage blocked or unavailable: fall back to the in-memory choice.
    }
    return sessionChoice;
  }

  function setChoice(choice: ConsentChoice) {
    sessionChoice = choice;
    isReopened = false;
    try {
      getStorage().setItem(consentStorageKey, choice);
    } catch {
      // Storage blocked: the in-memory choice already applies.
    }
    emit();
  }

  function reopen() {
    isReopened = true;
    emit();
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  return {
    getChoice,
    getIsNoticeOpen: () => isReopened || getChoice() === null,
    // The server cannot read the browser's choice: it renders no notice and no script.
    getServerChoice: (): ConsentChoice | null => null,
    getServerIsNoticeOpen: () => false,
    setChoice,
    reopen,
    subscribe,
  };
}

export const consentStore = createConsentStore(() => window.localStorage);
