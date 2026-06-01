import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { register, googleLogin } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const cardRef = useRef(null);

  useEffect(() => {
    function handleMouseMove(e) {
      const xAxis = (window.innerWidth / 2 - e.pageX) / 50;
      const yAxis = (window.innerHeight / 2 - e.pageY) / 50;

      if (cardRef.current) {
        cardRef.current.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
      }
    }

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const { data } = await register(form);
      setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
      toast.success('Account created!');
      localStorage.setItem('rememberMe', 'true');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-margin-mobile md:p-margin-desktop bg-deep-obsidian overflow-hidden text-on-surface">
      <div className="obsidian-bg" aria-hidden="true" />
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-tertiary/5 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />
      <div className="fixed bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-sonic-lime/5 rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />

      <main className="relative z-10 w-full max-w-[480px]">
        <div
          ref={cardRef}
          className="glass-card rounded-xl p-8 md:p-12 transition-all duration-500 hover:shadow-[0_0_40px_rgba(215,255,90,0.05)]"
          style={{ transformStyle: 'preserve-3d', transition: 'transform 0.15s ease-out' }}
        >
          <div className="flex flex-col items-center mb-10">
            <div className="w-14 h-14 bg-sonic-lime rounded-xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(215,255,90,0.3)]">
              <span
                className="material-symbols-outlined text-deep-obsidian !text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                music_note
              </span>
            </div>
            <span className="font-headline-lg text-headline-lg tracking-tighter text-white">Beatzy</span>
          </div>

          <div className="text-center mb-10">
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Create your account</h1>
            <p className="font-body-md text-body-md text-outline">100 free analyses per month</p>
          </div>

          <div className="space-y-6">
            <button
              onClick={googleLogin}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-surface-container-high rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-variant transition-all border border-glass-border"
              type="button"
            >
              <svg height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              Sign up with Google
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-glass-border"></div>
              <span className="flex-shrink mx-4 font-label-sm text-label-sm text-outline uppercase tracking-widest">or</span>
              <div className="flex-grow border-t border-glass-border"></div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block font-label-sm text-label-sm text-outline uppercase tracking-widest mb-2 px-1">Full name</label>
                <input
                  className="w-full bg-deep-obsidian/50 border border-outline-variant rounded-lg py-3.5 px-4 text-white focus:ring-0 sonic-lime-glow transition-all outline-none font-body-md text-body-md"
                  placeholder="Your name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                  required
                  minLength={2}
                />
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-outline uppercase tracking-widest mb-2 px-1">Email</label>
                <input
                  className="w-full bg-deep-obsidian/50 border border-outline-variant rounded-lg py-3.5 px-4 text-white focus:ring-0 sonic-lime-glow transition-all outline-none font-body-md text-body-md"
                  placeholder="you@example.com"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-outline uppercase tracking-widest mb-2 px-1">Password</label>
                <input
                  className="w-full bg-deep-obsidian/50 border border-outline-variant rounded-lg py-3.5 px-4 text-white focus:ring-0 sonic-lime-glow transition-all outline-none font-body-md text-body-md"
                  placeholder="Min. 8 characters"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
                  required
                  minLength={8}
                />
              </div>
              <button
                className="w-full py-4 bg-sonic-lime text-deep-obsidian font-headline-lg-mobile text-headline-lg-mobile font-bold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all mt-6 shadow-[0_4px_14px_rgba(215,255,90,0.2)] disabled:opacity-60"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          </div>

          <p className="mt-8 text-center font-body-md text-body-md text-outline">
            Already have an account?{' '}
            <Link className="text-sonic-lime font-bold hover:underline underline-offset-4 ml-1" to="/login">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-12 flex justify-center items-center gap-6 opacity-40">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-sonic-lime animate-pulse"></span>
            <span className="font-label-sm text-label-sm uppercase tracking-tighter">Engine Alpha-9 Online</span>
          </div>
          <div className="w-px h-3 bg-outline/30"></div>
          <div className="font-label-sm text-label-sm uppercase tracking-tighter">SSL Encrypted v2.4</div>
        </div>
      </main>
    </div>
  );
}
