import { Link } from 'react-router-dom';
import PublicShell from '../components/PublicShell';
import { usePageMeta } from '../hooks/usePageMeta';
import { CONTACT_EMAIL, LEGAL_ENTITY, LEGAL_UPDATED, PLAN_LIMITS } from '../config/site';

const SECTIONS = [
  {
    title: 'Using Beatzy',
    body: [
      `These terms are an agreement between you and ${LEGAL_ENTITY} (“Beatzy”, “we”). You may use Beatzy to analyse audio you have the right to upload. Automated scraping of the website, attempts to overload the service, sharing of API keys, or use of the API beyond your plan’s limits may lead to your account being suspended.`,
    ],
  },
  {
    title: 'Your content',
    body: [
      'You keep all rights to the audio you upload. Source audio is deleted from storage once an analysis is saved; the results are stored in your account until you delete them. By sharing a result you make that result page readable by anyone who has the link, until you turn sharing off.',
    ],
  },
  {
    title: 'Accuracy',
    body: [
      'Analyses are produced automatically. Tempo, key, chord and mood estimates can be wrong, lyrics come from third-party sources and may be incomplete, and identification depends on third-party catalogs. Beatzy is provided as is, without warranty of any kind, and should not be relied on where an error would cause harm.',
    ],
  },
  {
    title: 'Plans and limits',
    body: [
      `The Free plan includes ${PLAN_LIMITS.free.analysesPerMonth} analyses a month, ${PLAN_LIMITS.free.requestsPerDay} API requests a day and uploads of up to ${PLAN_LIMITS.free.uploadSizeMB} MB. Paid plans raise these limits as described on the pricing page. We may change limits or prices; changes to a paid plan’s price take effect at your next renewal.`,
    ],
  },
  {
    title: 'Billing',
    body: [
      'Paid plans renew monthly and are billed through Stripe. You can change or cancel your plan at any time from the billing portal; cancelling stops the next renewal and your plan stays active until the end of the period you have paid for. Moving to a lower plan applies at the end of the current period.',
    ],
  },
  {
    title: 'Refunds',
    body: [
      // PLACEHOLDER — the operator has not yet decided a refund policy. Do not
      // launch with this text: replace it with the actual policy (for example
      // “no refunds for partial months” or “full refund within 14 days”).
      '[REFUND POLICY TO BE CONFIRMED BY THE OPERATOR] Until a refund policy is published here, requests are handled case by case. Contact us using the address below.',
    ],
    placeholder: true,
  },
  {
    title: 'Termination',
    body: [
      'You can stop using Beatzy at any time and ask us to delete your account. We may suspend or close accounts that break these terms or that we reasonably believe are being used to harm the service or others.',
    ],
  },
  {
    title: 'Changes',
    body: [
      'We may update these terms. When we do, the date on this page changes and continued use of the service means you accept the new terms.',
    ],
  },
];

export default function Terms() {
  usePageMeta({ title: 'Terms of service', description: 'The terms for using Beatzy: acceptable use, your content, accuracy, plans, billing and refunds.' });
  return (
    <PublicShell width="max-w-3xl">
      <header>
        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-brand">Legal</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink">Terms of service</h1>
        <p className="mt-3 text-sm text-ink-muted">Last updated {LEGAL_UPDATED}</p>
      </header>
      <div className="mt-10 divide-y divide-line-subtle">
        {SECTIONS.map(({ title, body, placeholder }) => (
          <section key={title} className="py-6">
            <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
            {body.map((p, i) => (
              <p key={i} className={placeholder ? 'mt-2 rounded-lg border border-dashed border-warn/50 bg-warn/5 px-3 py-2 text-[0.9375rem] leading-relaxed text-ink-muted' : 'mt-2 text-[0.9375rem] leading-relaxed text-ink-muted'}>
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
      <p className="mt-8 text-sm text-ink-muted">
        Questions about these terms: <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand hover:text-brand-hover">{CONTACT_EMAIL}</a>. See also the{' '}
        <Link to="/privacy" className="text-brand hover:text-brand-hover">privacy policy</Link>.
      </p>
    </PublicShell>
  );
}
