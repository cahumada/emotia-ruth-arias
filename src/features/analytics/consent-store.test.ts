import { describe, expect, it, vi } from "vitest";
import { createConsentStore, consentStorageKey } from "@/features/analytics/consent-store";

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => void values.delete(key),
    setItem: (key, value) => void values.set(key, value),
  };
}

function throwingStorage(): Storage {
  const fail = () => {
    throw new Error("storage blocked");
  };
  return { length: 0, clear: fail, getItem: fail, key: fail, removeItem: fail, setItem: fail };
}

describe("consent store", () => {
  it("has no choice and shows the notice by default", () => {
    const store = createConsentStore(() => memoryStorage());

    expect(store.getChoice()).toBeNull();
    expect(store.getIsNoticeOpen()).toBe(true);
  });

  it("persists a granted choice and closes the notice", () => {
    const storage = memoryStorage();
    const store = createConsentStore(() => storage);

    store.setChoice("granted");

    expect(store.getChoice()).toBe("granted");
    expect(store.getIsNoticeOpen()).toBe(false);
    expect(storage.getItem(consentStorageKey)).toBe("granted");
    expect(createConsentStore(() => storage).getChoice()).toBe("granted");
  });

  it("persists a denied choice", () => {
    const storage = memoryStorage();
    const store = createConsentStore(() => storage);

    store.setChoice("denied");

    expect(store.getChoice()).toBe("denied");
    expect(createConsentStore(() => storage).getChoice()).toBe("denied");
  });

  it("ignores an unknown stored value", () => {
    const storage = memoryStorage();
    storage.setItem(consentStorageKey, "maybe");

    expect(createConsentStore(() => storage).getChoice()).toBeNull();
  });

  it("reopens the notice without losing the stored choice", () => {
    const store = createConsentStore(() => memoryStorage());
    store.setChoice("denied");

    store.reopen();

    expect(store.getIsNoticeOpen()).toBe(true);
    expect(store.getChoice()).toBe("denied");
  });

  it("notifies subscribers on change and stops after unsubscribe", () => {
    const store = createConsentStore(() => memoryStorage());
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.setChoice("granted");
    unsubscribe();
    store.reopen();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("does not crash when storage throws and keeps the choice for the session", () => {
    const store = createConsentStore(() => throwingStorage());

    expect(store.getChoice()).toBeNull();
    expect(() => store.setChoice("denied")).not.toThrow();
    expect(store.getChoice()).toBe("denied");
  });

  it("does not crash when storage is unavailable", () => {
    const store = createConsentStore(() => {
      throw new Error("no storage");
    });

    expect(store.getChoice()).toBeNull();
    expect(store.getServerChoice()).toBeNull();
    expect(store.getServerIsNoticeOpen()).toBe(false);
  });
});
