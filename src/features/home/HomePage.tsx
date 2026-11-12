import "./home.css";
import { ClosingSection } from "@/features/home/ClosingSection";
import { HomeIntro } from "@/features/home/HomeIntro";
import { HomeRest } from "@/features/home/HomeRest";
import { SiteFooter } from "@/features/home/SiteFooter";
import { SiteHeader } from "@/features/home/SiteHeader";
import { homeChrome } from "@/features/home/messages";
import { homeIds } from "@/features/home/home-ids";

export function HomePage() {
  return (
    <div className="home">
      <a className="skip" href={`#${homeIds.main}`}>
        {homeChrome.skip}
      </a>
      <SiteHeader />
      <main id={homeIds.main}>
        <HomeIntro />
        <HomeRest />
      </main>
      <ClosingSection />
      <SiteFooter />
    </div>
  );
}
