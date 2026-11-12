import { expect, it } from "vitest";
import { buildNotesDocument } from "@/features/aula/build-notes";

it("keeps an empty pause explicit and does not include the written note in a title line only", () => {
  const document = buildNotesDocument(["una observación", "", ""]);

  expect(document).toContain("EMOTIA® · LA MISMA PELEA, OTRA VEZ");
  expect(document).toContain("PAUSA 1 · ¿En qué lugar de la danza estás vos?");
  expect(document).toContain("una observación");
  expect(document).toContain("PAUSA 2 · La pregunta que no podés hacerte directamente");
  expect(document).toContain("(sin completar)");
});
