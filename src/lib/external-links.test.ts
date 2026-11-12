import { expect, it } from "vitest";
import { externalLinks } from "@/lib/external-links";

it("keeps the designer destinations", () => {
  expect(externalLinks.booking).toBe(
    "https://app.emotia.ar/org/emotia/bookings/TRqG-Obv-lmYP6PP",
  );
  expect(externalLinks.ebook).toBe("https://ebook.emotia.ar/");
  expect(externalLinks.clase).toBe("https://www.emotia.ar/clase-la-misma-pelea");
  expect(externalLinks.emotia).toBe("https://www.emotia.ar/");
  expect(externalLinks.emotiaHome).toBe("https://www.emotia.ar");
  expect(externalLinks.instagram).toBe("https://www.instagram.com/lic_rutharias/");
  expect(externalLinks.tiktok).toBe("https://www.tiktok.com/@lic_rutharias");
  expect(externalLinks.youtube).toBe("https://www.youtube.com/@ruthariaspsicologa");
  expect(externalLinks.linkedin).toBe("https://www.linkedin.com/in/ruth-arias/");
});
