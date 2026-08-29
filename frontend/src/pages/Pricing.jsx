import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import api from '../api/client';
import { ModernPricingPage } from '../components/ui/animated-glassy-pricing';
import { 
  Cpu, 
  Activity, 
  ChevronRight
} from 'lucide-react';

const plans = [
  {
    planName: 'Free',
    price: '0',
    description: 'Perfect for exploring the neural core.',
    features: ['500 requests/day', '100 analyses/month', 'Web dashboard', 'Community support'],
    buttonText: 'Initialize Free Tier',
    buttonVariant: 'secondary',
    isPopular: false,
    id: 'free'
  },
  {
    planName: 'Pro',
    price: '4.99',
    description: 'For developers and audio professionals.',
    features: ['10,000 requests/day', '1,000 analyses/month', 'REST API access', '5 API keys', 'Priority queue'],
    buttonText: 'Upgrade to Pro',
    buttonVariant: 'primary',
    isPopular: true,
    id: 'pro'
  },
  {
    planName: 'Enterprise',
    price: '19.99',
    description: 'Unlimited scale with SLA guarantees.',
    features: ['Unlimited analyses', 'All Pro features', '20 API keys', 'Priority support', 'Custom neural nodes'],
    buttonText: 'Initialize Enterprise',
    buttonVariant: 'secondary',
    isPopular: false,
    id: 'enterprise'
  },
];

export default function Pricing() {
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);

  async function handleUpgrade(planId) {
    if (!token) { navigate('/register'); return; }
    if (planId === 'free') { navigate('/dashboard'); return; }
    
    setLoading(planId);
    try {
      const { data } = await api.post('/api/billing/subscribe', { planId });
      window.location.href = data.data.url;
    } catch { 
        toast.error('Checkout protocol initialization failed'); 
    } finally { 
        setLoading(null); 
    }
  }

  // Map our plans to the component's expected format
  const formattedPlans = plans.map(plan => ({
    ...plan,
    buttonText: loading === plan.id ? 'Processing...' : user?.plan === plan.id ? 'Current Sector' : plan.buttonText,
    onClick: () => handleUpgrade(plan.id)
  }));

  return (
    <div className="bg-canvas min-h-screen selection:bg-brand/30">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-line-subtle bg-canvas/50 backdrop-blur-xl">
        <div className="max-w-[1720px] mx-auto flex h-20 items-center justify-between px-8 md:px-12">
            <Link to="/" className="group inline-flex items-center gap-3">
                <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-brand/30 bg-brand/10 shadow-[0_0_35px_color-mix(in_oklab,var(--brand)_16%,transparent)]">
                    <span className="absolute h-3 w-3 rounded-full bg-brand shadow-[0_0_22px_color-mix(in_oklab,var(--brand)_80%,transparent)]"></span>
                    <span className="h-7 w-7 rounded-full border border-brand/50"></span>
                </span>
                <span className="text-sm font-semibold tracking-[0.38em] text-brand">BEATZY</span>
            </Link>
            
            <div className="flex items-center gap-8">
                <Link to="/" className="text-[11px] font-medium tracking-[0.24em] text-brand/60 transition hover:text-brand">NETWORK</Link>
                {token ? (
                    <Link 
                        to="/dashboard" 
                        className="inline-flex h-11 items-center justify-center rounded-2xl bg-brand px-6 text-xs font-black text-brand-ink shadow-[0_0_40px_color-mix(in_oklab,var(--brand)_20%,transparent)] transition hover:-translate-y-0.5"
                    >
                        DASHBOARD
                    </Link>
                ) : (
                    <Link to="/login" className="text-[11px] font-medium tracking-[0.24em] text-brand/60 transition hover:text-ink">OPERATOR LOGIN</Link>
                )}
            </div>
        </div>
      </nav>

      <div className="pt-20">
<ModernPricingPage
          title="Simple Pricing"
          subtitle="Provision neural bandwidth for your production environment. Scale effortlessly from personal projects to enterprise clusters."
          plans={formattedPlans}
        />
      </div>

      <main className="max-w-[1500px] mx-auto px-8 pb-32 space-y-32 relative z-10">
        <section className="pt-24 border-t border-line-subtle grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-10">
                <div className="space-y-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand font-black">Architected for Scale</p>
                    <h2 className="text-5xl font-display font-black text-ink uppercase tracking-tight leading-none">Engineered for Technical Mastery</h2>
                    <p className="text-lg text-on-surface-variant leading-relaxed max-w-xl">
                        Sub-millisecond classification latency for real-time production environments. Built on a distributed neural cluster designed to handle 100M+ signal extractions.
                    </p>
                </div>
                
                <div className="grid grid-cols-2 gap-8 pt-8">
                    {[
                        { label: 'Uptime SLA', value: '99.99%', icon: Activity, color: 'text-brand' },
                        { label: 'Avg Latency', value: '184ms', icon: Cpu, color: 'text-accent-warm' },
                    ].map((stat, i) => (
                        <div key={i} className="space-y-3 p-6 rounded-2xl bg-ink/[0.02] border border-line-subtle group hover:border-line transition-colors">
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            <p className="text-3xl font-display font-black text-ink">{stat.value}</p>
                            <p className="font-mono text-[10px] text-ink/30 uppercase tracking-widest">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="glass-card p-12 border border-line-subtle relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-brand/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="relative z-10 space-y-10">
                    <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] text-ink/40 uppercase tracking-[0.2em] font-black flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                            Neural SDK V4.2
                        </span>
                        <ChevronRight className="w-4 h-4 text-ink/10 group-hover:text-brand transition-colors" />
                    </div>
                    
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-surface/60 border border-line shadow-inner">
                            <code className="font-mono text-xs text-ink/60 leading-relaxed block overflow-x-auto whitespace-pre">
                                <span className="text-brand">import</span> Beatzy <span className="text-brand">from</span> <span className="text-brand">'@beatzy/neural-sdk'</span>;{'\n'}
                                <span className="text-ink/30">{"//"} Initialize cluster node</span>{'\n'}
                                <span className="text-brand">const</span> node = <span className="text-accent-warm">new</span> Beatzy({'{'}{'\n'}
                                {'  '}apiKey: <span className="text-brand">'BZ_9081X_...'</span>{'\n'}
                                {'}'});
                            </code>
                        </div>
                        <p className="font-mono text-[10px] text-ink/20 uppercase tracking-[0.15em] text-center italic">Continuous analysis capability active. Distributed nodes online.</p>
                    </div>

                    <div className="flex justify-between items-center opacity-30 group-hover:opacity-60 transition-opacity">
                         {['AudioLabs', 'Spectral', 'VocalID', 'Waveform'].map(b => (
                             <span key={b} className="font-display font-black text-[10px] uppercase tracking-widest text-ink">{b}</span>
                         ))}
                    </div>
                </div>
            </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-line-subtle bg-canvas px-8 py-20">
        <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-4 text-center md:text-left">
              <p className="text-sm font-semibold tracking-[0.32em] text-brand">BEATZY</p>
              <p className="text-[10px] text-brand/60 uppercase tracking-widest max-w-xs leading-relaxed">Music intelligence engine for identification, spectral analysis, and neural API access.</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-12">
            {['Architecture', 'Privacy Protocol', 'Technical Docs', 'Service Terms'].map(l => (
              <Link key={l} to="/" className="text-[10px] font-black uppercase tracking-[0.15em] text-brand/60 hover:text-brand transition-colors">{l}</Link>
            ))}
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-2">
            <span className="font-mono text-[10px] text-zinc-700 uppercase tracking-[0.2em]">© 2026 BEATZY AI MAINFRMAE</span>
            <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-brand opacity-20" />
                <span className="font-mono text-[10px] text-zinc-800 uppercase tracking-widest leading-none">Node: Region-EU-1</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
