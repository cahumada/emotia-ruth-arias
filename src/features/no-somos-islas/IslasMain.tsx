"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { consentStore } from "@/features/analytics/consent-store";
import { trackIslasEvent, trackIslasSignup } from "@/features/analytics/track-event";
import { isEbookEntry } from "@/features/no-somos-islas/ebook-entry";
import {
  createIslasAccessSchema,
  type IslasAccessValues,
} from "@/features/no-somos-islas/islas-access-schema";
import { islasAccessMessages, islasAssets, islasChrome } from "@/features/no-somos-islas/messages";
import { requestIslasAccess } from "@/features/no-somos-islas/request-islas-access";
import { externalLinks } from "@/lib/external-links";

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

const accessSchema = createIslasAccessSchema();

// gtag is defined by the analytics init script, which can load after the arrival effect runs:
// retry for about five seconds before giving up.
const GTAG_POLL_MS = 250;
const GTAG_MAX_ATTEMPTS = 20;

export function IslasMain() {
  const [manualUnlock, setManualUnlock] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [hasEmailError, setHasEmailError] = useState(false);
  const form = useForm<IslasAccessValues>({
    resolver: zodResolver(accessSchema),
    defaultValues: { email: "", newsletter: false, company: "" },
  });
  const ebookUnlock = useSyncExternalStore(subscribeEbookUnlock, fromEbookEntry, () => false);
  const unlocked = manualUnlock || ebookUnlock;
  const audioSectionRef = useRef<HTMLElement>(null);
  const resourceActionsRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioStartedRef = useRef(false);
  const arrivalSentRef = useRef(false);

  useEffect(() => {
    if (!ebookUnlock) return;
    requestAnimationFrame(() => {
      audioSectionRef.current?.scrollIntoView({ block: "start" });
    });
  }, [ebookUnlock]);

  const consentChoice = useSyncExternalStore(
    consentStore.subscribe,
    consentStore.getChoice,
    consentStore.getServerChoice,
  );

  useEffect(() => {
    if (consentChoice !== "granted" || arrivalSentRef.current) return;
    const medium = new URLSearchParams(window.location.search).get("utm_medium");
    const eventName =
      medium === "qr" ? "nsis_qr_arrival" : medium === "pdf_link" ? "nsis_pdf_link_arrival" : null;
    if (!eventName) return;

    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (trackIslasEvent(eventName)) arrivalSentRef.current = true;
      if (arrivalSentRef.current || attempts >= GTAG_MAX_ATTEMPTS) window.clearInterval(timer);
    }, GTAG_POLL_MS);
    return () => window.clearInterval(timer);
  }, [consentChoice]);

  useEffect(() => {
    const player = audioRef.current;
    if (!player) return;

    const onPlay = () => {
      if (!audioStartedRef.current) {
        audioStartedRef.current = true;
        trackIslasEvent("nsis_audio_start");
      }
    };
    const onEnded = () => {
      trackIslasEvent("nsis_audio_complete");
      audioStartedRef.current = false;
    };

    player.addEventListener("play", onPlay);
    player.addEventListener("ended", onEnded);
    return () => {
      player.removeEventListener("play", onPlay);
      player.removeEventListener("ended", onEnded);
    };
  }, []);

  async function onValid(values: IslasAccessValues) {
    setIsSending(true);
    setHasEmailError(false);
    setStatusMessage("");

    try {
      const result = await requestIslasAccess({
        email: values.email,
        newsletter: values.newsletter,
        company: values.company ?? "",
      });

      if (result.status === "success") {
        trackIslasSignup(values.newsletter);
        setStatusMessage(islasAccessMessages.success);
        setManualUnlock(true);
        resourceActionsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      if (result.status === "invalid") {
        setHasEmailError(true);
        setStatusMessage(result.message);
        form.setFocus("email");
        return;
      }

      setStatusMessage(islasAccessMessages.sendError);
    } catch {
      setStatusMessage(islasAccessMessages.sendError);
    } finally {
      setIsSending(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    void form.handleSubmit(onValid, onInvalid)(event);
  }

  function onInvalid() {
    setHasEmailError(true);
    setStatusMessage(islasAccessMessages.invalidEmail);
    form.setFocus("email");
  }

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
              <form id="access-form" noValidate onSubmit={onSubmit}>
                <div className="visually-hidden" aria-hidden="true">
                  <label htmlFor="access-company">{islasAccessMessages.honeypotLabel}</label>
                  <input
                    autoComplete="off"
                    id="access-company"
                    tabIndex={-1}
                    {...form.register("company")}
                  />
                </div>
                <label htmlFor="access-email">{islasChrome.emailLabel}</label>
                <input
                  aria-describedby="gate-status"
                  aria-invalid={hasEmailError || undefined}
                  autoComplete="email"
                  id="access-email"
                  maxLength={254}
                  placeholder={islasChrome.emailPlaceholder}
                  required
                  type="email"
                  {...form.register("email")}
                />
                <label className="consent-line">
                  <input id="news-optin" type="checkbox" {...form.register("newsletter")} />
                  <span>{islasChrome.consent}</span>
                </label>
                <button className="button gate-button" disabled={isSending} type="submit">
                  {islasChrome.gateSubmit}
                </button>
                <p aria-live="polite" className="gate-status" id="gate-status" role="status">
                  {statusMessage}
                </p>
              </form>
              <p className="gate-disclaimer">{islasChrome.gateDisclaimer}</p>
            </div>
            <div className="hero-actions resource-actions" hidden={!unlocked} ref={resourceActionsRef}>
              <a
                className="button"
                download={islasAssets.ebookDownloadName}
                href={islasAssets.ebookFile}
                id="ebook-download"
                onClick={() => trackIslasEvent("nsis_ebook_download_click")}
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