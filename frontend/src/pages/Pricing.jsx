import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import api from '../api/client';

const plans = [
  {
    id: 'free', tier: 'Free Tier', name: 'Free', price: 0, period: '/mo',
    description: 'Perfect for exploring Beatzy',
    features: ['100 analyses/month', 'Basic audio insights', 'Web dashboard', 'Community support'],
    highlight: false,
  },
  {
    id: 'pro', tier: 'Power User', name: 'Pro', price: 19, period: '/mo',
    description: 'For developers and audio professionals',
    features: ['5,000 analyses/month', 'Full AI insights (YAMNet, mood, key)', 'REST API access', '5 API keys', 'Priority processing', 'Email support'],
    highlight: true,
  },
  {
    id: 'enterprise', tier: 'High Scale', name: 'Enterprise', price: 99, period: '/mo',
    description: 'Unlimited scale with SLA guarantees',
    features: ['Unlimited analyses', 'All Pro features', '20 API keys', 'Priority queue', 'SLA support', 'Custom integrations'],
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
    } catch { toast.error('Failed to start checkout'); }
    finally { setLoading(null); }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white font-body selection:bg-white/20">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#050505_72%)] pointer-events-none" />
      <div
        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 20% 20%, rgba(255,255,255,0.04) 0%, transparent 45%), radial-gradient(ellipse at 80% 80%, rgba(255,255,255,0.03) 0%, transparent 50%)',
        }}
      />

      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-8">
        <Link to="/" className="font-headline text-lg tracking-[0.25em] text-white hover:text-gray-200 transition">
          BEATZY
        </Link>
        <div className="flex items-center gap-6 md:gap-10 text-xs tracking-[0.1em] uppercase text-gray-400">
          <Link to="/" className="hover:text-white transition">Home</Link>
          {token ? (
            <Link to="/dashboard" className="btn-primary py-2 px-4 text-[10px] tracking-[0.15em]">Dashboard</Link>
          ) : (
            <Link to="/login" className="hover:text-white transition">Sign In</Link>
          )}
        </div>
      </nav>

      <main className="relative z-10 pt-8 pb-24 px-6 max-w-5xl mx-auto">
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03]">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="font-mono text-[9px] text-gray-400 uppercase tracking-[0.25em]">Plans</span>
          </div>
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Simple, transparent pricing
          </h1>
          <p className="text-sm text-gray-400">Start free. Upgrade when you need more power.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-24">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-7 flex flex-col transition-all duration-300 hover:-translate-y-1 glass-panel ${
                plan.highlight ? 'border-white/20 shadow-[0_24px_80px_rgba(0,0,0,0.5)]' : ''
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider bg-white text-black">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <span className={`font-mono text-[9px] uppercase tracking-[0.2em] block mb-2 ${plan.highlight ? 'text-white' : 'text-gray-500'}`}>{plan.tier}</span>
                <h3 className="font-headline text-2xl font-bold text-white mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="font-headline text-4xl font-bold text-white">${plan.price}</span>
                  <span className="font-mono text-sm text-gray-500">{plan.period}</span>
                </div>
                <p className="text-xs text-gray-500">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 bg-white/5 border border-white/15">
                      <span className="material-symbols-outlined text-white" style={{ fontSize: 10, fontVariationSettings: "'FILL' 1" }}>check</span>
                    </div>
                    <span className={`text-xs ${plan.highlight ? 'text-gray-300' : 'text-gray-500'}`}>{f}</span>
                  </li>
                ))}
              </ul>

              {plan.id === 'free' ? (
                <Link
                  to={token ? '/dashboard' : '/register'}
                  className="btn-secondary w-full py-3.5 text-center text-xs uppercase tracking-[0.15em]"
                >
                  {user?.plan === 'free' ? 'Current plan' : 'Get started free'}
                </Link>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={loading === plan.id || user?.plan === plan.id}
                  className={`w-full py-3.5 rounded-xl text-xs uppercase tracking-[0.15em] font-bold transition-all active:scale-[0.98] disabled:opacity-50 ${
                    plan.highlight ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  {loading === plan.id ? 'Redirecting...' : user?.plan === plan.id ? 'Current plan' : plan.id === 'pro' ? 'Upgrade to Pro' : 'Upgrade to Enterprise'}
                </button>
              )}
            </div>
          ))}
        </div>

        <section className="pt-16 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-gray-500 mb-4">Built for scale</p>
            <h2 className="font-headline text-2xl font-bold text-white mb-4 tracking-tight">Engineered for technical mastery</h2>
            <p className="text-xs text-gray-500 leading-relaxed mb-6">
              Sub-millisecond classification latency for real-time production environments. Join thousands of engineers who trust Beatzy.
            </p>
            <div className="flex gap-6">
              {['AudioLabs', 'Waveform Co.', 'Spectral Inc.'].map(b => (
                <span key={b} className="font-mono text-[9px] uppercase tracking-widest text-gray-600">{b}</span>
              ))}
            </div>
          </div>
          <div className="glass-panel h-48 flex items-center justify-center">
            <div className="flex items-center gap-8 opacity-40">
              {['AudioLabs', 'Waveform Co', 'Spectral Inc'].map(brand => (
                <div key={brand} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white">graphic_eq</span>
                  </div>
                  <span className="font-mono text-[8px] text-gray-500 uppercase tracking-widest">{brand}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 py-10 px-8 flex flex-col md:flex-row justify-between items-center gap-5">
        <span className="font-headline text-lg tracking-[0.25em] text-white">BEATZY</span>
        <div className="flex gap-8">
          {['Architecture', 'Privacy', 'API Docs', 'Terms'].map(l => (
            <Link key={l} to="/" className="font-mono text-[9px] uppercase tracking-[0.2em] text-gray-600 hover:text-white transition-colors">{l}</Link>
          ))}
        </div>
        <span className="font-mono text-[9px] text-gray-600 uppercase tracking-widest">© 2026 Beatzy AI</span>
      </footer>
    </div>
  );
}
