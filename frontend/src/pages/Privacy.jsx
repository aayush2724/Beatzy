import PublicShell from '../components/PublicShell';
import { usePageMeta } from '../hooks/usePageMeta';

const SECTIONS = [
  ['What we process', 'Audio you upload or record is processed to identify the track and extract its musical features. The source audio is deleted from storage as soon as the analysis is saved; the results — title, tempo, key, chords, mood, lyrics — are kept in your account.'],
  ['Account data', 'Your name and email are used to sign you in, to send account messages, and for billing. We do not sell them.'],
  ['Third parties', 'Identification and enrichment use external services (audio fingerprinting and catalog providers). They receive an audio fingerprint or a short sample, never your account details. Payments are handled by Stripe, and Google sign-in by Google; each receives only what it needs to work.'],
  ['Cookies and storage', 'The app stores your session in your browser so you stay signed in, and a few preferences such as theme. There is no advertising tracking.'],
  ['Your choices', 'You can delete any analysis from your history, and you can ask us to delete your account and everything in it.'],
];

export default function Privacy() {
  usePageMeta({ title: 'Privacy policy', description: 'How Beatzy handles your audio and account data.' });
  return (
    <PublicShell width="max-w-3xl">
      <header>
        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-brand">Legal</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink">Privacy policy</h1>
        <p className="mt-3 text-sm text-ink-muted">Last updated September 2026</p>
      </header>
      <div className="mt-10 divide-y divide-line-subtle">
        {SECTIONS.map(([title, body]) => (
          <section key={title} className="py-6">
            <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-muted">{body}</p>
          </section>
        ))}
      </div>
      <p className="mt-8 text-sm text-ink-muted">Privacy questions: <a href="mailto:privacy@beatzy.app" className="text-brand hover:text-brand-hover">privacy@beatzy.app</a></p>
    </PublicShell>
  );
}
