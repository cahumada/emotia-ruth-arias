"use client";

import { useEffect, useRef, useState } from "react";
import { externalLinks } from "@/lib/external-links";
import { testChrome } from "@/features/test/messages";
import {
  answerLetters,
  buildResultCopy,
  scoreAnswers,
  type AnswerLetter,
} from "@/features/test/score-test";
import { testQuestions, testResults } from "@/features/test/test-content";

type Phase = "intro" | "quiz" | "result";

export function TestExperience() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<Array<AnswerLetter | null>>(() =>
    testQuestions.map(() => null),
  );
  const [copyMessage, setCopyMessage] = useState("");
  const questionTitleRef = useRef<HTMLHeadingElement>(null);
  const resultTitleRef = useRef<HTMLHeadingElement>(null);
  const question = testQuestions[current];
  const outcome = phase === "result" ? scoreAnswers(selected) : null;
  const result = outcome ? testResults[outcome] : null;
  const progress = Math.round((current / testQuestions.length) * 100);

  useEffect(() => {
    if (phase === "intro") {
      return;
    }

    const title = phase === "quiz" ? questionTitleRef.current : resultTitleRef.current;
    title?.focus({ preventScroll: true });
    title?.closest("section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [phase, current]);

  function choose(letter: AnswerLetter) {
    setSelected((currentAnswers) =>
      currentAnswers.map((answer, index) => (index === current ? letter : answer)),
    );
  }

  function showQuestion(index: number) {
    setCurrent(index);
    setPhase("quiz");
    setCopyMessage("");
  }

  function goNext() {
    if (!selected[current]) {
      return;
    }

    if (current === testQuestions.length - 1) {
      setPhase("result");
      return;
    }

    showQuestion(current + 1);
  }

  async function copyResult() {
    if (!result) {
      return;
    }

    try {
      await navigator.clipboard.writeText(buildResultCopy(result));
      setCopyMessage(testChrome.copied);
    } catch {
      setCopyMessage(testChrome.copyFailed);
    }
  }

  return (
    <>
      <header className="top">
        <div className="wrap top-inner">
          <a className="brand" href={externalLinks.emotiaHome} aria-label={testChrome.brandLabel}>
            <b>{testChrome.brand}</b>
            <i aria-hidden="true" />
            <span>{testChrome.person}</span>
          </a>
          <small>{testChrome.note}</small>
        </div>
      </header>
      <section className="intro" id="inicio">
        <div className="wrap">
          <div className="eyebrow">{testChrome.eyebrow}</div>
          <h1>{testChrome.title}</h1>
          <p className="sub">{testChrome.lead}</p>
          {testChrome.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <button type="button" className="primary" id="start" onClick={() => showQuestion(0)}>
            {testChrome.start} <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>
      <main className="wrap">
        <div className="shell">
          <section
            id="quiz"
            className={phase === "quiz" ? "panel" : "panel hide"}
            aria-label={testChrome.quizLabel}
          >
            <div className="status">
              <span id="count">
                PREGUNTA {current + 1} DE {testQuestions.length}
              </span>
              <span id="percent">{progress}%</span>
            </div>
            <div
              className="progress"
              role="progressbar"
              aria-label={testChrome.progressLabel}
              aria-valuemin={0}
              aria-valuemax={testQuestions.length}
              aria-valuenow={current}
              id="progress"
            >
              <div className="bar" id="bar" style={{ width: `${progress}%` }} />
            </div>
            <h2 id="qtitle" tabIndex={-1} ref={questionTitleRef}>
              {question?.title}
            </h2>
            <fieldset className="choices" id="choices">
              <legend className="hide">{testChrome.choiceLegend}</legend>
              {question?.options.map((option, index) => {
                const letter = answerLetters[index];

                if (!letter) {
                  return null;
                }

                return (
                  <label className="choice" key={option}>
                    <input
                      type="radio"
                      name="answer"
                      value={letter}
                      checked={selected[current] === letter}
                      onChange={() => choose(letter)}
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </fieldset>
            <div className="nav">
              <button
                type="button"
                className="secondary"
                id="prev"
                disabled={current === 0}
                onClick={() => showQuestion(current - 1)}
              >
                {testChrome.previous}
              </button>
              <button
                type="button"
                className="primary"
                id="next"
                disabled={!selected[current]}
                onClick={goNext}
              >
                {current === testQuestions.length - 1 ? testChrome.finish : testChrome.next}
              </button>
            </div>
            <div className="fineprint">{testChrome.localNote}</div>
          </section>
          <section
            id="result"
            className={phase === "result" ? "panel result" : "panel result hide"}
            aria-live="polite"
          >
            <div className="result-label">{testChrome.resultLabel}</div>
            <h2 id="rtitle" tabIndex={-1} ref={resultTitleRef}>
              {result?.title}
            </h2>
            <div id="rbody">
              {result?.paras.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="reflection">
              <strong>{testChrome.reflectionLead}</strong>
              <span id="rquestion">{result?.question}</span>
            </div>
            <div className="offer">
              <div className="eyebrow">{testChrome.offerEyebrow}</div>
              <h3>{testChrome.offerTitle}</h3>
              {testChrome.offerParagraphs.map((paragraph) =>
                paragraph.startsWith("En la clase") ? (
                  <p key={paragraph}>
                    En la clase <strong>La misma pelea, otra vez</strong>, te propongo mirar una
                    discusión concreta desde otra perspectiva.
                  </p>
                ) : (
                  <p key={paragraph}>{paragraph}</p>
                ),
              )}
              <a
                className="primary"
                href={externalLinks.clase}
                target="_blank"
                rel="noopener noreferrer"
              >
                {testChrome.classCta} <span aria-hidden="true">↗</span>
              </a>
            </div>
            <div className="endtools">
              <button
                type="button"
                className="secondary"
                id="restart"
                onClick={() => {
                  setSelected(testQuestions.map(() => null));
                  showQuestion(0);
                }}
              >
                {testChrome.restart}
              </button>
              <button type="button" className="secondary" id="copy" onClick={() => void copyResult()}>
                {testChrome.copy}
              </button>
            </div>
            <p className="fineprint" id="copymsg" role="status">
              {copyMessage}
            </p>
          </section>
          <aside className="note">
            <strong>{testChrome.asideLead}</strong>
            {testChrome.asideBody}
          </aside>
        </div>
      </main>
      <footer className="footer">
        <div className="wrap">
          {testChrome.footer}
        </div>
      </footer>
    </>
  );
}
