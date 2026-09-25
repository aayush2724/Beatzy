import PublicShell from '../components/PublicShell';
import { usePageMeta } from '../hooks/usePageMeta';

const SECTIONS = [
  ['Using Beatzy', 'You may use Beatzy to analyse audio you have the right to upload. Automated scraping, attempts to overload the service, or use of the API beyond your plan’s limits may lead to your account being suspended.'],
  ['Your content', 'You keep all rights to the audio you upload. Source audio is deleted from storage once an analysis is saved; the results are stored in your account until you delete them.'],
  ['Accuracy', 'Analyses are produced automatically. Tempo, key, chord and mood estimates can be wrong, and identification depends on third-party catalogs. Beatzy is provided as is, without warranty.'],
  ['Plans and billing', 'Paid plans renew monthly and are billed through Stripe. You can change or cancel your plan at any time from the billing portal; changes to a lower plan apply at the end of the current period.'],
  ['Changes', 'We may update these terms. When we do, the date below changes and continued use of the service means you accept the new terms.'],
];

export default function Terms() {
  usePageMeta({ title: 'Terms of service', description: 'The terms for using Beatzy.' });
  return (
    <PublicShell width="max-w-3xl">
      <header>
        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-brand">Legal</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink">Terms of service</h1>
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
      <p className="mt-8 text-sm text-ink-muted">Questions about these terms: <a href="mailto:hello@beatzy.app" className="text-brand hover:text-brand-hover">hello@beatzy.app</a></p>
    </PublicShell>
  );
}
