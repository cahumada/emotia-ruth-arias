import { readFileSync } from "node:fs";
import { join } from "node:path";
import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { isEbookEntry } from "@/features/no-somos-islas/ebook-entry";

const ROUTE_PREFIX = "https://rutharias.emotia.ar/no-somos-islas/";

function readPdfUris(): string[] {
  const pdf = readFileSync(join(process.cwd(), "public/no-somos-islas/No_somos_islas_Ruth_Arias.pdf"));
  const raw = pdf.toString("latin1");
  const chunks = [raw];
  const streamPattern = /stream\r?\n/g;
  for (let match = streamPattern.exec(raw); match; match = streamPattern.exec(raw)) {
    const start = match.index + match[0].length;
    const end = pdf.indexOf("endstream", start);
    if (end === -1) break;
    try {
      chunks.push(inflateSync(pdf.subarray(start, end)).toString("latin1"));
    } catch {
      // Not a FlateDecode stream (images, fonts): it holds no link annotations.
    }
    streamPattern.lastIndex = end;
  }
  return chunks.flatMap((chunk) => [...chunk.matchAll(/\/URI\s*\(([^)]*)\)/g)].map((found) => found[1]));
}

describe("ebook PDF links", () => {
  const routeUris = readPdfUris().filter((uri) => uri.startsWith(ROUTE_PREFIX));

  it("carries both the QR and the PDF link entries", () => {
    const mediums = routeUris.map((uri) => new URL(uri).searchParams.get("utm_medium"));
    expect(mediums).toContain("qr");
    expect(mediums).toContain("pdf_link");
  });

  it("only links to the route with an entry that unlocks the audio", () => {
    for (const uri of routeUris) {
      const { search, hash } = new URL(uri);
      expect(isEbookEntry(search, hash), uri).toBe(true);
    }
  });
});
