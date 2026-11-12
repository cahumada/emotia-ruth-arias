export const classPauses = [
  {
    id: "n1",
    timeline: "Pausa 01",
    kicker: "PAUSA 01",
    label: "¿En qué lugar de la danza estás vos?",
    minutes: "5–7 minutos",
    placeholder: "Anotá aquello que te gustaría recordar…",
  },
  {
    id: "n2",
    timeline: "Pausa 02",
    kicker: "PAUSA 02",
    label: "La pregunta que no podés hacerte directamente",
    minutes: "5–7 minutos",
    placeholder: "Escribí a tu ritmo…",
  },
  {
    id: "n3",
    timeline: "Pausa 03",
    kicker: "PAUSA 03",
    label: "Mapear tu ciclo",
    minutes: "7–10 minutos",
    placeholder: "Registrá las observaciones de tu mapa…",
  },
] as const;

export function buildNotesDocument(notes: readonly [string, string, string]): string {
  const lines = ["EMOTIA® · LA MISMA PELEA, OTRA VEZ", "MIS NOTAS DE LA CLASE", ""];

  classPauses.forEach((pause, index) => {
    lines.push(
      `PAUSA ${index + 1} · ${pause.label}`,
      notes[index]?.trim() || "(sin completar)",
      "",
    );
  });

  return lines.join("\n");
}
