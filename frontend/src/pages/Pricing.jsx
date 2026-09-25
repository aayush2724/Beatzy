import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../api/client';
import PublicShell from '../components/PublicShell';
import { usePageMeta } from '../hooks/usePageMeta';
import { Badge, Button, Card } from '../components/ui';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    blurb: 'Try the analysis on your own tracks.',
    features: ['100 analyses a month', '500 API requests a day', 'Web dashboard', 'Community support'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '4.99',
    blurb: 'For producers, DJs and developers.',
    features: ['1,000 analyses a month', '10,000 API requests a day', 'REST API with 5 keys', 'Priority queue'],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '19.99',
    blurb: 'For products built on the API.',
    features: ['Unlimited analyses', 'Everything in Pro', '20 API keys', 'Priority support'],
  },
];

const FAQ = [
  ['What counts as an analysis?', 'One uploaded file, one recording, or one catalog track run through the pipeline. Failed runs are not counted.'],
  ['Do you keep my audio?', 'No. Source audio is deleted from storage as soon as the analysis is saved; only the results are kept.'],
  ['Can I change plans later?', 'Yes. Upgrades apply immediately; downgrades take effect at the end of the billing period, through the Stripe billing portal.'],
  ['Which formats are supported?', 'MP3, WAV, FLAC, M4A/AAC, OGG and WebM, up to 50 MB per file, plus microphone recordings from the browser.'],
];

export default function Pricing() {
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);

  usePageMeta({ title: 'Pricing', description: 'Beatzy plans: free, Pro and Enterprise.' });

  async function choose(planId) {
    if (!token) { navigate('/register'); return; }
    if (planId === 'free') { navigate('/dashboard'); return; }
    setLoading(planId);
    try {
      const { data } = await api.post('/api/billing/subscribe', { planId });
      window.location.href = data.data.url;
    } catch {
      toast.error("Couldn't start checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <PublicShell width="max-w-6xl">
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-brand">Pricing</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink md:text-5xl">Simple plans, monthly</h1>
        <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-muted">
          Every plan runs the same pipeline — identification, tempo, key, chords, mood and lyrics. Pick by how much you analyse.
        </p>
      </header>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {PLANS.map((plan) => {
          const current = user?.plan === plan.id;
          return (
            <Card
              key={plan.id}
              padding="lg"
              className={plan.popular ? 'border-brand/50 shadow-[var(--shadow-md)]' : undefined}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold text-ink">{plan.name}</h2>
                  <p className="mt-1 text-sm text-ink-muted">{plan.blurb}</p>
                </div>
                {plan.popular && <Badge variant="brand">Most popular</Badge>}
              </div>
              <p className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-4xl font-semibold tracking-tight text-ink">${plan.price}</span>
                <span className="text-sm text-ink-muted">/ month</span>
              </p>
              <ul className="mt-6 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-ink-muted">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.popular ? 'primary' : 'secondary'}
                disabled={current || loading === plan.id}
                onClick={() => choose(plan.id)}
                className="mt-8 w-full"
              >
                {current ? 'Current plan' : loading === plan.id ? 'Opening checkout…' : plan.id === 'free' ? 'Start free' : `Choose ${plan.name}`}
              </Button>
            </Card>
          );
        })}
      </div>

      <section className="mt-20 grid gap-8 md:grid-cols-[1fr_2fr]">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">Questions</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Anything else? See the <Link to="/docs" className="text-brand hover:text-brand-hover">API docs</Link> or the <Link to="/status" className="text-brand hover:text-brand-hover">status page</Link>.
          </p>
        </div>
        <dl className="divide-y divide-line-subtle">
          {FAQ.map(([q, a]) => (
            <div key={q} className="py-5">
              <dt className="font-medium text-ink">{q}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-ink-muted">{a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </PublicShell>
  );
}
