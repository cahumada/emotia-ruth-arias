import { externalLinks } from "@/lib/external-links";
import { HomeButton } from "@/features/home/HomeButton";
import { homeIds } from "@/features/home/home-ids";
import { homeClosing } from "@/features/home/messages";
import { NewsletterForm } from "@/features/newsletter";
import { newsletterMessages } from "@/features/newsletter/messages";

export function ClosingSection() {
  return (
    <section aria-labelledby={homeIds.closingHeading} className="closing-section" id={homeIds.novedades}>
      <div className="container closing-grid">
        <div className="closing-consult">
          <p className="eyebrow">{homeClosing.eyebrow}</p>
          <h2 id={homeIds.closingHeading}>{homeClosing.title}</h2>
          <p>{homeClosing.body}</p>
          <HomeButton href={externalLinks.booking} opensInNewTab>
            {homeClosing.book} <span aria-hidden="true">↗</span>
          </HomeButton>
        </div>
        <div className="closing-news">
          <p className="eyebrow">{newsletterMessages.eyebrow}</p>
          <h2>{newsletterMessages.title}</h2>
          <p>{newsletterMessages.intro}</p>
          <NewsletterForm />
        </div>
      </div>
    </section>
  );
}
