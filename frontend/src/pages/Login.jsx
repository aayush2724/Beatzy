import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { login, googleLogin } from '../api/auth';
import { useAuthStore } from '../store/authStore';

const SG = { fontFamily: "'Space Grotesk', 'Hanken Grotesk', sans-serif" };

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const bgRef = useRef(null);

  useEffect(() => {
    function onMove(e) {
      const x = e.clientX - window.innerWidth / 2;
      const y = e.clientY - window.innerHeight / 2;
      if (cardRef.current) cardRef.current.style.transform = `translate(${x * 0.008}px, ${y * 0.008}px)`;
      if (bgRef.current) bgRef.current.style.transform = `scale(1.06) translate(${x * -0.004}px, ${y * -0.004}px)`;
    }
    document.addEventListener('mousemove', onMove);
    return () => document.removeEventListener('mousemove', onMove);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await login(form);
      setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
      toast.success('Access Granted!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden" style={{ background: '#050505' }}>
      {/* Scanline */}
      <div className="fixed inset-0 pointer-events-none z-50" style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(212,255,63,0.018) 50%)', backgroundSize: '100% 4px' }} />

      {/* Background */}
      <div ref={bgRef} className="absolute inset-0 z-0 transition-transform duration-100" style={{ backgroundImage: 'url(https://lh3.googleusercontent.com/aida/ADBb0uh-0FrOXxKO8zCLpEu9COZ0NjPhmB0M3CYTC6MslAizqy6oxpikKSbjwlpDXof1V0WMkPJ7cyidwHydp6SqsjFYeVEcmD12VIQik4t_eplJ4U5iYbjT0Rn5DNBDAA6ti-ldnBv36jMOHmtXuadMmlIS4uVbzY8bmdTU2FNk8GjctXeogZL1KXNqVRDSV-SEsugB75GEfoAj9Kp9n68EjvxslX-eaUZgS5bkumai5w1EuID5XvbiDZp5kg)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.12 }} />
      <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(to bottom, rgba(5,5,5,0.9), rgba(5,5,5,0.5), #050505)' }} />

      {/* Orb glows */}
      <div className="absolute pointer-events-none z-0 rounded-full" style={{ width: 600, height: 600, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="absolute pointer-events-none z-0 rounded-full" style={{ width: 300, height: 300, top: '20%', right: '15%', background: 'radial-gradient(circle, rgba(215,255,90,0.07) 0%, transparent 70%)', filter: 'blur(50px)' }} />

      <main className="relative z-10 w-full max-w-[420px] px-4">
        <div ref={cardRef} className="rounded-2xl p-8 space-y-7 transition-transform duration-100" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 32px 64px rgba(0,0,0,0.6)' }}>

          {/* Header */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-7 h-7 bg-sonic-lime/10 border border-sonic-lime/40 rounded flex items-center justify-center" style={{ boxShadow: '0 0 14px rgba(215,255,90,0.2)' }}>
                <span className="material-symbols-outlined text-sonic-lime text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              </div>
              <span className="font-bold text-lg text-sonic-lime" style={SG}>BEATZY</span>
            </div>
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">Secure Access Portal</p>
          </div>

          {/* Google */}
          <button onClick={googleLogin} className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl transition-all hover:border-white/20 active:scale-[0.98]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg fill="none" height="18" viewBox="0 0 24 24" width="18"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            <span className="text-sm text-white/70 font-medium">Continue with Google</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest">or</span>
            <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-mono text-[9px] text-white/35 uppercase tracking-[0.2em] block mb-2">Email Protocol</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 text-base">alternate_email</span>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="operator@beatzy.ai" required className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 outline-none transition-all" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} onFocus={e => e.target.style.borderColor = 'rgba(215,255,90,0.4)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="font-mono text-[9px] text-white/35 uppercase tracking-[0.2em]">Encryption Key</label>
                <Link to="/login" className="font-mono text-[9px] text-white/25 hover:text-sonic-lime transition-colors">Forgot Key?</Link>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 text-base">lock</span>
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••••••" required className="w-full pl-10 pr-12 py-3 rounded-xl text-sm text-white placeholder:text-white/20 outline-none transition-all" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} onFocus={e => e.target.style.borderColor = 'rgba(215,255,90,0.4)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                <button type="button" onClick={() => setShowPassword(p => !p)} className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 text-base transition-colors cursor-pointer">{showPassword ? 'visibility_off' : 'visibility'}</button>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <input type="checkbox" id="remember" className="w-3.5 h-3.5 rounded cursor-pointer" style={{ accentColor: '#D7FF5A' }} />
              <label htmlFor="remember" className="font-mono text-[9px] text-white/30 uppercase tracking-wider cursor-pointer">Stay Authenticated</label>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-[0.15em] transition-all active:scale-[0.98] disabled:opacity-50" style={{ ...SG, background: '#D7FF5A', color: '#050505', boxShadow: loading ? 'none' : '0 0 30px rgba(215,255,90,0.25)' }}>
              {loading ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Synchronizing...</span> : 'Initialize Session'}
            </button>
          </form>

          <p className="text-center text-sm text-white/30">
            New frequency?{' '}
            <Link to="/register" className="text-sonic-lime hover:underline underline-offset-4 font-medium">Create one free</Link>
          </p>
        </div>

        <div className="mt-6 flex justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sonic-lime animate-pulse" />
            <span className="font-mono text-[8px] uppercase tracking-widest text-white/20">System Core: Stable</span>
          </div>
          <span className="font-mono text-[8px] uppercase tracking-widest text-white/20">Port 443 // AES-256</span>
        </div>
      </main>
    </div>
  );
}
