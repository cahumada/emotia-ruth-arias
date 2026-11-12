export const answerLetters = ["A", "B", "C", "D"] as const;

export type AnswerLetter = (typeof answerLetters)[number];
export type OutcomeKey = AnswerLetter | "M";

export function scoreAnswers(answers: ReadonlyArray<AnswerLetter | null>): OutcomeKey {
  const counts = answerLetters.map(
    (letter) => answers.filter((answer) => answer === letter).length,
  );
  const highest = Math.max(...counts);

  if (counts.filter((count) => count === highest).length > 1) {
    return "M";
  }

  return answerLetters[counts.indexOf(highest)] ?? "M";
}

export function buildResultCopy(result: {
  title: string;
  paras: readonly string[];
  question: string;
}): string {
  return [
    result.title,
    ...result.paras,
    "Una pregunta para seguir explorando:",
    result.question,
    "Emotia® · https://www.emotia.ar/clase-la-misma-pelea",
  ].join("\n\n");
}
