"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { buildNotesDocument, classPauses } from "@/features/aula/build-notes";
import { aulaChrome } from "@/features/aula/messages";

const tabs = [
  { id: "notas", label: aulaChrome.notesTab },
  { id: "cuaderno", label: aulaChrome.workbookTab },
  { id: "audio", label: aulaChrome.audioTab },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function AulaMaterials() {
  const [tab, setTab] = useState<TabId>("notas");
  const [notes, setNotes] = useState<[string, string, string]>(["", "", ""]);
  const [message, setMessage] = useState("");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function selectTab(nextTab: TabId, focusTab = false) {
    setTab(nextTab);

    if (focusTab) {
      const index = tabs.findIndex((item) => item.id === nextTab);
      tabRefs.current[index]?.focus();
    }
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + direction + tabs.length) % tabs.length;
    const nextTab = tabs[nextIndex];

    if (nextTab) {
      selectTab(nextTab.id, true);
    }
  }

  function downloadNotes() {
    const url = URL.createObjectURL(
      new Blob([buildNotesDocument(notes)], { type: "text/plain;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "mis-notas-la-misma-pelea.txt";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(aulaChrome.downloaded);
  }

  async function copyNotes() {
    try {
      await navigator.clipboard.writeText(buildNotesDocument(notes));
      setMessage(aulaChrome.copied);
    } catch {
      setMessage(aulaChrome.copyFailed);
    }
  }

  return (
    <section className="panel" aria-label={aulaChrome.materialsLabel}>
      <div className="tabs" role="tablist" aria-label={aulaChrome.tabsLabel}>
        {tabs.map((item, index) => {
          const isSelected = tab === item.id;

          return (
            <button
              key={item.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              className="tab"
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-controls={`panel-${item.id}`}
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => selectTab(item.id)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="content">
        <div
          className="pane"
          id="panel-notas"
          role="tabpanel"
          aria-labelledby="tab-notas"
          hidden={tab !== "notas"}
        >
          <h2>{aulaChrome.notesTitle}</h2>
          <p>{aulaChrome.notesIntro}</p>
          {classPauses.map((pause, index) => (
            <div className="note" key={pause.id}>
              <div className="small">{pause.kicker}</div>
              <label htmlFor={pause.id}>{pause.label}</label>
              <textarea
                id={pause.id}
                placeholder={pause.placeholder}
                value={notes[index]}
                onChange={(event) => {
                  const value = event.target.value;
                  setNotes((current) => {
                    const next = [...current] as [string, string, string];
                    next[index] = value;
                    return next;
                  });
                }}
              />
            </div>
          ))}
          <div className="buttons">
            <button type="button" className="btn" id="download" onClick={downloadNotes}>
              {aulaChrome.download}
            </button>
            <button type="button" className="btn alt" id="copy" onClick={() => void copyNotes()}>
              {aulaChrome.copy}
            </button>
          </div>
          <div id="message" aria-live="polite">
            {message}
          </div>
          <div className="hint">{aulaChrome.notesHint}</div>
        </div>
        <div
          className="pane"
          id="panel-cuaderno"
          role="tabpanel"
          aria-labelledby="tab-cuaderno"
          hidden={tab !== "cuaderno"}
        >
          <h2>{aulaChrome.workbookTitle}</h2>
          <p>{aulaChrome.workbookIntro}</p>
          <div className="filebox">
            <strong>{aulaChrome.workbookName}</strong>
            <span>{aulaChrome.workbookMeta}</span>
          </div>
          <ul className="mini-steps">
            {classPauses.map((pause, index) => (
              <li key={pause.id}>
                0{index + 1} · {pause.label}
              </li>
            ))}
          </ul>
          <div className="buttons">
            <button type="button" className="btn" disabled>
              {aulaChrome.workbookDownload}
            </button>
          </div>
          <div className="hint">{aulaChrome.workbookHint}</div>
        </div>
        <div
          className="pane"
          id="panel-audio"
          role="tabpanel"
          aria-labelledby="tab-audio"
          hidden={tab !== "audio"}
        >
          <h2>{aulaChrome.audioTitle}</h2>
          <p>{aulaChrome.audioIntro}</p>
          <div className="audiofake">
            <span className="circle" aria-hidden="true">
              ♫
            </span>
            <span className="track" />
            <span>{aulaChrome.audioPending}</span>
          </div>
          <div className="hint">{aulaChrome.audioHint}</div>
        </div>
      </div>
    </section>
  );
}
