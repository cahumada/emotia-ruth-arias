import { expect, test } from "@playwright/test";

const anchors = [
  "inicio",
  "enfoque",
  "terapia",
  "test",
  "recursos",
  "sobre-mi",
  "situaciones",
  "preguntas",
  "novedades",
  "main",
];

test("home keeps the designer heading and anchors and is indexable", async ({ page }) => {
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });

  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang", "es-AR");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /index,\s*follow/);
  await expect(page.getByText("Demo para revisión")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "¿Sentís que hay algo en tus relaciones",
  );
  const heroGap = await page.locator(".hero-copy .lead").evaluate((element) => {
    const next = element.nextElementSibling;
    if (!(next instanceof HTMLElement)) {
      return 0;
    }
    return next.getBoundingClientRect().top - element.getBoundingClientRect().bottom;
  });
  expect(heroGap).toBeGreaterThanOrEqual(22);

  for (const anchor of anchors) {
    await expect(page.locator(`#${anchor}`)).toHaveCount(1);
  }

  await expect(page.getByRole("link", { name: "Conocer el ebook ↗" })).toHaveAttribute(
    "href",
    "https://ebook.emotia.ar/",
  );
  await expect(page.getByText("Enlace a confirmar")).toBeVisible();
});

test("legacy html paths redirect to the app routes", async ({ page }) => {
  await page.goto("/index.html", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/test.html", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/test$/);
  await page.goto("/aula.html", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/aula$/);
});

test("test and aula render and are indexable", async ({ page }) => {
  await page.goto("/test", { waitUntil: "domcontentloaded" });
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /index,\s*follow/);
  await expect(page.getByText("No publicado")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Empezar el test" })).toBeVisible();

  await page.goto("/aula", { waitUntil: "domcontentloaded" });
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /index,\s*follow/);
  await expect(page.getByText("Prototipo de revisión")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("La misma pelea");
  await expect(page.getByRole("tablist", { name: "Elegí cómo trabajar" })).toHaveAttribute(
    "data-hydrated",
    "true",
  );
  await page.getByRole("tab", { name: "Cuadernillo" }).click();
  await expect(page.getByRole("button", { name: "Descargar cuadernillo ↓" })).toBeDisabled();
});

test("newsletter keeps subscribe unavailable until the address is valid", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#emotia-newsletter")).toHaveAttribute("data-hydrated", "true");
  const email = page.getByLabel("Tu correo electrónico");
  const submit = page.getByRole("button", { name: "Suscribirme" });

  await expect(submit).toBeDisabled();
  await email.fill("no-es-un-correo");
  await expect(submit).toBeDisabled();
  await email.press("Enter");
  await expect(page.getByRole("status")).toHaveText("");

  await email.fill("persona@correo.com");
  await expect(submit).toBeEnabled();
  await email.fill("persona@");
  await expect(submit).toBeDisabled();
});

test("home exposes the web and mobile app icons", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const links = await page.locator('link[rel="icon"], link[rel="apple-touch-icon"]').evaluateAll((nodes) =>
    nodes.map((node) => ({
      rel: node.getAttribute("rel"),
      href: node.getAttribute("href"),
      sizes: node.getAttribute("sizes"),
      type: node.getAttribute("type"),
    })),
  );

  expect(links.some((link) => link.rel === "icon" && link.href?.includes("favicon.ico"))).toBe(true);
  expect(links.some((link) => link.type === "image/svg+xml")).toBe(true);
  expect(links.some((link) => link.sizes === "16x16")).toBe(true);
  expect(links.some((link) => link.sizes === "32x32")).toBe(true);
  expect(links.some((link) => link.sizes === "192x192")).toBe(true);
  expect(links.some((link) => link.sizes === "512x512")).toBe(true);
  expect(links.some((link) => link.rel === "apple-touch-icon" && link.sizes === "180x180")).toBe(true);

  for (const link of links) {
    const response = await page.request.get(new URL(link.href ?? "", page.url()).href);
    expect(response.status(), link.href ?? "").toBe(200);
  }
});

test("newsletter explains a missing consent next to the checkbox", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const form = page.locator("#emotia-newsletter");
  await expect(form).toHaveAttribute("data-hydrated", "true");
  await page.getByLabel("Tu correo electrónico").fill("persona@correo.com");
  await page.getByRole("button", { name: "Suscribirme" }).click();

  const consent = form.getByRole("checkbox", { name: /Quiero recibir novedades de Emotia por email/ });
  const alert = form.getByRole("alert");
  await expect(consent).toHaveAttribute("aria-invalid", "true");
  await expect(alert).toBeVisible();
  await expect(alert).toHaveText(
    "Para suscribirte, primero tenés que aceptar recibir novedades.",
  );
  await expect(form.getByRole("status")).toHaveText("");

  const placement = await form.locator(".news-accept").evaluate((label) => {
    const error = document.getElementById("news-consent-error");
    const note = document.getElementById("news-info");
    if (!(error instanceof HTMLElement) || !(note instanceof HTMLElement)) {
      return null;
    }
    const labelBox = label.getBoundingClientRect();
    const errorBox = error.getBoundingClientRect();
    const noteBox = note.getBoundingClientRect();
    return {
      followsLabel: label.nextElementSibling === error,
      gap: errorBox.top - labelBox.bottom,
      aboveNote: errorBox.bottom <= noteBox.top + 1,
      height: errorBox.height,
      background: getComputedStyle(error).backgroundColor,
    };
  });

  expect(placement?.followsLabel).toBe(true);
  expect(placement?.gap ?? -1).toBeGreaterThanOrEqual(0);
  expect(placement?.gap ?? 99).toBeLessThanOrEqual(24);
  expect(placement?.aboveNote).toBe(true);
  expect(placement?.height ?? 0).toBeGreaterThan(20);
  expect(placement?.background).toBe("rgb(255, 255, 255)");
});
