type IconProps = {
  size: number;
};

export function InstagramIcon({ size }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <rect
        fill="none"
        height="20"
        rx="5"
        stroke="currentColor"
        strokeWidth="2"
        width="20"
        x="2"
        y="2"
      />
      <circle cx="12" cy="12" fill="none" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.6" cy="6.5" fill="currentColor" r="1.2" />
    </svg>
  );
}

export function TikTokIcon({ size }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path
        d="M16.6 2h-3.2v13.1a3.4 3.4 0 1 1-3.1-3.38V8.46a6.6 6.6 0 1 0 6.3 6.59V8.47a9.4 9.4 0 0 0 5.4 1.7V6.9a6.17 6.17 0 0 1-5.4-4.9Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function YouTubeIcon({ size }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <rect
        fill="none"
        height="14"
        rx="4"
        stroke="currentColor"
        strokeWidth="2"
        width="20"
        x="2"
        y="5"
      />
      <path d="m10 9 6 3-6 3z" fill="currentColor" />
    </svg>
  );
}

export function LinkedInIcon({ size }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.94v5.666H9.35V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.37-1.85 3.6 0 4.265 2.37 4.265 5.455v6.286ZM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124ZM7.118 20.452H3.555V9h3.563v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0Z" />
    </svg>
  );
}
