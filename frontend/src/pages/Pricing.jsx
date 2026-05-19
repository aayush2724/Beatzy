import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { useAuthStore } from '../store/authStore';
import api from '../api/client';
import clsx from 'clsx';

const plans = [
  {
    id: 'free', name: 'Free', price: 0, period: '',
    description: 'Perfect for trying out Beatzy',
    features: ['100 analyses/month', 'Basic audio insights', 'Web dashboard', 'Community support'],
    cta: 'Get started free',
    highlight: false,
  },
  {
    id: 'pro', name: 'Pro', price: 19, period: '/mo',
    description: 'For developers and audio professionals',
    features: ['5,000 analyses/month', 'Full AI insights (YAMNet, mood, key)', 'REST API access', '5 API keys', 'Priority processing', 'Email support'],
    cta: 'Upgrade to Pro',
    highlight: true,
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 99, period: '/mo',
    description: 'Unlimited scale with SLA guarantees',
    features: ['Unlimited analyses', 'All Pro features', '20 API keys', 'Priority queue', 'SLA support', 'Custom integrations'],
    cta: 'Upgrade to Enterprise',
    highlight: false,
  },
];

export default function Pricing() {
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);

  async function handleUpgrade(planId) {
    if (!token) { navigate('/register'); return; }
    setLoading(planId);
    try {
      const { data } = await api.post('/api/billing/subscribe', { planId });
      window.location.href = data.data.url;
    } catch {
      toast.error('Failed to start checkout');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <div className="pt-32 pb-24 px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold mb-4">Simple, transparent pricing</h1>
          <p className="text-gray-400 text-xl max-w-xl mx-auto">Start free. Upgrade when you need more power.</p>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className={clsx(
              'card flex flex-col',
              plan.highlight && 'border-brand-600/50 bg-gradient-to-b from-brand-600/10 to-dark-800 relative'
            )}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="badge bg-brand-600 text-white px-4 py-1 text-xs font-semibold">
                    Most popular
                  </span>
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">${plan.price}</span>
                  <span className="text-gray-400">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <Check size={16} className="text-brand-400 mt-0.5 shrink-0" />
                    <span className="text-gray-300">{f}</span>
                  </li>
                ))}
              </ul>

              {plan.id === 'free' ? (
                <Link to={token ? '/dashboard' : '/register'} className={clsx('btn-secondary text-center', plan.highlight && 'btn-primary')}>
                  {user?.plan === 'free' ? 'Current plan' : plan.cta}
                </Link>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={loading === plan.id || user?.plan === plan.id}
                  className={clsx('w-full', plan.highlight ? 'btn-primary' : 'btn-secondary')}
                >
                  {loading === plan.id ? 'Redirecting...' : user?.plan === plan.id ? 'Current plan' : plan.cta}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
