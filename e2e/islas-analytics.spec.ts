import { expect, test, type Page } from "@playwright/test";

// Needs a production build made with NEXT_PUBLIC_GA_ID=G-TEST123456 and E2E_GA_ID set to the same id.
const builtGaId = process.env.E2E_GA_ID ?? "";
const arrivalUrl = "/no-somos-islas/?utm_source=ebook&utm_medium=qr&utm_campaign=no_somos_islas#audio";
const islasEvents = ["nsis_qr_arrival", "nsis_ebook_download_click", "nsis_audio_start", "nsis_audio_complete"];

test.skip(builtGaId === "", "The build has no NEXT_PUBLIC_GA_ID");

test.beforeEach(async ({ page }) => {
  // gtag.js is stubbed: the init script already defines window.gtag, which pushes to dataLayer.
  await page.route(/googletagmanager\.com\/gtag\/js/, (route) =>
    route.fulfill({ contentType: "application/javascript", body: "" }),
  );
  await page.route(/google-analytics\.com/, (route) => route.abort());
});

async function sentEvents(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    (window.dataLayer ?? [])
      .map((entry) => Array.from(entry as ArrayLike<unknown>))
      .filter((args) => args[0] === "event")
      .map((args) => String(args[1])),
  );
}

async function fullDataLayer(page: Page): Promise<string> {
  return page.evaluate(() => JSON.stringify((window.dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>))));
}

async function useIslasPage(page: Page, choice: "Aceptar" | "Rechazar") {
  await page.goto("/");
  await page.getByRole("button", { name: choice }).click();
  await expect(page.getByRole("region", { name: "Aviso de cookies" })).toHaveCount(0);
  await page.goto(arrivalUrl);
  await expect(page.locator("#audio.access-granted")).toBeVisible();
}

async function interact(page: Page) {
  await page.locator("#ebook-download").evaluate((link) => {
    link.addEventListener("click", (event) => event.preventDefault());
  });
  await page.locator("#ebook-download").click();
  await page.locator("#audio-player").evaluate((audio) => {
    audio.dispatchEvent(new Event("play"));
    audio.dispatchEvent(new Event("play"));
    audio.dispatchEvent(new Event("ended"));
  });
}

test("after accepting, the page sends its events once and never an email", async ({ page }) => {
  await useIslasPage(page, "Aceptar");
  await expect.poll(() => sentEvents(page)).toContain("nsis_qr_arrival");

  await interact(page);

  await expect.poll(() => sentEvents(page)).toEqual(expect.arrayContaining(islasEvents));
  const events = await sentEvents(page);
  expect(events.filter((name) => name === "nsis_qr_arrival")).toHaveLength(1);
  expect(events.filter((name) => name === "nsis_audio_start")).toHaveLength(1);
  expect(events.filter((name) => name === "nsis_audio_complete")).toHaveLength(1);
  expect(await fullDataLayer(page)).not.toContain("@");
});

test("after rejecting, none of the page events is sent", async ({ page }) => {
  await useIslasPage(page, "Rechazar");

  await interact(page);
  await page.waitForTimeout(1500);

  expect(await sentEvents(page)).toEqual([]);
  expect(await fullDataLayer(page)).not.toContain("@");
});
