import { describe, expect, it } from "vitest";
import { isEbookEntry } from "@/features/no-somos-islas/ebook-entry";

describe("isEbookEntry", () => {
  it("accepts the QR link that lands on #audio", () => {
    expect(isEbookEntry("?utm_source=ebook&utm_medium=qr&utm_campaign=no_somos_islas", "#audio")).toBe(true);
  });

  it("accepts the tappable PDF link that lands on #audio", () => {
    expect(isEbookEntry("?utm_medium=pdf_link", "#audio")).toBe(true);
  });

  it("accepts origen=ebook as first or later parameter", () => {
    expect(isEbookEntry("?origen=ebook", "#audio")).toBe(true);
    expect(isEbookEntry("?a=1&origen=ebook", "#audio")).toBe(true);
  });

  it("rejects a valid origin without the #audio hash", () => {
    expect(isEbookEntry("?utm_medium=qr", "")).toBe(false);
    expect(isEbookEntry("?utm_medium=qr", "#inicio")).toBe(false);
  });

  it("rejects #audio without a known origin", () => {
    expect(isEbookEntry("", "#audio")).toBe(false);
    expect(isEbookEntry("?utm_medium=email", "#audio")).toBe(false);
    expect(isEbookEntry("?origen=otro", "#audio")).toBe(false);
  });

  it("rejects values or keys that only contain a known origin", () => {
    expect(isEbookEntry("?utm_medium=qrx", "#audio")).toBe(false);
    expect(isEbookEntry("?xutm_medium=qr", "#audio")).toBe(false);
    expect(isEbookEntry("?utm_medium=pdf_links", "#audio")).toBe(false);
    expect(isEbookEntry("?origen=ebookfoo", "#audio")).toBe(false);
  });
});
