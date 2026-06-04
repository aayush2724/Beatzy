const PLAUSIBLE_DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN;

export function initAnalytics() {
  if (!PLAUSIBLE_DOMAIN || typeof document === 'undefined') return;

  if (document.querySelector('script[data-plausible]')) return;

  const script = document.createElement('script');
  script.defer = true;
  script.dataset.domain = PLAUSIBLE_DOMAIN;
  script.dataset.plausible = 'true';
  script.src = 'https://plausible.io/js/script.js';
  document.head.appendChild(script);
}

export function trackPageView(path) {
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible('pageview', { u: path });
  }
}

export function trackEvent(name, props = {}) {
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible(name, { props });
  }
}
