import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import api from '../api/client';

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

  useEffect(() => {
    const cards = document.querySelectorAll('.glass-card');

    function handleMouseMove(card, event) {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    }

    const listeners = Array.from(cards).map((card) => {
      const onMove = (event) => handleMouseMove(card, event);
      card.addEventListener('mousemove', onMove);
      return { card, onMove };
    });

    return () => {
      listeners.forEach(({ card, onMove }) => card.removeEventListener('mousemove', onMove));
    };
  }, []);

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
    <div className="min-h-screen bg-deep-obsidian text-on-surface overflow-x-hidden selection:bg-sonic-lime selection:text-deep-obsidian">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 scale-105"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida/ADBb0uh-0FrOXxKO8zCLpEu9COZ0NjPhmB0M3CYTC6MslAizqy6oxpikKSbjwlpDXof1V0WMkPJ7cyidwHydp6SqsjFYeVEcmD12VIQik4t_eplJ4U5iYbjT0Rn5DNBDAA6ti-ldnBv36jMOHmtXuadMmlIS4uVbzY8bmdTU2FNk8GjctXeogZL1KXNqVRDSV-SEsugB75GEfoAj9Kp9n68EjvxslX-eaUZgS5bkumai5w1EuID5XvbiDZp5kg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-deep-obsidian/80 via-transparent to-deep-obsidian" />
        <div className="absolute inset-0 technical-grid" />
      </div>

      <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/20 shadow-[0_0_20px_rgba(0,245,255,0.05)]">
        <div className="flex justify-between items-center px-margin-desktop py-4 max-w-container-max mx-auto">
          <Link to="/" className="font-headline-xl text-headline-lg tracking-tighter text-sonic-lime">
            Beatzy AI
          </Link>
          <div className="hidden md:flex space-x-8">
            <Link className="font-body-md text-body-md text-on-surface-variant hover:text-primary-fixed transition-all" to="/">
              Main Stage
            </Link>
            <Link className="font-body-md text-body-md text-on-surface-variant hover:text-primary-fixed transition-all" to="/artist-echoes">
              Inside the Wave
            </Link>
            <Link className="font-body-md text-body-md text-on-surface-variant hover:text-primary-fixed transition-all" to="/artist-echoes">
              Artist Echoes
            </Link>
            <Link className="font-body-md text-body-md text-on-surface-variant hover:text-primary-fixed transition-all" to="/pricing">
              Production Suite
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link to={token ? '/dashboard' : '/login'} className="material-symbols-outlined text-on-surface hover:text-sonic-lime transition-colors">
              account_circle
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-40 pb-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <header className="text-center mb-20 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-surface-container-high px-3 py-1 rounded-full border border-outline-variant/30 mb-6 animate-pulse">
            <span className="material-symbols-outlined text-sonic-lime text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              bolt
            </span>
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-sonic-lime">Protocol Active</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface mb-6">Simple, transparent pricing</h1>
          <p className="font-body-lg text-body-lg text-outline">Start free. Upgrade when you need more power.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`glass-card p-8 flex flex-col h-full rounded-xl hover:bg-surface-container/40 transition-colors group ${plan.highlight ? 'pro-glow relative overflow-hidden' : ''}`}
            >
              {plan.highlight && (
                <div className="absolute top-0 right-0 bg-sonic-lime text-deep-obsidian font-label-sm text-label-sm px-4 py-1.5 uppercase tracking-tighter font-bold">
                  Most Popular
                </div>
              )}
              <div className="mb-8">
                <span className={`font-label-md text-label-md mb-2 block ${plan.highlight ? 'text-sonic-lime' : 'text-outline'}`}>
                  {plan.id === 'free' ? 'FREE TIER' : plan.id === 'pro' ? 'POWER USER' : 'HIGH SCALE'}
                </span>
                <h3 className="font-headline-lg text-headline-lg text-on-surface mb-2">{plan.name}</h3>
                <div className="flex items-baseline space-x-1">
                  <span className="font-headline-xl text-headline-xl text-on-surface">${plan.price}</span>
                  <span className="font-body-md text-outline">{plan.period || '/mo'}</span>
                </div>
                <p className="mt-4 text-outline font-body-md">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-10 flex-grow">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center space-x-3">
                    <span className="material-symbols-outlined text-sonic-lime text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check
                    </span>
                    <span className={`font-body-md ${plan.highlight && feature === '5,000 analyses/month' ? 'text-on-surface font-semibold' : 'text-on-surface-variant'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {plan.id === 'free' ? (
                <Link
                  to={token ? '/dashboard' : '/register'}
                  className="w-full py-4 px-6 border border-outline-variant hover:border-on-surface text-on-surface font-label-md text-label-md uppercase tracking-widest transition-all active:scale-[0.98] text-center"
                >
                  {user?.plan === 'free' ? 'Current plan' : plan.cta}
                </Link>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={loading === plan.id || user?.plan === plan.id}
                  className={`w-full py-4 px-6 uppercase tracking-widest font-label-md transition-all active:scale-[0.98] ${plan.highlight ? 'bg-sonic-lime text-deep-obsidian font-bold hover:brightness-110 shadow-[0_0_20px_rgba(215,255,90,0.3)]' : 'border border-outline-variant hover:border-on-surface text-on-surface'}`}
                >
                  {loading === plan.id ? 'Redirecting...' : user?.plan === plan.id ? 'Current plan' : plan.cta}
                </button>
              )}
            </div>
          ))}
        </div>

        <section className="mt-32 pt-20 border-t border-outline-variant/20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-4">Engineered for Technical Mastery</h2>
            <p className="font-body-md text-outline max-w-lg">
              Beatzy AI is built on the Obsidian Spectral engine, delivering sub-millisecond classification latency for real-time production environments. Join thousands of engineers who trust our protocols.
            </p>
            <div className="flex space-x-8 mt-8 grayscale opacity-50">
              <div className="font-label-md text-label-md uppercase tracking-tighter">AudioLabs</div>
              <div className="font-label-md text-label-md uppercase tracking-tighter">Waveform Co.</div>
              <div className="font-label-md text-label-md uppercase tracking-tighter">Spectral Inc.</div>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-sonic-lime/20 to-tertiary/20 blur-2xl opacity-50" />
            <div className="relative glass-card p-4 rounded-xl">
              <div className="aspect-video bg-deep-obsidian overflow-hidden rounded">
                <img
                  alt="Audio Studio"
                  className="w-full h-full object-cover mix-blend-lighten opacity-80"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_pkozwv4tUeEeMKk17RANc_M6HA_fR44nrlDEPtztvtk6m1bj70E7x437bwarJKkmrEhQrPE1THfpSYb4s11r0XPtg5V4sk2pGx-nOuy1zZgOJS6oaRrZEiKqwQUeuDmCUFnbG_6RJ51RGVlBmR65vSCyNcZ6LLNDljZMJSDk2SLNgBWe4RONNkCS2lFdk5WnDkJ3UfPBaSh2z_bf1_AJ1uZHWXwDX8Y1sZVAOC_tMf2OdsFgChPINKq451hWKN4-Cza0HQGWaA"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-12 bg-surface-container-lowest border-t border-glass-border">
        <div className="max-w-container-max mx-auto px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="font-headline-lg text-on-surface text-headline-lg">Beatzy AI</div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            <Link className="font-label-sm text-label-sm text-outline hover:text-sonic-lime transition-colors" to="/">
              Architecture
            </Link>
            <Link className="font-label-sm text-label-sm text-outline hover:text-sonic-lime transition-colors" to="/">
              Privacy
            </Link>
            <Link className="font-label-sm text-label-sm text-outline hover:text-sonic-lime transition-colors" to="/">
              API Documentation
            </Link>
            <Link className="font-label-sm text-label-sm text-outline hover:text-sonic-lime transition-colors" to="/">
              Terms of Resonance
            </Link>
          </div>
          <div className="font-label-sm text-label-sm text-outline">© 2024 Beatzy AI. Protocols Reserved.</div>
        </div>
      </footer>
    </div>
  );
}
