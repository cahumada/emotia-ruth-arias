import { CookiePreferencesButton } from "@/features/analytics/CookiePreferencesButton";
import "./islas.css";
import { IslasMain } from "@/features/no-somos-islas/IslasMain";
import { islasChrome } from "@/features/no-somos-islas/messages";
import { externalLinks } from "@/lib/external-links";

export function IslasPage() {
  return (
    <div className="islas-page">
      <header>
        <div className="wrap head">
          <a className="id" href={externalLinks.rutharias} rel="noopener noreferrer" target="_blank">
            <span aria-hidden="true" className="rmark">
              R
            </span>
            <span>
              <b>{islasChrome.brandName}</b>
              <small>{islasChrome.brandRole}</small>
            </span>
          </a>
          <a className="home-link" href={externalLinks.rutharias} rel="noopener noreferrer" target="_blank">
            {islasChrome.proLink}
          </a>
        </div>
      </header>
      <IslasMain />
      <footer>
        <div className="wrap foot">
          <span>{islasChrome.footerBrand}</span>
          <span>{islasChrome.footerNote}</span>
          <CookiePreferencesButton />
        </div>
      </footer>
    </div>
  );
}