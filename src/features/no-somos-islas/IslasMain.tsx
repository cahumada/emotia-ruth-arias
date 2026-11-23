"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { isEbookEntry } from "@/features/no-somos-islas/ebook-entry";
import { islasAssets, islasChrome } from "@/features/no-somos-islas/messages";
import { externalLinks } from "@/lib/external-links";

declare global {
  interface Window {
    EMOTIA_ANALYTICS_ENABLED?: boolean;
    gtag?: (...args: unknown[]) => void;
  }
}

function sendAnalytics(name: string, params: Record<string, string> = {}) {
  if (window.EMOTIA_ANALYTICS_ENABLED === true && typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
}

function fromEbookEntry(): boolean {
  if (typeof window === "undefined") return false;
  return isEbookEntry(window.location.search, window.location.hash);
}

function subscribeEbookUnlock(onStoreChange: () => void) {
  window.addEventListener("hashchange", onStoreChange);
  window.addEventListener("popstate", onStoreChange);
  return () => {
    window.removeEventListener("hashchange", onStoreChange);
    window.removeEventListener("popstate", onStoreChange);
  };
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18">
      <path d="M12 3v13m0 0 5-5m-5 5-5-5M4 17v4h16v-4" />
    </svg>
  );
}

function HeadphonesIcon() {
  return (
    <svg aria-hidden="true" className="player-icon" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <path d="M3 14v-3a9 9 0 0 1 18 0v3M4 13h3v7H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2zm13 0h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3z" />
    </svg>
  );
}

export function IslasMain() {
  const [manualUnlock, setManualUnlock] = useState(false);
  const ebookUnlock = useSyncExternalStore(subscribeEbookUnlock, fromEbookEntry, () => false);
  const unlocked = manualUnlock || ebookUnlock;
  const audioSectionRef = useRef<HTMLElement>(null);
  const resourceActionsRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioStartedRef = useRef(false);

  useEffect(() => {
    if (!ebookUnlock) return;
    requestAnimationFrame(() => {
      audioSectionRef.current?.scrollIntoView({ block: "start" });
    });
  }, [ebookUnlock]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("utm_medium") === "qr") {
      sendAnalytics("nsis_qr_arrival", { resource: "no_somos_islas" });
    }
    if (params.get("utm_medium") === "pdf_link") {
      sendAnalytics("nsis_pdf_link_arrival", { resource: "no_somos_islas" });
    }
  }, []);

  useEffect(() => {
    const player = audioRef.current;
    if (!player) return;

    const onPlay = () => {
      if (!audioStartedRef.current) {
        audioStartedRef.current = true;
        sendAnalytics("nsis_audio_start", { resource: "no_somos_islas" });
      }
    };
    const onEnded = () => {
      sendAnalytics("nsis_audio_complete", { resource: "no_somos_islas" });
      audioStartedRef.current = false;
    };

    player.addEventListener("play", onPlay);
    player.addEventListener("ended", onEnded);
    return () => {
      player.removeEventListener("play", onPlay);
      player.removeEventListener("ended", onEnded);
    };
  }, [unlocked]);

  const onAccessSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    setManualUnlock(true);
    resourceActionsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <main>
      <section className="hero" id="inicio">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">{islasChrome.eyebrow}</p>
            <h1>{islasChrome.title}</h1>
            <p className="subtitle">{islasChrome.subtitle}</p>
            <p className="intro">{islasChrome.intro}</p>
            <div className="stepsmall">
              <span className="num">01</span>
              {islasChrome.stepReading}
            </div>
            <div className="email-gate" hidden={unlocked}>
              <p className="gate-kicker">{islasChrome.gateKicker}</p>
              <h2>{islasChrome.gateTitle}</h2>
              <p>{islasChrome.gateIntro}</p>
              <form id="access-form" onSubmit={onAccessSubmit}>
                <label htmlFor="access-email">{islasChrome.emailLabel}</label>
                <input
                  autoComplete="email"
                  id="access-email"
                  maxLength={254}
                  name="email"
                  placeholder={islasChrome.emailPlaceholder}
                  required
                  type="email"
                />
                <label className="consent-line">
                  <input id="news-optin" name="news-optin" type="checkbox" />
                  <span>{islasChrome.consent}</span>
                </label>
                <button className="button gate-button" type="submit">
                  {islasChrome.gateSubmit}
                </button>
                <p aria-live="polite" className="gate-status" id="gate-status" role="status" />
              </form>
              <p className="gate-disclaimer">{islasChrome.gateDisclaimer}</p>
            </div>
            <div className="hero-actions resource-actions" hidden={!unlocked} ref={resourceActionsRef}>
              <a
                className="button"
                download={islasAssets.ebookDownloadName}
                href={islasAssets.ebookFile}
                id="ebook-download"
                onClick={() => sendAnalytics("nsis_ebook_download_click", { resource: "no_somos_islas" })}
              >
                <DownloadIcon />
                {islasChrome.downloadEbook}
              </a>
              <a className="quiet-link" href="#audio">
                {islasChrome.skipToAudio}
              </a>
            </div>
            <p className="tiny">{islasChrome.tinyNote}</p>
          </div>
          <figure className="hero-cover">
            <Image
              alt={islasChrome.coverAlt}
              height={1200}
              priority
              src={islasAssets.cover}
              width={1097}
            />
            <figcaption>{islasChrome.coverCaption}</figcaption>
          </figure>
        </div>
      </section>
      <section
        aria-labelledby="audio-heading"
        className={`listen audio-gated${unlocked ? " access-granted" : ""}`}
        id="audio"
        ref={audioSectionRef}
      >
        <div className="wrap listen-grid">
          <div>
            <div className="stepsmall">
              <span className="num">02</span>
              {islasChrome.stepListen}
            </div>
            <h2 id="audio-heading">{islasChrome.audioHeading}</h2>
            <p>{islasChrome.audioIntro}</p>
            <p>{islasChrome.audioNote}</p>
          </div>
          <div className="player-card">
            <HeadphonesIcon />
            <p className="audio-label">{islasChrome.audioLabel}</p>
            <h3>{islasChrome.audioTitle}</h3>
            <audio
              aria-label={islasChrome.audioAria}
              controls
              id="audio-player"
              preload="metadata"
              ref={audioRef}
              src={islasAssets.audio}
            >
              {islasChrome.audioFallback}
            </audio>
            <p>{islasChrome.audioDuration}</p>
            <div className="divider" />
            <a className="download-again" href="#inicio">
              {islasChrome.downloadAgain}
            </a>
          </div>
        </div>
      </section>
      <section className="after">
        <div className="wrap">
          <p>{islasChrome.afterThanks}</p>
          <a className="quiet-link" href={externalLinks.rutharias} rel="noopener noreferrer" target="_blank">
            {islasChrome.afterPro}
          </a>
        </div>
      </section>
    </main>
  );
}