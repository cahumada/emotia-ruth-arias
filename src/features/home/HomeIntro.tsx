import { externalLinks } from "@/lib/external-links";
import { DesignImage } from "@/features/home/DesignImage";
import { HomeButton } from "@/features/home/HomeButton";
import { homeImages } from "@/features/home/home-images";
import { homeIds } from "@/features/home/home-ids";
import { homeApproach, homeHero, homeSituations, homeTherapy } from "@/features/home/messages";

export function HomeIntro() {
  return (
    <>
      <section className="hero" id={homeIds.inicio}>
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">{homeHero.eyebrow}</p>
            <h1>{homeHero.title}</h1>
            <p className="lead">{homeHero.lead}</p>
            <p>{homeHero.intro}</p>
            <p>{homeHero.method}</p>
            <div className="actions">
              <HomeButton href={`#${homeIds.terapia}`}>{homeHero.therapyCta}</HomeButton>
              <HomeButton appearance="outline" href="/test">
                {homeHero.testCta}
              </HomeButton>
            </div>
          </div>
          <figure className="hero-image">
            <DesignImage
              alt={homeHero.heroAlt}
              height={homeImages.hero.height}
              priority
              src={homeImages.hero.src}
              width={homeImages.hero.width}
            />
          </figure>
        </div>
      </section>
      <section className="section situations" id={homeIds.situaciones}>
        <div className="container">
          <p className="eyebrow">{homeSituations.eyebrow}</p>
          <h2>{homeSituations.title}</h2>
          <p className="section-intro">{homeSituations.intro}</p>
          <div className="situation-grid">
            {homeSituations.items.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
          <div className="quiet-note">
            <strong>{homeSituations.noteTitle}</strong>
            <p>{homeSituations.noteBody}</p>
          </div>
        </div>
      </section>
      <section className="section approach" id={homeIds.enfoque}>
        <div className="container approach-grid">
          <div>
            <p className="eyebrow">{homeApproach.eyebrow}</p>
            <h2>{homeApproach.title}</h2>
            <p className="approach-lead">{homeApproach.lead}</p>
            <p>{homeApproach.history}</p>
          </div>
          <div className="approach-panel">
            {homeApproach.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>
      <section className="section therapy" id={homeIds.terapia}>
        <div className="container">
          <div className="therapy-grid">
            <div>
              <p className="eyebrow">{homeTherapy.eyebrow}</p>
              <h2>{homeTherapy.title}</h2>
              {homeTherapy.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <h3>{homeTherapy.howTitle}</h3>
              {homeTherapy.howParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <p className="clinical-note">
                <strong>{homeTherapy.noteLead}</strong>
                {homeTherapy.noteBody}
              </p>
              <div className="actions">
                <HomeButton href={externalLinks.booking} opensInNewTab>
                  {homeTherapy.book}
                </HomeButton>
                <a className="subtle-link" href={`#${homeIds.preguntas}`}>
                  {homeTherapy.frame}
                </a>
              </div>
            </div>
            <figure className="therapy-image">
              <DesignImage
                alt={homeTherapy.imageAlt}
                height={homeImages.therapy.height}
                src={homeImages.therapy.src}
                width={homeImages.therapy.width}
              />
            </figure>
          </div>
        </div>
      </section>
    </>
  );
}
