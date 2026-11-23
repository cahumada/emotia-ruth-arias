import { expect, test, type BrowserContext, type Page } from "@playwright/test";

// Set to the same id the production build was made with (NEXT_PUBLIC_GA_ID) to run the "with id" case.
const builtGaId = process.env.E2E_GA_ID ?? "";
const googlePattern = /googletagmanager\.com|google-analytics\.com/;
const noticeText = /Usamos Google Analytics para saber cómo se usa el sitio/;

function recordGoogleRequests(page: Page): string[] {
  const urls: string[] = [];
  page.on("request", (request) => {
    if (googlePattern.test(request.url())) urls.push(request.url());
  });
  return urls;
}

async function analyticsCookies(context: BrowserContext) {
  return (await context.cookies()).filter((cookie) => cookie.name.startsWith("_ga"));
}

test("shows the notice before a choice and loads nothing from Google", async ({ page, context }) => {
  const googleRequests = recordGoogleRequests(page);
  await page.goto("/");

  await expect(page.getByRole("region", { name: "Aviso de cookies" })).toBeVisible();
  await expect(page.getByText(noticeText)).toBeVisible();
  await expect(page.getByRole("button", { name: "Aceptar" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Rechazar" })).toBeVisible();
  await page.waitForLoadState("networkidle");

  expect(googleRequests).toEqual([]);
  expect(await analyticsCookies(context)).toEqual([]);
});

test("rejecting hides the notice, keeps Google out and remembers the choice", async ({ page, context }) => {
  const googleRequests = recordGoogleRequests(page);
  await page.goto("/");

  await page.getByRole("button", { name: "Rechazar" }).click();
  await expect(page.getByRole("region", { name: "Aviso de cookies" })).toHaveCount(0);
  await page.reload();
  await page.waitForLoadState("networkidle");
  // Hydration decides whether the notice shows, so wait for the footer link before asserting its absence.
  await expect(page.getByRole("button", { name: "Preferencias de cookies" })).toBeVisible();

  await expect(page.getByRole("region", { name: "Aviso de cookies" })).toHaveCount(0);
  expect(googleRequests).toEqual([]);
  expect(await analyticsCookies(context)).toEqual([]);
});

for (const path of ["/", "/test", "/aula", "/no-somos-islas"]) {
  test(`the footer link reopens the notice on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.getByRole("button", { name: "Rechazar" }).click();
    await expect(page.getByRole("region", { name: "Aviso de cookies" })).toHaveCount(0);

    await page.getByRole("button", { name: "Preferencias de cookies" }).click();

    await expect(page.getByRole("region", { name: "Aviso de cookies" })).toBeVisible();
  });
}

test("accepting without a measurement id requests no Google script", async ({ page, context }) => {
  test.skip(builtGaId !== "", "The build has NEXT_PUBLIC_GA_ID");
  const googleRequests = recordGoogleRequests(page);
  await page.goto("/");

  await page.getByRole("button", { name: "Aceptar" }).click();
  await expect(page.getByRole("region", { name: "Aviso de cookies" })).toHaveCount(0);
  await page.waitForLoadState("networkidle");

  expect(googleRequests).toEqual([]);
  expect(await analyticsCookies(context)).toEqual([]);
});

test("accepting with a measurement id requests gtag.js", async ({ page }) => {
  test.skip(builtGaId === "", "The build has no NEXT_PUBLIC_GA_ID");
  // Nothing reaches Google: the request is recorded and then aborted.
  await page.route(googlePattern, (route) => route.abort());
  const googleRequests = recordGoogleRequests(page);
  await page.goto("/");
  expect(googleRequests).toEqual([]);

  await page.getByRole("button", { name: "Aceptar" }).click();

  await expect
    .poll(() => googleRequests.some((url) => url.includes(`googletagmanager.com/gtag/js?id=${builtGaId}`)))
    .toBe(true);
});

test("rejecting with a measurement id requests no Google script", async ({ page }) => {
  test.skip(builtGaId === "", "The build has no NEXT_PUBLIC_GA_ID");
  await page.route(googlePattern, (route) => route.abort());
  const googleRequests = recordGoogleRequests(page);
  await page.goto("/");

  await page.getByRole("button", { name: "Rechazar" }).click();
  await page.waitForLoadState("networkidle");

  expect(googleRequests).toEqual([]);
});
