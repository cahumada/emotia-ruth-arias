export {};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    // gtag.js reads `ga-disable-<measurement id>` before sending anything.
    [gaDisable: `ga-disable-${string}`]: boolean | undefined;
  }
}
