import { externalLinks } from "@/lib/external-links";
import { DesignImage } from "@/features/home/DesignImage";
import { HomeButton } from "@/features/home/HomeButton";
import { LinkedInIcon } from "@/features/home/icons";
import { homeImages } from "@/features/home/home-images";
import { homeIds } from "@/features/home/home-ids";
import { homeAbout, homeChrome, homeFaq, homeResources, homeTestPromo } from "@/features/home/messages";

export function HomeRest() {
  return (
    <>
      <section className="section test-block" id={homeIds.test}>
        <div className="container test-grid">
          <div>
            <p className="eyebrow">{homeTestPromo.eyebrow}</p>
            <h2>{homeTestPromo.title}</h2>
            {homeTestPromo.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <div className="actions">
              <HomeButton appearance="light" href="/test">
                {homeTestPromo.cta}
              </HomeButton>
            </div>
            <p className="small-muted">{homeTestPromo.note}</p>
          </div>
          <div className="test-side">
            <span className="test-number">{homeTestPromo.number}</span>
            <h3>{homeTestPromo.sideTitle}</h3>
            <p>{homeTestPromo.sideNote}</p>
          </div>
        </div>
      </section>
      <section className="section resources" id={homeIds.recursos}>
        <div className="container">
          <p className="eyebrow">{homeResources.eyebrow}</p>
          <h2>{homeResources.title}</h2>
          <p className="section-intro">{homeResources.intro}</p>
          <article className="featured">
            <div className="featured-copy">
              <p className="eyebrow">{homeResources.classEyebrow}</p>
              <h3>{homeResources.classTitle}</h3>
              <p className="featured-intro">{homeResources.classIntro}</p>
              {homeResources.classParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <HomeButton href={externalLinks.clase} opensInNewTab>
                {homeResources.classCta}
              </HomeButton>
              <p className="resource-disclaimer">{homeResources.classDisclaimer}</p>
            </div>
            <figure className="featured-image">
              <DesignImage
                alt={homeResources.classAlt}
                height={homeImages.clase.height}
                src={homeImages.clase.src}
                width={homeImages.clase.width}
              />
            </figure>
          </article>
          <div className="publication-head">
            <h3>{homeResources.publicationsTitle}</h3>
            <p>{homeResources.publicationsIntro}</p>
          </div>
          <div className="publication-grid">
            <article className="publication">
              <div className="publication-art">
                <DesignImage
                  alt={homeResources.ebookAlt}
                  height={homeImages.entre.height}
                  src={homeImages.entre.src}
                  width={homeImages.entre.width}
                />
              </div>
              <div className="publication-info">
                <h4>{homeResources.ebookTitle}</h4>
                <p>{homeResources.ebookBody}</p>
                <a
                  className="text-link"
                  href={externalLinks.ebook}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {homeResources.ebookCta}
                </a>
              </div>
            </article>
            <article className="publication">
              <div className="publication-art">
                <DesignImage
                  alt={homeResources.journalAlt}
                  height={homeImages.hago.height}
                  src={homeImages.hago.src}
                  width={homeImages.hago.width}
                />
              </div>
              <div className="publication-info">
                <h4>{homeResources.journalTitle}</h4>
                <p>{homeResources.journalBody}</p>
                <span className="pending-link">{homeResources.journalPending}</span>
              </div>
            </article>
          </div>
        </div>
      </section>
      <section className="section about" id={homeIds.sobreMi}>
        <div className="container about-grid">
          <div>
            <p className="eyebrow">{homeAbout.eyebrow}</p>
            <h2>{homeAbout.title}</h2>
            {homeAbout.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <a
              aria-label={homeChrome.aboutLinkedinLabel}
              className="linkedin-link"
              href={externalLinks.linkedin}
              rel="noopener noreferrer"
              target="_blank"
            >
              <LinkedInIcon size={20} />
              {homeChrome.linkedin}
            </a>
          </div>
          <figure className="about-image">
            <DesignImage
              alt={homeAbout.imageAlt}
              height={homeImages.about.height}
              src={homeImages.about.src}
              width={homeImages.about.width}
            />
          </figure>
        </div>
      </section>
      <section className="section faq-section" id={homeIds.preguntas}>
        <div className="container faq-inner">
          <p className="eyebrow">{homeFaq.eyebrow}</p>
          <h2>{homeFaq.title}</h2>
          <div className="faq-list">
            {homeFaq.items.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
