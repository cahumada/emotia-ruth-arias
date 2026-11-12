import "./aula.css";
import { externalLinks } from "@/lib/external-links";
import { AulaMaterials } from "@/features/aula/AulaMaterials";
import { classPauses } from "@/features/aula/build-notes";
import { aulaChrome } from "@/features/aula/messages";

export function AulaPage() {
  return (
    <div className="aula-page">
      <header className="head">
        <div className="shell">
          <a href="#inicio" className="brand">
            <strong>{aulaChrome.brand}</strong>
            <span className="bar" aria-hidden="true" />
            <small>{aulaChrome.person}</small>
          </a>
          <span className="topnote">{aulaChrome.topNote}</span>
        </div>
      </header>
      <section className="demo">
        <div className="shell">
          <strong>{aulaChrome.demoLead}</strong>
          {aulaChrome.demoBody}
        </div>
      </section>
      <section className="hero" id="inicio">
        <div className="shell">
          <div className="kicker">{aulaChrome.kicker}</div>
          <h1>
            {aulaChrome.titleLead}
            <br />
            {aulaChrome.titleTail}
          </h1>
          <p>{aulaChrome.hero}</p>
        </div>
      </section>
      <main>
        <div className="shell workspace">
          <section aria-label={aulaChrome.classLabel}>
            <div className="player">
              <span className="play" aria-hidden="true">
                ▷
              </span>
              <strong>{aulaChrome.playerTitle}</strong>
              <small>{aulaChrome.playerNote}</small>
            </div>
            <p className="videotext">
              Las tres pausas reflexivas ya están integradas en tu video. Cuando llegue cada una,
              podés escribir en <b>Mis notas</b> o trabajar en el cuadernillo descargable.
            </p>
            <div className="timeline">
              <h3>{aulaChrome.timelineTitle}</h3>
              {classPauses.map((pause) => (
                <p key={pause.id}>
                  <b>{pause.timeline}</b> · {pause.label} · {pause.minutes}
                </p>
              ))}
            </div>
          </section>
          <AulaMaterials />
        </div>
        <section className="next">
          <div className="shell">
            <div className="kicker">{aulaChrome.nextKicker}</div>
            <h2>{aulaChrome.nextTitle}</h2>
            <p>{aulaChrome.nextIntro}</p>
            <div className="nextcards">
              <article>
                <strong>{aulaChrome.mapTitle}</strong>
                <p>{aulaChrome.mapBody}</p>
                <span className="hint">{aulaChrome.mapHint}</span>
              </article>
              <article>
                <strong>{aulaChrome.therapyTitle}</strong>
                <p>{aulaChrome.therapyBody}</p>
                <a className="btn ghost" href={externalLinks.emotia} target="_blank" rel="noopener noreferrer">
                  {aulaChrome.therapyCta}
                </a>
              </article>
            </div>
          </div>
        </section>
      </main>
      <footer className="shell footer">{aulaChrome.footer}</footer>
    </div>
  );
}
