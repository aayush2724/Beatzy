import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';
import PageWrapper from '../components/PageWrapper';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import { 
  UserCircle, 
  Mail, 
  ShieldCheck, 
  Lock, 
  CreditCard, 
  Zap, 
  ArrowUpRight, 
  Database, 
  Fingerprint,
  Activity
} from 'lucide-react';

const PLAN_PRICES = { pro: '$19.99 / cycle', enterprise: '$99.99 / cycle', free: '$0 / cycle' };

function ProfileSection({ icon: Icon, title, children, accentColor = 'text-[#FF6B35]' }) {
  return (
    <section className="glass-card p-10 border border-[#0D0808]/10 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none group-hover:opacity-[0.06] transition-opacity">
          <Icon className="w-48 h-48" />
      </div>
      <div className="flex items-center gap-4 mb-10 relative z-10">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/[0.03] border border-[#0D0808]/10 group-hover:border-[#0D0808]/20 transition-colors`}>
          <Icon className={`w-5 h-5 ${accentColor}`} />
        </div>
        <h2 className="font-display font-black text-xl text-[#FFFFFF] uppercase tracking-widest">{title}</h2>
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
      toast.success('Identity updated in neural core');
    } finally { setSavingName(false); }
  }

  async function savePassword(e) {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) return toast.error('Encryption keys mismatch');
    setSavingPw(true);
    try {
      await api.patch('/api/users/me/password', { currentPassword: passwords.current, newPassword: passwords.new });
      toast.success('Security protocol re-encrypted');
      setPasswords({ current: '', new: '', confirm: '' });
    } finally { setSavingPw(false); }
  }

  async function openBillingPortal() {
    try {
      const { data } = await api.post('/api/billing/portal');
      window.location.href = data.url;
    } catch (err) {
      toast.error('Billing interface offline');
    }
  }

  return (
    <PageWrapper className="max-w-[1200px] mx-auto space-y-16 pb-20 animate-page-entrance">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-center gap-10 border-b border-[#0D0808]/5 pb-16 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-[#FF6B35]/5 blur-[100px] rounded-full -ml-32 pointer-events-none" />
        
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-32 h-32 rounded-[3rem] flex items-center justify-center text-5xl font-black text-black flex-shrink-0 bg-[#FF6B35] shadow-[0_0_60px_rgba(255,107,53,0.2)] relative z-10"
        >
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </motion.div>
        
        <div className="text-center md:text-left relative z-10 space-y-4">
          <h1 className="text-6xl font-display font-black text-[#FFFFFF] tracking-tighter uppercase leading-none">{user?.name}</h1>
          <div className="flex flex-wrap justify-center md:justify-start items-center gap-6">
              <div className="flex items-center gap-2 text-[#FFFFFF]/40 font-mono text-[10px] uppercase tracking-widest">
                  <Mail className="w-3 h-3" /> {user?.email}
              </div>
              <div className="w-1 h-1 rounded-full bg-white/10" />
              <div className="px-4 py-1.5 rounded-full font-mono text-[9px] font-black uppercase tracking-[0.2em] bg-[#FF6B35]/10 border border-[#FF6B35]/20 text-[#FF6B35] flex items-center gap-2">
                <Zap className="w-3 h-3 fill-current" /> {user?.plan || 'FREE'} SECTOR
              </div>
          </div>
        </div>
      </header>

      <div className="grid gap-12">
          {/* Personal Info */}
          <ProfileSection icon={Fingerprint} title="Operator Identity" accentColor="text-[#FF6B35]">
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <label className="text-sm text-[#FFFFFF]/60 font-medium block ml-1">Permanent Identifier</label>
                <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FFFFFF]/10 group-focus-within:text-[#FF6B35] transition-colors" />
                    <input disabled value={user?.email || ''} className="w-full h-14 bg-white/[0.02] border border-dashed border-[#0D0808]/10 rounded-2xl pl-12 pr-4 text-[#FFFFFF]/40 font-mono text-xs cursor-not-allowed" />
                </div>
                <p className="font-mono text-[11px] text-[#FFFFFF]/20 mt-2 uppercase tracking-widest italic ml-1">Identity locked to neural core architecture.</p>
              </div>

              <form onSubmit={saveName} className="space-y-4">
                <label className="text-sm text-[#FFFFFF]/60 font-medium block ml-1">Interface Alias</label>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FFFFFF]/10 group-focus-within:text-[#FF6B35] transition-colors" />
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Operator Alias" required minLength={2} className="w-full h-14 bg-white/[0.03] border border-[#0D0808]/10 rounded-2xl pl-12 pr-4 text-[#FFFFFF] placeholder:text-[#FFFFFF]/20 focus:outline-none focus:border-[#FF6B35]/30 transition-all font-medium" />
                    </div>
                    <button type="submit" disabled={savingName} className="h-14 px-10 rounded-2xl bg-[#FF6B35] text-black font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,107,53,0.15)] disabled:opacity-50">
                        {savingName ? 'SYNCING...' : 'SYNC'}
                    </button>
                </div>
              </form>
            </div>
          </ProfileSection>

          {/* Change Password */}
          <ProfileSection icon={ShieldCheck} title="Access Encryption" accentColor="text-[#FF6B35]">
            <form onSubmit={savePassword} className="grid lg:grid-cols-3 gap-8">
              <div className="space-y-4">
                <label className="text-sm text-[#FFFFFF]/60 font-medium block ml-1">Active Encryption Key</label>
                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FFFFFF]/10 group-focus-within:text-[#FF6B35] transition-colors" />
                    <input type="password" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} required className="w-full h-14 bg-white/[0.03] border border-[#0D0808]/10 rounded-2xl pl-12 pr-4 text-[#FFFFFF] focus:outline-none focus:border-[#FF6B35]/30 transition-all" />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-sm text-[#FFFFFF]/60 font-medium block ml-1">New Generation Key</label>
                <div className="relative group">
                    <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FFFFFF]/10 group-focus-within:text-[#FF6B35] transition-colors" />
                    <input type="password" value={passwords.new} onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))} required minLength={8} className="w-full h-14 bg-white/[0.03] border border-[#0D0808]/10 rounded-2xl pl-12 pr-4 text-[#FFFFFF] focus:outline-none focus:border-[#FF6B35]/30 transition-all" />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-sm text-[#FFFFFF]/60 font-medium block ml-1">Verify Generation Key</label>
                <div className="relative group">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FFFFFF]/10 group-focus-within:text-[#FF6B35] transition-colors" />
                    <input type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} required minLength={8} className="w-full h-14 bg-white/[0.03] border border-[#0D0808]/10 rounded-2xl pl-12 pr-4 text-[#FFFFFF] focus:outline-none focus:border-[#FF6B35]/30 transition-all" />
                </div>
              </div>
              <div className="lg:col-span-3 pt-4">
                <button type="submit" disabled={savingPw} className="h-14 px-12 rounded-2xl border border-[#FF6B35]/30 bg-[#FF6B35]/5 text-[#FF6B35] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#FF6B35] hover:text-black transition-all shadow-[0_0_30px_rgba(244,164,96,0.1)] disabled:opacity-50">
                    {savingPw ? 'RE-ENCRYPTING...' : 'INITIALIZE RE-ENCRYPTION PROTOCOL'}
                </button>
              </div>
            </form>
          </ProfileSection>

          {/* Subscription */}
          <ProfileSection icon={Database} title="Resource Matrix" accentColor="text-[#FFDAB9]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 p-10 rounded-[2.5rem] bg-white/[0.01] border border-[#0D0808]/5 relative overflow-hidden group/matrix">
              <div className="absolute inset-0 bg-[#FFDAB9]/5 opacity-0 group-hover/matrix:opacity-100 transition-opacity" />
              
              <div className="space-y-8 relative z-10">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[10px] text-[#FFFFFF]/30 uppercase tracking-[0.3em]">Operational Tier</span>
                  <div className="px-4 py-1.5 rounded-xl bg-[#FFDAB9] text-[#FFFFFF] font-black font-mono text-[10px] uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(232,160,132,0.3)]">
                    {user?.plan ? `${user.plan} resonance` : 'FREE RESONANCE'}
                  </div>
                </div>
                <div className="space-y-2">
                    <p className="text-5xl font-display font-black text-[#FFFFFF] uppercase tracking-tighter">{PLAN_PRICES[user?.plan] || PLAN_PRICES.free}</p>
                    <p className="font-mono text-[10px] text-[#FFFFFF]/20 uppercase tracking-[0.2em] max-w-sm leading-relaxed">Continuous analysis capability active. Uplink secured via Stripe automated protocols.</p>
                </div>
              </div>

              <div className="flex flex-col gap-4 min-w-[280px] relative z-10">
                <button onClick={openBillingPortal} className="group flex items-center justify-center gap-3 h-14 rounded-2xl bg-white/[0.03] border border-[#0D0808]/10 text-[#FFFFFF] font-black text-[10px] uppercase tracking-widest hover:bg-white/[0.06] hover:border-[#0D0808]/20 transition-all">
                  <CreditCard className="w-4 h-4 text-[#FFFFFF]/40" /> BILLING CONSOLE
                </button>
                <Link to="/pricing" className="group flex items-center justify-center gap-2 h-14 rounded-2xl bg-[#FFDAB9]/10 border border-[#FFDAB9]/20 text-[#FFDAB9] font-black text-[10px] uppercase tracking-widest hover:bg-[#FFDAB9] hover:text-[#FFFFFF] transition-all">
                  UPGRADE ACCESS <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </ProfileSection>
      </div>

      {/* Technical Metadata Decoration */}
      <div className="flex justify-between items-center pt-20 font-mono text-[10px] text-[#FFFFFF]/10 uppercase tracking-[0.3em] select-none">
            <div className="flex items-center gap-4">
                <div className="w-1 h-1 rounded-full bg-[#FF6B35] animate-pulse" />
                Operator Sync Active
            </div>
            <div>Auth Protocol: JWT-RS256</div>
            <div className="flex items-center gap-2">
                <Activity className="w-2 h-2" />
                System Core V4.2
            </div>
        </div>
    </PageWrapper>
  );
}
