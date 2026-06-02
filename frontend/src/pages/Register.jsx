import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { register, googleLogin } from '../api/auth';
import { useAuthStore } from '../store/authStore';

const SG = { fontFamily: "'Space Grotesk', 'Hanken Grotesk', sans-serif" };

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const cardRef = useRef(null);

  useEffect(() => {
    function onMove(e) {
      const x = e.clientX - window.innerWidth / 2;
      const y = e.clientY - window.innerHeight / 2;
      if (cardRef.current) cardRef.current.style.transform = `translate(${x * 0.007}px, ${y * 0.007}px)`;
    }
    document.addEventListener('mousemove', onMove);
    return () => document.removeEventListener('mousemove', onMove);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const { data } = await register(form);
      setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden" style={{ background: '#050505' }}>
      {/* Scanline */}
      <div className="fixed inset-0 pointer-events-none z-50" style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(212,255,63,0.018) 50%)', backgroundSize: '100% 4px' }} />

      {/* Background image */}
      <div className="absolute inset-0 z-0" style={{ backgroundImage: 'url(https://lh3.googleusercontent.com/aida/ADBb0uh-0FrOXxKO8zCLpEu9COZ0NjPhmB0M3CYTC6MslAizqy6oxpikKSbjwlpDXof1V0WMkPJ7cyidwHydp6SqsjFYeVEcmD12VIQik4t_eplJ4U5iYbjT0Rn5DNBDAA6ti-ldnBv36jMOHmtXuadMmlIS4uVbzY8bmdTU2FNk8GjctXeogZL1KXNqVRDSV-SEsugB75GEfoAj9Kp9n68EjvxslX-eaUZgS5bkumai5w1EuID5XvbiDZp5kg)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.1 }} />
      <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(135deg, rgba(5,5,5,0.95) 0%, rgba(5,5,5,0.7) 50%, #050505 100%)' }} />

      {/* Orb glows */}
      <div className="absolute pointer-events-none z-0 rounded-full" style={{ width: 500, height: 500, bottom: '-10%', left: '-10%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="absolute pointer-events-none z-0 rounded-full" style={{ width: 300, height: 300, top: '10%', right: '10%', background: 'radial-gradient(circle, rgba(215,255,90,0.07) 0%, transparent 70%)', filter: 'blur(50px)' }} />

      <main className="relative z-10 w-full max-w-[440px] px-4 max-h-screen overflow-y-auto py-8">
        <div ref={cardRef} className="rounded-2xl p-8 space-y-6 transition-transform duration-100" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 32px 64px rgba(0,0,0,0.6)' }}>

          {/* Header */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-7 h-7 bg-sonic-lime/10 border border-sonic-lime/40 rounded flex items-center justify-center" style={{ boxShadow: '0 0 14px rgba(215,255,90,0.2)' }}>
                <span className="material-symbols-outlined text-sonic-lime text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              </div>
              <span className="font-bold text-lg text-sonic-lime" style={SG}>BEATZY</span>
            </div>
            <h1 className="text-xl font-bold text-white" style={SG}>Create your account</h1>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/25">100 free analyses / month</p>
          </div>

          {/* Google */}
          <button onClick={googleLogin} type="button" className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl transition-all hover:border-white/20 active:scale-[0.98]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg height="18" viewBox="0 0 24 24" width="18"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            <span className="text-sm text-white/70 font-medium">Sign up with Google</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest">or</span>
            <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Your name', icon: 'person' },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'you@example.com', icon: 'alternate_email' },
              { label: 'Password', key: 'password', type: 'password', placeholder: 'Min. 8 characters', icon: 'lock' },
            ].map(({ label, key, type, placeholder, icon }) => (
              <div key={key}>
                <label className="font-mono text-[9px] text-white/35 uppercase tracking-[0.2em] block mb-2">{label}</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 text-base">{icon}</span>
                  <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} required minLength={key === 'password' ? 8 : key === 'name' ? 2 : undefined} className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 outline-none transition-all" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} onFocus={e => e.target.style.borderColor = 'rgba(215,255,90,0.4)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                </div>
              </div>
            ))}

            <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-[0.15em] transition-all active:scale-[0.98] disabled:opacity-50 mt-2" style={{ ...SG, background: '#D7FF5A', color: '#050505', boxShadow: '0 0 30px rgba(215,255,90,0.2)' }}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-white/30">
            Already have an account?{' '}
            <Link to="/login" className="text-sonic-lime font-medium hover:underline underline-offset-4">Sign in</Link>
          </p>
        </div>

        <div className="mt-5 flex justify-center items-center gap-4 opacity-40">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sonic-lime animate-pulse" />
            <span className="font-mono text-[8px] uppercase tracking-widest text-white/50">Engine Alpha-9 Online</span>
          </div>
          <div className="w-px h-3 bg-white/20" />
          <span className="font-mono text-[8px] uppercase tracking-widest text-white/50">SSL Encrypted v2.4</span>
        </div>
      </main>
    </div>
  );
}
