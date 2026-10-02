import { Link } from 'react-router-dom';
import PublicShell from '../components/PublicShell';
import { usePageMeta } from '../hooks/usePageMeta';
import { LEGAL_ENTITY, LEGAL_UPDATED, PRIVACY_EMAIL } from '../config/site';
import { analyticsEnabled } from '../lib/analytics';

const errorReportingEnabled = Boolean(import.meta.env.VITE_SENTRY_DSN);

/*
 * Every statement below describes what the code in this repository actually
 * does. If behaviour changes (a new provider, a new field, a new cookie), this
 * page and LEGAL_UPDATED in config/site.js must change with it.
 */
const SECTIONS = [
  {
    title: 'What this policy covers',
    body: [
      `This policy explains what ${LEGAL_ENTITY} (“Beatzy”, “we”) collects when you use the Beatzy website, app and API, why, and the choices you have. It is written to match how the service works today; it is not a statement of compliance with any specific regulation.`,
    ],
  },
  {
    title: 'Account information',
    body: [
      'When you register we store your name, email address and a one-way hash of your password. If you sign in with Google we store your Google account id and the name and email Google provides instead of a password. We record the time of your last sign-in.',
      'Security events — registration, sign-in, sign-out and token refreshes — are written to an audit log together with the IP address the request came from.',
    ],
  },
  {
    title: 'Audio you analyse',
    body: [
      'Audio you upload, record from your microphone, or select from a catalog search is stored temporarily in object storage so the analysis service can read it. It is deleted from storage as soon as the analysis has been saved. While it exists, only the account that uploaded it can access it.',
      'The analysis results — the identified title, artist and album, tempo, key, chords, mood, energy, spectral measurements, sound classification labels, lyrics where found, and the raw analysis response — are kept in your account until you delete the analysis or ask us to delete your account.',
    ],
  },
  {
    title: 'Third-party services',
    body: [
      'Identification: an audio fingerprint or a short excerpt of your audio (not your account details) is sent to ACRCloud, Shazam and AcoustID/MusicBrainz, depending on which are configured, to identify the recording.',
      'Metadata and lyrics: the identified title and artist are sent to Spotify, Apple’s iTunes Search API, MusicBrainz and LRCLIB to fetch cover art, release details, 30-second previews and lyrics. Catalog searches you type are sent to Spotify or iTunes.',
      'Payments: subscriptions are handled by Stripe. Stripe receives your email address and processes your card details directly; we never see your card number. We store your Stripe customer and subscription ids.',
      'Sign-in: if you choose “Continue with Google”, Google receives the sign-in request and tells us your verified email and name.',
      'Gesture chord play: the optional hand-tracking feature downloads a model from Google and jsdelivr’s CDN and runs it in your browser. Your camera feed is processed locally and is never uploaded.',
      'Hosting: the website is served by Vercel, the API and database run on Render, and the analysis service runs on Hugging Face Spaces. Each of these providers processes your requests, including your IP address, to deliver the service.',
    ],
  },
  {
    title: 'Analytics and error reporting',
    body: [
      analyticsEnabled
        ? 'We use Plausible Analytics to count page views. Plausible is cookieless, does not store a persistent identifier and does not track you across sites. Query strings and ids are stripped from the URLs we send it.'
        : 'This deployment does not run any analytics or visitor tracking.',
      errorReportingEnabled
        ? 'When something breaks, an error report is sent to Sentry so we can fix it. Reports contain the error, the page and browser details; text is masked and media is blocked in any attached replay.'
        : 'This deployment does not send error reports to a third-party service.',
    ],
  },
  {
    title: 'Cookies and browser storage',
    body: [
      'Beatzy sets no cookies of its own and uses no advertising or cross-site tracking. Your sign-in session is kept in your browser’s session storage and is cleared when the tab closes. Your theme choice and whether you have seen the welcome tour are kept in local storage on your device.',
    ],
  },
  {
    title: 'Where data is stored and for how long',
    body: [
      'Account data and analysis results live in a PostgreSQL database hosted on Render. Temporary audio lives in S3-compatible object storage until the analysis is saved. Recently viewed results and sign-in codes are cached briefly in Redis.',
      'We keep account data and results for as long as your account exists. Audit log entries are kept with the account.',
    ],
  },
  {
    title: 'Your choices',
    body: [
      'You can delete any analysis from your history at any time, which removes its results. You can change your name and password from your profile.',
      `To delete your account and everything in it, export your data, or ask any question about this policy, email ${PRIVACY_EMAIL}. We will act on account deletion requests manually.`,
    ],
  },
  {
    title: 'Changes',
    body: [
      'If the way Beatzy handles data changes, this page changes with it and the date below is updated.',
    ],
  },
];

export default function Privacy() {
  usePageMeta({
    title: 'Privacy policy',
    description: 'What Beatzy collects when you analyse audio or create an account, where it is stored, which providers are involved, and how to contact us.',
  });
  return (
    <PublicShell width="max-w-3xl">
      <header>
        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-brand">Legal</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink">Privacy policy</h1>
        <p className="mt-3 text-sm text-ink-muted">Last updated {LEGAL_UPDATED}</p>
      </header>
      <div className="mt-10 divide-y divide-line-subtle">
        {SECTIONS.map(({ title, body }) => (
          <section key={title} className="py-6">
            <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
            {body.map((p, i) => (
              <p key={i} className="mt-2 text-[0.9375rem] leading-relaxed text-ink-muted">{p}</p>
            ))}
          </section>
        ))}
      </div>
      <p className="mt-8 text-sm text-ink-muted">
        Privacy questions: <a href={`mailto:${PRIVACY_EMAIL}`} className="text-brand hover:text-brand-hover">{PRIVACY_EMAIL}</a>. See also the{' '}
        <Link to="/terms" className="text-brand hover:text-brand-hover">terms of service</Link>.
      </p>
    </PublicShell>
  );
}
