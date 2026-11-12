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

test("newsletter validates the address before any send", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#emotia-newsletter")).toHaveAttribute("data-hydrated", "true");
  await page.getByLabel("Tu correo electrónico").fill("no-es-un-correo");
  await page.getByRole("button", { name: "Suscribirme" }).click();
  await expect(page.getByRole("status")).toHaveText("Revisá el correo electrónico ingresado.");
});
