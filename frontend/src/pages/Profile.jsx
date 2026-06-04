import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api/client';
import PageWrapper from '../components/PageWrapper';
import { useAuthStore } from '../store/authStore';
import clsx from 'clsx';

const SG = { fontFamily: "'Space Grotesk', 'Hanken Grotesk', sans-serif" };
const PLAN_PRICES = { pro: '$19.99 / cycle', enterprise: '$99.99 / cycle', free: '$0 / cycle' };

function Section({ icon, title, children }) {
  return (
    <section className="glass-panel p-8 rounded-2xl border border-glass-border transition-all hover:border-white/10 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
          <span className="material-symbols-outlined text-9xl">{icon}</span>
      </div>
      <div className="flex items-center gap-4 mb-8 relative z-10">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20">
          <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
        <h2 className="font-headline font-bold text-lg text-white uppercase tracking-widest" style={SG}>{title}</h2>
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </section>
  );
}

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [savingName, setSavingName] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  async function saveName(e) {
    e.preventDefault();
    setSavingName(true);
    try {
      const { data } = await api.patch('/api/users/me', { name });
      setUser(data.data);
      toast.success('Identity updated', { style: { background: 'var(--color-surface-container)', color: 'var(--color-primary)', border: '1px solid var(--color-glass-border)' } });
    } finally { setSavingName(false); }
  }

  async function savePassword(e) {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) return toast.error('Passwords do not match');
    setSavingPw(true);
    try {
      await api.patch('/api/users/me/password', { currentPassword: passwords.current, newPassword: passwords.new });
      toast.success('Protocol re-encrypted', { style: { background: 'var(--color-surface-container)', color: 'var(--color-primary)', border: '1px solid var(--color-glass-border)' } });
      setPasswords({ current: '', new: '', confirm: '' });
    } finally { setSavingPw(false); }
  }

  async function openBillingPortal() {
    try {
      const { data } = await api.post('/api/billing/portal');
      window.location.href = data.url;
    } catch (err) {
      toast.error('Billing sync failed');
    }
  }

  return (
    <PageWrapper className="max-w-4xl mx-auto space-y-12 pb-20">
      {/* Header */}
      <header className="flex items-center gap-8 mb-4 p-4 border-b border-white/5 pb-12">
        <div className="w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-4xl font-extrabold text-surface flex-shrink-0 bg-primary shadow-[0_0_50px_rgba(255,255,255,0.2)]" style={SG}>
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <h1 className="text-5xl font-headline font-extrabold text-white tracking-tighter" style={SG}>{user?.name}</h1>
          <div className="flex items-center gap-4 mt-2">
              <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.2em]">{user?.email}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="px-3 py-1 rounded-full font-mono text-[9px] uppercase tracking-widest font-extrabold bg-primary/10 border border-primary/30 text-primary">
                {user?.plan || 'FREE'} SECTOR
              </span>
          </div>
        </div>
      </header>

      <div className="grid gap-12">
          {/* Personal Info */}
          <Section icon="fingerprint" title="Master Identity">
            <div className="space-y-8">
              <div className="max-w-md">
                <label className="font-mono text-[10px] text-white/30 uppercase tracking-[0.3em] block mb-3">Permanent Identifier</label>
                <input disabled value={user?.email || ''} className="input opacity-50 cursor-not-allowed bg-white/[0.02] border-dashed" />
                <p className="font-mono text-[9px] text-white/20 mt-3 italic">Identity linked to neural core. Cannot be altered.</p>
              </div>
              <form onSubmit={saveName} className="max-w-2xl">
                <label className="font-mono text-[10px] text-white/30 uppercase tracking-[0.3em] block mb-3">Interface Label</label>
                <div className="flex flex-col md:flex-row gap-4">
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Operator Alias" required minLength={2} className="input" />
                    <button type="submit" disabled={savingName} className="btn-primary shrink-0 px-10 uppercase tracking-widest font-bold text-xs">
                    {savingName ? 'SAVING...' : 'UPDATE'}
                    </button>
                </div>
              </form>
            </div>
          </Section>

          {/* Change Password */}
          <Section icon="security" title="Security Protocol">
            <form onSubmit={savePassword} className="space-y-8 max-w-2xl">
              <div>
                <label className="font-mono text-[10px] text-white/30 uppercase tracking-[0.3em] block mb-3">Current Access Key</label>
                <input type="password" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} required className="input" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="font-mono text-[10px] text-white/30 uppercase tracking-[0.3em] block mb-3">New Access Key</label>
                  <input type="password" value={passwords.new} onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))} required minLength={8} className="input" />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-white/30 uppercase tracking-[0.3em] block mb-3">Confirm Key</label>
                  <input type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} required minLength={8} className="input" />
                </div>
              </div>
              <button type="submit" disabled={savingPw} className="btn-secondary border-primary/20 text-primary hover:bg-primary/5 px-12 py-4 text-[10px] uppercase tracking-[0.2em] font-extrabold">
                {savingPw ? 'RE-ENCRYPTING...' : 'INITIALIZE RE-ENCRYPTION'}
              </button>
            </form>
          </Section>

          {/* Subscription */}
          <Section icon="verified" title="Resource Matrix">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 p-8 rounded-2xl bg-white/[0.01] border border-white/5 shadow-inner">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em]">Active Tier</span>
                  <span className="px-4 py-1.5 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-[0.2em] bg-primary text-surface shadow-[0_0_30px_rgba(255,255,255,0.25)]">
                    {user?.plan ? `${user.plan} resonance` : 'FREE RESONANCE'}
                  </span>
                </div>
                <p className="text-4xl font-headline font-extrabold text-white mt-2" style={SG}>{PLAN_PRICES[user?.plan] || PLAN_PRICES.free}</p>
                <p className="font-mono text-[10px] text-white/20 uppercase tracking-widest leading-relaxed">Continuous analysis capability active. Billing cycle automated via Stripe Protocol.</p>
              </div>
              <div className="flex flex-col gap-4 min-w-[240px]">
                <button onClick={openBillingPortal} className="btn-secondary py-4 text-[10px] uppercase tracking-[0.2em] font-extrabold bg-white/5 hover:bg-white/10 border-white/20">
                  BILLING CONSOLE
                </button>
                <Link to="/pricing" className="text-center font-mono text-[10px] uppercase tracking-widest text-primary/40 hover:text-primary transition-all font-bold">
                  UPGRADE ACCESS TIER
                </Link>
              </div>
            </div>
          </Section>
      </div>
    </PageWrapper>
  );
}
