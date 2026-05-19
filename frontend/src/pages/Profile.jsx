import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';

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
      toast.success('Name updated');
    } finally {
      setSavingName(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) return toast.error('Passwords do not match');
    setSavingPw(true);
    try {
      await api.patch('/api/users/me/password', {
        currentPassword: passwords.current,
        newPassword: passwords.new,
      });
      toast.success('Password updated');
      setPasswords({ current: '', new: '', confirm: '' });
    } finally {
      setSavingPw(false);
    }
  }

  async function openBillingPortal() {
    try {
      const { data } = await api.post('/api/billing/portal');
      window.location.href = data.data.url;
    } catch {
      toast.error('No active subscription');
    }
  }

  return (
    <div className="min-h-screen bg-deep-obsidian text-on-surface overflow-x-hidden">
      <div className="hero-mesh" aria-hidden="true" />

      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-glass-border shadow-[0_0_20px_rgba(0,245,255,0.05)]">
        <div className="flex justify-between items-center px-margin-desktop py-4">
          <div className="flex items-center gap-8">
            <span className="font-display-lg text-headline-md tracking-tighter text-neon-cyan uppercase">Beatzy AI</span>
            <nav className="hidden lg:flex items-center gap-6">
              <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary-fixed transition-all" href="#">Main Stage</a>
              <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary-fixed transition-all" href="#">Inside the Wave</a>
              <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary-fixed transition-all" href="#">Artist Echoes</a>
              <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary-fixed transition-all" href="#">Production Suite</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-on-surface-variant hover:text-neon-cyan transition-colors active:scale-95">
              <span className="material-symbols-outlined">search</span>
            </button>
            <div className="h-8 w-[1px] bg-glass-border mx-2"></div>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-neon-cyan border border-neon-cyan/30 bg-neon-cyan/5 active:scale-95 transition-transform">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
              <span className="font-label-md text-label-md uppercase">Operator</span>
            </button>
          </div>
        </div>
      </header>

      <aside className="fixed left-0 top-0 h-full w-[280px] z-40 bg-deep-obsidian/90 backdrop-blur-lg border-r border-glass-border flex flex-col pt-24 pb-8 hidden md:flex">
        <div className="px-6 mb-8">
          <h2 className="font-headline-md text-neon-cyan uppercase tracking-wider">Operator</h2>
          <p className="font-label-sm text-label-sm text-outline opacity-60">v2.4.0-Stable</p>
        </div>
        <div className="flex-1 space-y-1">
          <a className="flex items-center gap-4 px-6 py-4 text-outline hover:text-on-surface-variant hover:bg-surface-variant/30 transition-colors active:translate-x-1" href="#">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-label-md text-label-md uppercase">Dashboard</span>
          </a>
          <a className="flex items-center gap-4 px-6 py-4 text-outline hover:text-on-surface-variant hover:bg-surface-variant/30 transition-colors active:translate-x-1" href="#">
            <span className="material-symbols-outlined">analytics</span>
            <span className="font-label-md text-label-md uppercase">Spectral</span>
          </a>
          <a className="flex items-center gap-4 px-6 py-4 text-outline hover:text-on-surface-variant hover:bg-surface-variant/30 transition-colors active:translate-x-1" href="#">
            <span className="material-symbols-outlined">mic_external_on</span>
            <span className="font-label-md text-label-md uppercase">Studio</span>
          </a>
          <a className="flex items-center gap-4 px-6 py-4 text-outline hover:text-on-surface-variant hover:bg-surface-variant/30 transition-colors active:translate-x-1" href="#">
            <span className="material-symbols-outlined">library_music</span>
            <span className="font-label-md text-label-md uppercase">Library</span>
          </a>
        </div>
        <div className="px-6 space-y-1 mt-auto">
          <a className="flex items-center gap-4 px-4 py-3 rounded-lg text-neon-cyan bg-primary-container/10 border-r-4 border-neon-cyan active:translate-x-1 transition-transform" href="#">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>settings</span>
            <span className="font-label-md text-label-md uppercase">Settings</span>
          </a>
        </div>
      </aside>

      <main className="md:ml-[280px] pt-32 pb-24 px-margin-mobile md:px-margin-desktop min-h-screen">
        <div className="max-w-[800px] mx-auto">
          <header className="mb-12">
            <h1 className="font-headline-xl text-headline-xl text-on-surface mb-2">Profile Settings</h1>
            <p className="text-on-surface-variant font-body-lg">Manage your cryptographic identity and resonance protocols.</p>
          </header>

          <div className="space-y-8">
            <section className="glass-card p-8 rounded-xl technical-border">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-sonic-lime">person</span>
                <h2 className="font-headline-lg text-headline-lg">Personal Information</h2>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="font-label-sm text-label-sm text-outline uppercase">Master Identity (Email)</label>
                  <input className="w-full bg-surface-container-lowest border border-outline-variant text-outline rounded-lg px-4 py-3 cursor-not-allowed font-label-md" disabled value={user?.email} type="email" />
                  <p className="text-[10px] text-outline italic">Master identity cannot be altered within this node.</p>
                </div>
                <form onSubmit={saveName} className="space-y-2">
                  <label className="font-label-sm text-label-sm text-outline uppercase">Resonance Label (Display Name)</label>
                  <div className="flex flex-col md:flex-row gap-3">
                    <input className="w-full bg-primary-container border border-outline-variant focus:border-sonic-lime text-on-surface rounded-lg px-4 py-3 transition-colors outline-none font-body-md" placeholder="Pulse Operator" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
                    <button type="submit" className="bg-sonic-lime text-deep-obsidian font-label-md px-8 py-3 rounded-lg uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shrink-0" disabled={savingName}>
                      {savingName ? 'Saving...' : 'Update Identification'}
                    </button>
                  </div>
                </form>
              </div>
            </section>

            <section className="glass-card p-8 rounded-xl technical-border">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-sonic-lime">key</span>
                <h2 className="font-headline-lg text-headline-lg">Change Password</h2>
              </div>
              <form onSubmit={savePassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="font-label-sm text-label-sm text-outline uppercase">Current Access Key</label>
                  <input type="password" className="w-full bg-primary-container border border-outline-variant focus:border-sonic-lime text-on-surface rounded-lg px-4 py-3 transition-colors outline-none font-body-md" value={passwords.current} onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="font-label-sm text-label-sm text-outline uppercase">New Access Key</label>
                    <input type="password" className="w-full bg-primary-container border border-outline-variant focus:border-sonic-lime text-on-surface rounded-lg px-4 py-3 transition-colors outline-none font-body-md" value={passwords.new} minLength={8} onChange={(e) => setPasswords((p) => ({ ...p, new: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-sm text-label-sm text-outline uppercase">Confirm Access Key</label>
                    <input type="password" className="w-full bg-primary-container border border-outline-variant focus:border-sonic-lime text-on-surface rounded-lg px-4 py-3 transition-colors outline-none font-body-md" value={passwords.confirm} minLength={8} onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))} required />
                  </div>
                </div>
                <div className="pt-4">
                  <button type="submit" className="border border-sonic-lime/30 text-sonic-lime hover:bg-sonic-lime/5 font-label-md px-8 py-3 rounded-lg uppercase tracking-wider active:scale-95 transition-all" disabled={savingPw}>
                    {savingPw ? 'Updating...' : 'Re-encrypt Account'}
                  </button>
                </div>
              </form>
            </section>

            <section className="glass-card p-8 rounded-xl technical-border overflow-hidden relative">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-sonic-lime">verified</span>
                <h2 className="font-headline-lg text-headline-lg">Subscription Protocol</h2>
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-surface-container-low rounded-lg border border-glass-border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-label-sm text-label-sm text-outline uppercase">Active Plan:</span>
                    <span className="bg-sonic-lime text-deep-obsidian font-label-md px-3 py-1 rounded text-[10px] uppercase font-bold">{user?.plan ? `${user.plan} Resonance` : 'Free Resonance'}</span>
                  </div>
                  <p className="text-on-surface font-headline-md">{user?.plan === 'pro' ? '$29.99 / Cycle' : user?.plan === 'enterprise' ? '$99.99 / Cycle' : '$0 / Cycle'}</p>
                  <p className="text-on-surface-variant font-label-sm">Manage billing, invoices, and plan changes</p>
                </div>
                <div className="flex flex-col gap-3">
                  <button onClick={openBillingPortal} className="bg-secondary text-on-secondary font-label-md px-6 py-2.5 rounded-lg uppercase tracking-wider hover:bg-on-surface active:scale-95 transition-all text-center">
                    Billing Portal
                  </button>
                  <button className="text-error font-label-sm uppercase tracking-widest text-center hover:underline" type="button">
                    Terminate Protocol
                  </button>
                </div>
              </div>
              <div className="absolute top-0 right-0 p-4 pointer-events-none opacity-20">
                <div className="flex gap-1">
                  <div className="w-1 h-8 bg-sonic-lime"></div>
                  <div className="w-1 h-6 bg-sonic-lime"></div>
                  <div className="w-1 h-10 bg-sonic-lime"></div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="md:ml-[280px] bg-surface-container-lowest border-t border-glass-border w-full py-12">
        <div className="max-w-container-max mx-auto px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-2">
            <span className="font-headline-md text-on-surface uppercase">Beatzy AI</span>
            <p className="font-code-sm text-code-sm text-outline">© 2024 Beatzy AI. Protocols Reserved.</p>
          </div>
          <nav className="flex flex-wrap justify-center gap-8">
            <a className="font-code-sm text-code-sm text-outline hover:text-neon-cyan transition-colors" href="#">Architecture</a>
            <a className="font-code-sm text-code-sm text-outline hover:text-neon-cyan transition-colors" href="#">Privacy</a>
            <a className="font-code-sm text-code-sm text-outline hover:text-neon-cyan transition-colors" href="#">API Documentation</a>
            <a className="font-code-sm text-code-sm text-outline hover:text-neon-cyan transition-colors" href="#">Terms of Resonance</a>
          </nav>
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-sonic-lime animate-pulse"></div>
            <span className="font-label-sm text-label-sm text-sonic-lime uppercase tracking-widest">Mainframe Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
