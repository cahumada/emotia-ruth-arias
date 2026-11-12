import { expect, it } from "vitest";
import { legacyRedirects } from "@/lib/legacy-redirects";

it("sends the designer html paths to the app routes", () => {
  expect(legacyRedirects).toEqual([
    { source: "/index.html", destination: "/", permanent: true },
    { source: "/test.html", destination: "/test", permanent: true },
    { source: "/aula.html", destination: "/aula", permanent: true },
  ]);
});
