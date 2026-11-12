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

test("home keeps the designer heading, anchors and noindex", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang", "es-AR");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex,\s*nofollow/,
  );
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
  await page.goto("/index.html");
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/test.html");
  await expect(page).toHaveURL(/\/test$/);
  await page.goto("/aula.html");
  await expect(page).toHaveURL(/\/aula$/);
});

test("test and aula render and stay out of the index", async ({ page }) => {
  await page.goto("/test");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex,\s*nofollow/,
  );
  await expect(page.getByRole("button", { name: "Empezar el test" })).toBeVisible();

  await page.goto("/aula");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex,\s*nofollow/,
  );
  await expect(page.getByRole("heading", { level: 1 })).toContainText("La misma pelea");
  await page.getByRole("tab", { name: "Cuadernillo" }).click();
  await expect(page.getByRole("button", { name: "Descargar cuadernillo ↓" })).toBeDisabled();
});

test("newsletter validates the address before any send", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Tu correo electrónico").fill("no-es-un-correo");
  await page.getByRole("button", { name: "Suscribirme" }).click();
  await expect(page.getByRole("status")).toHaveText("Revisá el correo electrónico ingresado.");
});
