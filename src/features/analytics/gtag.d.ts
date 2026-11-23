export {};

declare global {
  interface Window {
    EMOTIA_ANALYTICS_ENABLED?: boolean;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
