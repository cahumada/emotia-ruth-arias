"use client";

import { useState } from "react";
import { externalLinks } from "@/lib/external-links";
import { HomeButton } from "@/features/home/HomeButton";
import { homeChrome, homeNav } from "@/features/home/messages";

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <header className="header">
      <div className="container head-inner">
        <a className="identity" href={`#${homeNav[0].id}`} aria-label={homeChrome.identityLabel}>
          <strong>{homeChrome.name}</strong>
          <span>
            {homeChrome.role} <span className="brand-mini">{homeChrome.brand}</span>
          </span>
        </a>
        <button
          type="button"
          className="menu-toggle"
          aria-controls="nav"
          aria-expanded={isOpen}
          aria-label={isOpen ? homeChrome.closeMenu : homeChrome.openMenu}
          onClick={() => setIsOpen((open) => !open)}
        >
          ☰
        </button>
        <nav id="nav" aria-label={homeChrome.navLabel} className={isOpen ? "nav open" : "nav"}>
          {homeNav.map((link) => (
            <a key={link.id} href={`#${link.id}`} onClick={closeMenu}>
              {link.label}
            </a>
          ))}
          <HomeButton href={externalLinks.booking} isSmall opensInNewTab onClick={closeMenu}>
            {homeChrome.book}
          </HomeButton>
        </nav>
      </div>
    </header>
  );
}
