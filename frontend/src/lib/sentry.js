const DSN = import.meta.env.VITE_SENTRY_DSN;

let sentry = null;

/**
 * Error reporting is opt-in: nothing loads and nothing is sent unless
 * VITE_SENTRY_DSN is set. Session replay is off by default; on-error replays
 * mask all text and block all media so no audio or lyrics leave the browser.
 */
export async function initSentry() {
  if (!DSN || typeof window === 'undefined') return null;

  try {
    const Sentry = await import('@sentry/react');
    Sentry.init({
      dsn: DSN,
      environment: import.meta.env.MODE,
      integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })],
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: import.meta.env.PROD ? 0.5 : 0,
      sendDefaultPii: false,
    });
    sentry = Sentry;
    return Sentry;
  } catch {
    console.warn('[Beatzy] Sentry DSN set but @sentry/react could not be loaded.');
    return null;
  }
}

/** Report an error if Sentry is running; a no-op otherwise. */
export function captureException(error, extra) {
  if (!sentry) return;
  try {
    sentry.captureException(error, extra ? { extra } : undefined);
  } catch {
    /* never let reporting throw */
  }
}
