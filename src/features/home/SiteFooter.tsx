import { externalLinks } from "@/lib/external-links";
import { InstagramIcon, LinkedInIcon, TikTokIcon, YouTubeIcon } from "@/features/home/icons";
import { homeChrome } from "@/features/home/messages";

const socialLinks = [
  {
    href: externalLinks.instagram,
    label: homeChrome.instagramLabel,
    name: homeChrome.instagram,
    icon: <InstagramIcon size={21} />,
  },
  {
    href: externalLinks.tiktok,
    label: homeChrome.tiktokLabel,
    name: homeChrome.tiktok,
    icon: <TikTokIcon size={21} />,
  },
  {
    href: externalLinks.youtube,
    label: homeChrome.youtubeLabel,
    name: homeChrome.youtube,
    icon: <YouTubeIcon size={21} />,
  },
  {
    href: externalLinks.linkedin,
    label: homeChrome.linkedinLabel,
    name: homeChrome.linkedin,
    icon: <LinkedInIcon size={21} />,
  },
] as const;

export function SiteFooter() {
  return (
    <footer>
      <div className="container foot-inner">
        <span>
          <strong>{homeChrome.name}</strong> · {homeChrome.role}
        </span>
        <span>{homeChrome.footerNote}</span>
        <nav aria-label={homeChrome.socialLabel} className="footer-social">
          {socialLinks.map((link) => (
            <a
              key={link.href}
              aria-label={link.label}
              className="social-link"
              href={link.href}
              rel="noopener noreferrer"
              target="_blank"
              title={link.name}
            >
              {link.icon}
              <span className="visually-hidden">{link.name}</span>
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
