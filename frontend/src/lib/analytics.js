/**
 * Plausible analytics, opt-in via VITE_PLAUSIBLE_DOMAIN. Nothing loads without it.
 *
 * Plausible is cookieless and stores no persistent identifier, so no consent
 * banner is required for it in most jurisdictions; the privacy policy still
 * discloses it. The `manual` script variant is used so route changes in this
 * single-page app are counted exactly once, by `trackPageView` below.
 */
const PLAUSIBLE_DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN;

export const analyticsEnabled = Boolean(PLAUSIBLE_DOMAIN);

export function initAnalytics() {
  if (!PLAUSIBLE_DOMAIN || typeof document === 'undefined') return;
  if (document.querySelector('script[data-plausible]')) return;

  const script = document.createElement('script');
  script.defer = true;
  script.dataset.domain = PLAUSIBLE_DOMAIN;
  script.dataset.plausible = 'true';
  script.src = 'https://plausible.io/js/script.manual.js';
  document.head.appendChild(script);

  // Queue calls made before the script arrives, as Plausible's snippet does.
  window.plausible =
    window.plausible ||
    function () {
      (window.plausible.q = window.plausible.q || []).push(arguments);
    };
}

/** Count a route change. Query strings and hashes are dropped so no ids or tokens are sent. */
export function trackPageView(path) {
  if (!analyticsEnabled || typeof window === 'undefined' || !window.plausible) return;
  const clean = (path || window.location.pathname).split(/[?#]/)[0];
  window.plausible('pageview', { u: `${window.location.origin}${clean}` });
}

/** A named event with a few non-identifying properties. */
export function trackEvent(name, props = {}) {
  if (!analyticsEnabled || typeof window === 'undefined' || !window.plausible) return;
  window.plausible(name, { props });
}
