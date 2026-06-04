const DSN = import.meta.env.VITE_SENTRY_DSN;

export async function initSentry() {
  if (!DSN || typeof window === 'undefined') return;

  try {
    const Sentry = await import('@sentry/react');
    Sentry.init({
      dsn: DSN,
      environment: import.meta.env.MODE,
      integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })],
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: import.meta.env.PROD ? 0.5 : 0,
    });
    return Sentry;
  } catch {
    /* @sentry/react optional — install for production error tracking */
    console.warn('[Beatzy] Sentry DSN set but @sentry/react not installed. Run: npm i @sentry/react');
  }
}
