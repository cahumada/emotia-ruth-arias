import { expect, it } from "vitest";
import { buildResultCopy, scoreAnswers } from "@/features/test/score-test";
import { testResults } from "@/features/test/test-content";

it("returns the letter that appears most often", () => {
  expect(scoreAnswers(["B", "B", "B", "A", "C", "D"])).toBe("B");
  expect(scoreAnswers(["A", "A", "A", "A", "A", "A"])).toBe("A");
});

it("returns M when two letters tie for the highest count", () => {
  expect(scoreAnswers(["A", "A", "A", "B", "B", "B"])).toBe("M");
  expect(scoreAnswers(["A", "B", "C", "D", "A", "B"])).toBe("M");
});

it("builds the clipboard text from the orientative result", () => {
  const result = testResults.A;
  const copy = buildResultCopy(result);

  expect(copy.startsWith(result.title)).toBe(true);
  expect(copy).toContain(result.question);
  expect(copy).toContain("https://www.emotia.ar/clase-la-misma-pelea");
});
