import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { login, googleLogin } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import AuthShell from '../components/AuthShell';
import { Mail, Lock, LogIn, Chrome, ArrowRight, Music } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await login({ email, password });
      setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
      toast.success('Welcome back!');
      navigate('/upload');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="w-full max-w-md mx-auto space-y-10 animate-page-entrance">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand/20 bg-brand/5 text-brand font-mono text-[11px] uppercase tracking-[0.15em] mb-4">
            <Music className="w-3 h-3" /> Welcome Back
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-black text-ink tracking-tight">Sign in to <span className="text-brand text-glow-orange">Beatzy</span></h1>
          <p className="text-on-surface-variant text-sm">Access your music intelligence dashboard</p>
        </div>

        {/* Auth Form */}
        <div className="glass-card p-8 md:p-10 border border-line relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div className="space-y-2">
                    <label className="text-sm text-ink/60 font-medium ml-1">Email</label>
                    <div className="relative group/input">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20 group-focus-within/input:text-brand transition-colors" />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-14 bg-ink/[0.03] border border-line rounded-2xl pl-12 pr-4 text-ink placeholder:text-ink/20 focus:outline-none focus:border-brand/40 transition-all text-sm"
                            placeholder="you@example.com"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm text-ink/60 font-medium ml-1">Password</label>
                    <div className="relative group/input">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20 group-focus-within/input:text-brand transition-colors" />
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-14 bg-ink/[0.03] border border-line rounded-2xl pl-12 pr-4 text-ink placeholder:text-ink/20 focus:outline-none focus:border-brand/40 transition-all text-sm"
                            placeholder="Enter your password"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 rounded-2xl bg-brand text-brand-ink font-black text-sm uppercase tracking-wider shadow-[0_0_40px_rgba(255,107,53,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-canvas/20 border-t-black rounded-full animate-spin" />
                    ) : (
                        <>
                            <LogIn className="w-4 h-4" /> Sign In
                        </>
                    )}
                </button>
            </form>

            <div className="relative z-10 mt-8 space-y-6">
                <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-ink/5" />
                    <span className="text-xs text-ink/30">or continue with</span>
                    <div className="h-px flex-1 bg-ink/5" />
                </div>

                <button
                    onClick={googleLogin}
                    type="button"
                    className="w-full h-14 rounded-2xl bg-ink/[0.03] border border-line text-ink text-sm font-medium flex items-center justify-center gap-3 hover:bg-ink/[0.06] hover:border-line transition-all"
                >
                    <Chrome className="w-4 h-4 text-brand" /> Continue with Google
                </button>
            </div>
        </div>

        {/* Footer Links */}
        <div className="text-center space-y-4">
            <div className="flex justify-center items-center gap-2">
                <span className="text-sm text-ink/40">Don't have an account?</span>
                <Link to="/register" className="group flex items-center gap-1.5 text-sm font-bold text-brand hover:text-ink transition-colors">
                    Sign up <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
            </div>
        </div>
      </div>
    </AuthShell>
  );
}
