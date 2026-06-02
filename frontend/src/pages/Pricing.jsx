import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import api from '../api/client';

const SG = { fontFamily: "'Space Grotesk', 'Hanken Grotesk', sans-serif" };

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
    <div className="min-h-screen text-white selection:bg-sonic-lime/20" style={{ background: '#050505' }}>
      {/* Scanline */}
      <div className="fixed inset-0 pointer-events-none z-50" style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(212,255,63,0.018) 50%)', backgroundSize: '100% 4px' }} />

      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'url(https://lh3.googleusercontent.com/aida/ADBb0uh-0FrOXxKO8zCLpEu9COZ0NjPhmB0M3CYTC6MslAizqy6oxpikKSbjwlpDXof1V0WMkPJ7cyidwHydp6SqsjFYeVEcmD12VIQik4t_eplJ4U5iYbjT0Rn5DNBDAA6ti-ldnBv36jMOHmtXuadMmlIS4uVbzY8bmdTU2FNk8GjctXeogZL1KXNqVRDSV-SEsugB75GEfoAj9Kp9n68EjvxslX-eaUZgS5bkumai5w1EuID5XvbiDZp5kg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(5,5,5,0.95) 0%, rgba(5,5,5,0.6) 50%, #050505 100%)' }} />
        <div className="absolute rounded-full" style={{ width: 700, height: 700, top: '20%', left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute rounded-full" style={{ width: 400, height: 400, bottom: '10%', left: '10%', background: 'radial-gradient(circle, rgba(215,255,90,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-8 py-5" style={{ background: 'linear-gradient(to bottom, rgba(5,5,5,0.95), transparent)', backdropFilter: 'blur(8px)' }}>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-sonic-lime/10 border border-sonic-lime/40 rounded flex items-center justify-center" style={{ boxShadow: '0 0 14px rgba(215,255,90,0.2)' }}>
            <span className="material-symbols-outlined text-sonic-lime text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
          </div>
          <span className="font-bold text-lg text-sonic-lime" style={SG}>BEATZY</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/" className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35 hover:text-white/70 transition-colors">Home</Link>
          {token ? (
            <Link to="/dashboard" className="px-4 py-2 rounded-xl font-mono text-[10px] uppercase tracking-[0.15em] transition-all" style={{ border: '1px solid rgba(215,255,90,0.3)', color: '#D7FF5A' }}>Dashboard</Link>
          ) : (
            <Link to="/login" className="px-4 py-2 rounded-xl font-mono text-[10px] uppercase tracking-[0.15em] transition-all" style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>Sign In</Link>
          )}
        </div>
      </nav>

      <main className="relative z-10 pt-36 pb-24 px-6 max-w-5xl mx-auto">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full" style={{ border: '1px solid rgba(215,255,90,0.2)', background: 'rgba(215,255,90,0.05)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-sonic-lime animate-pulse" />
            <span className="font-mono text-[9px] text-sonic-lime/80 uppercase tracking-[0.25em]">Protocol Active</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ ...SG, letterSpacing: '-0.02em' }}>
            Simple, transparent pricing
          </h1>
          <p className="font-mono text-sm text-white/30">Start free. Upgrade when you need more power.</p>
        </header>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-24">
          {plans.map(plan => (
            <div key={plan.id} className={`relative rounded-2xl p-7 flex flex-col transition-all duration-300 hover:-translate-y-1 ${plan.highlight ? '' : ''}`}
              style={{
                background: plan.highlight ? 'rgba(215,255,90,0.04)' : 'rgba(255,255,255,0.025)',
                border: plan.highlight ? '1px solid rgba(215,255,90,0.25)' : '1px solid rgba(255,255,255,0.07)',
                boxShadow: plan.highlight ? '0 0 60px rgba(215,255,90,0.06)' : 'none',
              }}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider" style={{ background: '#D7FF5A', color: '#050505' }}>
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <span className={`font-mono text-[9px] uppercase tracking-[0.2em] block mb-2 ${plan.highlight ? 'text-sonic-lime' : 'text-white/25'}`}>{plan.tier}</span>
                <h3 className="text-2xl font-bold text-white mb-1" style={SG}>{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-4xl font-bold text-white" style={SG}>${plan.price}</span>
                  <span className="font-mono text-sm text-white/30">{plan.period}</span>
                </div>
                <p className="font-mono text-xs text-white/30">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(215,255,90,0.1)', border: '1px solid rgba(215,255,90,0.25)' }}>
                      <span className="material-symbols-outlined text-sonic-lime" style={{ fontSize: 10, fontVariationSettings: "'FILL' 1" }}>check</span>
                    </div>
                    <span className={`font-mono text-xs ${plan.highlight ? 'text-white/70' : 'text-white/40'}`}>{f}</span>
                  </li>
                ))}
              </ul>

              {plan.id === 'free' ? (
                <Link to={token ? '/dashboard' : '/register'} className="w-full py-3.5 text-center rounded-xl font-mono text-xs uppercase tracking-[0.15em] transition-all hover:border-white/20" style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                  {user?.plan === 'free' ? 'Current plan' : 'Get started free'}
                </Link>
              ) : (
                <button onClick={() => handleUpgrade(plan.id)} disabled={loading === plan.id || user?.plan === plan.id} className="w-full py-3.5 rounded-xl font-mono text-xs uppercase tracking-[0.15em] font-bold transition-all active:scale-[0.98] disabled:opacity-50" style={plan.highlight ? { background: '#D7FF5A', color: '#050505', boxShadow: '0 0 30px rgba(215,255,90,0.2)', ...SG } : { border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                  {loading === plan.id ? 'Redirecting...' : user?.plan === plan.id ? 'Current plan' : plan.id === 'pro' ? 'Upgrade to Pro' : 'Upgrade to Enterprise'}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Bottom section */}
        <section className="pt-16 border-t grid grid-cols-1 md:grid-cols-2 gap-12 items-center" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-sonic-lime/50 mb-4">Built for scale</p>
            <h2 className="text-2xl font-bold text-white mb-4" style={{ ...SG, letterSpacing: '-0.01em' }}>Engineered for Technical Mastery</h2>
            <p className="font-mono text-xs text-white/30 leading-relaxed mb-6">Built on the Obsidian Spectral engine, delivering sub-millisecond classification latency for real-time production environments. Join thousands of engineers who trust our protocols.</p>
            <div className="flex gap-6">
              {['AudioLabs', 'Waveform Co.', 'Spectral Inc.'].map(b => (
                <span key={b} className="font-mono text-[9px] uppercase tracking-widest text-white/15">{b}</span>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-2 rounded-2xl" style={{ background: 'radial-gradient(ellipse, rgba(215,255,90,0.06) 0%, transparent 70%)', filter: 'blur(20px)' }} />
            <div className="relative rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              <img alt="Audio Studio" className="w-full h-48 object-cover opacity-60 mix-blend-lighten" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_pkozwv4tUeEeMKk17RANc_M6HA_fR44nrlDEPtztvtk6m1bj70E7x437bwarJKkmrEhQrPE1THfpSYb4s11r0XPtg5V4sk2pGx-nOuy1zZgOJS6oaRrZEiKqwQUeuDmCUFnbG_6RJ51RGVlBmR65vSCyNcZ6LLNDljZMJSDk2SLNgBWe4RONNkCS2lFdk5WnDkJ3UfPBaSh2z_bf1_AJ1uZHWXwDX8Y1sZVAOC_tMf2OdsFgChPINKq451hWKN4-Cza0HQGWaA" />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t py-10 px-8 flex flex-col md:flex-row justify-between items-center gap-5" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}>
        <span className="font-bold text-sonic-lime" style={SG}>BEATZY</span>
        <div className="flex gap-8">
          {['Architecture', 'Privacy', 'API Docs', 'Terms'].map(l => (
            <Link key={l} to="/" className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/20 hover:text-sonic-lime transition-colors">{l}</Link>
          ))}
        </div>
        <span className="font-mono text-[9px] text-white/15 uppercase tracking-widest">© 2026 Beatzy AI</span>
      </footer>
    </div>
  );
}
