import { expect, test, type Page } from "@playwright/test";

// The access form is never submitted here: the dev server may load real RESEND_* values and send mail.
const pdfEntries = [
  "/no-somos-islas/?utm_source=ebook&utm_medium=qr&utm_campaign=no_somos_islas#audio",
  "/no-somos-islas/?utm_source=ebook&utm_medium=pdf_link&utm_campaign=no_somos_islas#audio",
];

async function expectAudioLocked(page: Page) {
  await expect(page.locator(".email-gate")).toBeVisible();
  await expect(page.locator("section#audio")).toBeHidden();
  await expect(page.locator("#ebook-download")).toBeHidden();
}

for (const entry of pdfEntries) {
  test(`PDF link ${entry} unlocks the audio section`, async ({ page }) => {
    await page.goto(entry, { waitUntil: "domcontentloaded" });

    const url = new URL(page.url());
    expect(url.pathname).toBe("/no-somos-islas");
    expect(url.search).toBe(new URL(entry, "http://x").search);
    expect(url.hash).toBe("#audio");

    const audio = page.locator("section#audio");
    await expect(audio).toHaveClass(/access-granted/);
    await expect(audio).toBeVisible();
    await expect(page.locator(".email-gate")).toBeHidden();
    await expect(page.locator("#ebook-download")).toBeVisible();
    await expect(audio).toBeInViewport();
  });
}

test("#audio without ebook params keeps the gate locked", async ({ page }) => {
  await page.goto("/no-somos-islas#audio", { waitUntil: "domcontentloaded" });
  await expectAudioLocked(page);
});

test("ebook params without #audio keep the gate locked", async ({ page }) => {
  await page.goto("/no-somos-islas?utm_medium=qr", { waitUntil: "domcontentloaded" });
  await expectAudioLocked(page);
});
