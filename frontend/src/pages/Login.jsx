import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { login, googleLogin } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const bgRef = useRef(null);

  useEffect(() => {
    // Mouse parallax effect
    function handleMouseMove(e) {
      const { clientX, clientY } = e;
      const x = clientX - window.innerWidth / 2;
      const y = clientY - window.innerHeight / 2;
      
      if (cardRef.current) {
        cardRef.current.style.transform = `translate(${x * 0.01}px, ${y * 0.01}px)`;
      }
      if (bgRef.current) {
        bgRef.current.style.transform = `scale(1.05) translate(${x * -0.005}px, ${y * -0.005}px)`;
      }
    }
    
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const { data } = await login(form);
      setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
      toast.success('Access Granted!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      await googleLogin();
    } catch (err) {
      toast.error('Google login failed');
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center min-h-screen bg-deep-ink overflow-hidden">
      {/* Cinematic Background */}
      <div
        ref={bgRef}
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(https://lh3.googleusercontent.com/aida/ADBb0uh-0FrOXxKO8zCLpEu9COZ0NjPhmB0M3CYTC6MslAizqy6oxpikKSbjwlpDXof1V0WMkPJ7cyidwHydp6SqsjFYeVEcmD12VIQik4t_eplJ4U5iYbjT0Rn5DNBDAA6ti-ldnBv36jMOHmtXuadMmlIS4uVbzY8bmdTU2FNk8GjctXeogZL1KXNqVRDSV-SEsugB75GEfoAj9Kp9n68EjvxslX-eaUZgS5bkumai5w1EuID5XvbiDZp5kg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.6)',
          transition: 'transform 0.1s ease-out',
        }}
      />

      {/* Scanline Effect */}
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        .scanline {
          animation: scan 8s linear infinite;
        }
      `}</style>
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="w-full h-[100px] scanline"
          style={{
            background: 'linear-gradient(to bottom, rgba(215,255,90,0), rgba(215,255,90,0.03), rgba(215,255,90,0))',
          }}
        />
      </div>

      {/* Login Container */}
      <main className="relative z-10 w-full max-w-[440px] px-4 md:px-0">
        <div
          ref={cardRef}
          className="rounded-xl p-10 space-y-8 border border-white/5"
          style={{
            background: 'rgba(14,14,14,0.45)',
            backdropFilter: 'blur(40px) saturate(180%)',
            transition: 'transform 0.1s ease-out',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          }}
        >
          {/* Branding Header */}
          <div className="text-center space-y-2">
            <h1 className="font-headline-xl text-headline-xl tracking-tighter text-on-surface">
              Beatzy <span className="text-sonic-lime">AI</span>
            </h1>
            <p className="font-label-sm text-label-sm uppercase tracking-widest text-outline">
              Secure Access Portal
            </p>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-surface-container-highest border border-white/10 hover:bg-surface-bright transition-all active:scale-95 rounded-lg"
          >
            <svg fill="none" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-5.38z" fill="#EA4335"></path>
            </svg>
            <span className="font-body-md text-body-md text-on-surface font-medium">Continue with Google</span>
          </button>

          {/* Separator */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-outline/20"></div>
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-widest">or</span>
            <div className="h-px flex-1 bg-outline/20"></div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <label className="font-label-sm text-label-sm text-on-surface-variant block uppercase tracking-wider">
                  Email Protocol
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                    alternate_email
                  </span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="operator@beatzy.ai"
                    className="w-full bg-deep-ink/40 border border-white/10 rounded-lg py-4 pl-12 pr-4 text-on-surface font-body-md placeholder:text-outline/40 focus:outline-none focus:ring-2 focus:ring-sonic-lime/50 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-label-sm text-label-sm text-on-surface-variant block uppercase tracking-wider">
                    Encryption Key
                  </label>
                  <Link to="/login" className="font-label-sm text-label-sm text-outline hover:text-sonic-lime transition-colors">
                    Forgot Key?
                  </Link>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                    lock_open
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full bg-deep-ink/40 border border-white/10 rounded-lg py-4 pl-12 pr-12 text-on-surface font-body-md placeholder:text-outline/40 focus:outline-none focus:ring-2 focus:ring-sonic-lime/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface cursor-pointer"
                  >
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </button>
                </div>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 bg-deep-ink border border-outline/30 rounded text-sonic-lime cursor-pointer"
              />
              <label htmlFor="remember" className="font-body-md text-label-sm text-on-surface-variant cursor-pointer">
                Stay Authenticated
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sonic-lime text-deep-ink font-bold font-headline-lg text-body-lg py-5 px-6 rounded-lg transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 shadow-lg shadow-sonic-lime/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  SYNCHRONIZING...
                </span>
              ) : (
                'INITIALIZE SESSION'
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="text-center font-body-md text-body-md text-on-surface-variant">
            New frequency?{' '}
            <Link to="/register" className="text-sonic-lime font-medium hover:underline decoration-2 underline-offset-4">
              Create one free
            </Link>
          </p>
        </div>

        {/* System Status Bar */}
        <div className="mt-8 flex justify-between px-2 opacity-50">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-sonic-lime animate-pulse"></span>
            <span className="font-label-sm text-[10px] uppercase tracking-tighter text-outline">System Core: Stable</span>
          </div>
          <div className="font-label-sm text-[10px] uppercase tracking-tighter text-outline">
            Port 443 // AES-256
          </div>
        </div>
      </main>
    </div>
  );
}
