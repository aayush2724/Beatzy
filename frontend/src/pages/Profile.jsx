import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';

const SG = { fontFamily: "'Space Grotesk', 'Hanken Grotesk', sans-serif" };

function Section({ icon, title, children }) {
  return (
    <section className="rounded-2xl p-7 border transition-all hover:border-white/10" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(215,255,90,0.08)', border: '1px solid rgba(215,255,90,0.2)' }}>
          <span className="material-symbols-outlined text-sonic-lime text-base" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
        <h2 className="font-bold text-base text-white" style={SG}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <label className="font-mono text-[9px] text-white/35 uppercase tracking-[0.2em] block">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 outline-none transition-all";
const inputStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' };
const inputFocus = e => e.target.style.borderColor = 'rgba(215,255,90,0.4)';
const inputBlur = e => e.target.style.borderColor = 'rgba(255,255,255,0.08)';

const PLAN_PRICES = { pro: '$19.99 / cycle', enterprise: '$99.99 / cycle', free: '$0 / cycle' };

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
      toast.success('Name updated', { style: { background: '#0c0c0c', color: '#D7FF5A', border: '1px solid rgba(215,255,90,0.3)' } });
    } finally { setSavingName(false); }
  }

  async function savePassword(e) {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) return toast.error('Passwords do not match');
    setSavingPw(true);
    try {
      await api.patch('/api/users/me/password', { currentPassword: passwords.current, newPassword: passwords.new });
      toast.success('Password updated', { style: { background: '#0c0c0c', color: '#D7FF5A', border: '1px solid rgba(215,255,90,0.3)' } });
      setPasswords({ current: '', new: '', confirm: '' });
    } finally { setSavingPw(false); }
  }

  async function openBillingPortal() {
    try {
      const { data } = await api.post('/api/billing/portal');
      window.location.href = data.data.url;
    } catch { toast.error('No active subscription'); }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <header className="flex items-center gap-4 mb-2">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-black flex-shrink-0" style={{ background: '#D7FF5A', boxShadow: '0 0 24px rgba(215,255,90,0.25)', ...SG }}>
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white" style={SG}>{user?.name}</h1>
          <p className="font-mono text-[10px] text-white/30 uppercase tracking-widest">{user?.email}</p>
        </div>
        <div className="ml-auto px-3 py-1 rounded-full font-mono text-[9px] uppercase tracking-wider font-bold" style={{ background: 'rgba(215,255,90,0.1)', border: '1px solid rgba(215,255,90,0.25)', color: '#D7FF5A' }}>
          {user?.plan || 'free'} plan
        </div>
      </header>

      {/* Personal Info */}
      <Section icon="person" title="Personal Information">
        <div className="space-y-5">
          <Field label="Master Identity (Email)">
            <input disabled value={user?.email || ''} className={`${inputCls} opacity-40 cursor-not-allowed`} style={inputStyle} />
            <p className="font-mono text-[8px] text-white/20 mt-1">Master identity cannot be altered within this node.</p>
          </Field>
          <form onSubmit={saveName}>
            <Field label="Resonance Label (Display Name)">
              <div className="flex flex-col md:flex-row gap-3 mt-2">
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Pulse Operator" required minLength={2} className={inputCls} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                <button type="submit" disabled={savingName} className="px-6 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-50 shrink-0" style={{ background: '#D7FF5A', color: '#050505', ...SG }}>
                  {savingName ? 'Saving...' : 'Update'}
                </button>
              </div>
            </Field>
          </form>
        </div>
      </Section>

      {/* Change Password */}
      <Section icon="key" title="Change Password">
        <form onSubmit={savePassword} className="space-y-5">
          <Field label="Current Access Key">
            <input type="password" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} required className={`${inputCls} mt-2`} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="New Access Key">
              <input type="password" value={passwords.new} onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))} required minLength={8} className={`${inputCls} mt-2`} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
            </Field>
            <Field label="Confirm Access Key">
              <input type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} required minLength={8} className={`${inputCls} mt-2`} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
            </Field>
          </div>
          <button type="submit" disabled={savingPw} className="px-7 py-3 rounded-xl font-mono text-xs uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-50" style={{ border: '1px solid rgba(215,255,90,0.3)', color: '#D7FF5A' }}>
            {savingPw ? 'Updating...' : 'Re-encrypt Account'}
          </button>
        </form>
      </Section>

      {/* Subscription */}
      <Section icon="verified" title="Subscription Protocol">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] text-white/35 uppercase tracking-wider">Active Plan:</span>
              <span className="px-2.5 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-wider" style={{ background: '#D7FF5A', color: '#050505' }}>
                {user?.plan ? `${user.plan} Resonance` : 'Free Resonance'}
              </span>
            </div>
            <p className="text-lg font-bold text-white" style={SG}>{PLAN_PRICES[user?.plan] || PLAN_PRICES.free}</p>
            <p className="font-mono text-[9px] text-white/30">Manage billing, invoices, and plan changes</p>
          </div>
          <div className="flex flex-col gap-2.5">
            <button onClick={openBillingPortal} className="px-6 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider font-bold transition-all active:scale-[0.98]" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
              Billing Portal
            </button>
            <Link to="/pricing" className="text-center font-mono text-[9px] uppercase tracking-wider text-sonic-lime/60 hover:text-sonic-lime transition-colors">
              View Plans
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
