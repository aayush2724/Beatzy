import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { register, googleLogin } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import AuthShell from '../components/AuthShell';
import { UserPlus, Mail, Lock, User, Chrome, ArrowLeft, Music } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await register(formData);
      setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
      toast.success('Account created! Welcome to Beatzy.');
      navigate('/upload');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="w-full max-w-md mx-auto space-y-10 animate-page-entrance">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/5 text-[#FF6B35] font-mono text-[11px] uppercase tracking-[0.15em] mb-4">
            <Music className="w-3 h-3" /> Get Started
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-black text-[#FFFFFF] tracking-tight">Create your <span className="text-[#FF6B35] text-glow-orange">account</span></h1>
          <p className="text-on-surface-variant text-sm">Start analyzing music with AI-powered intelligence</p>
        </div>

        {/* Auth Form */}
        <div className="glass-card p-8 md:p-10 border border-[#0D0808]/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div className="space-y-2">
                    <label className="text-sm text-[#FFFFFF]/60 font-medium ml-1">Full Name</label>
                    <div className="relative group/input">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FFFFFF]/20 group-focus-within/input:text-[#FF6B35] transition-colors" />
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full h-14 bg-white/[0.03] border border-[#0D0808]/10 rounded-2xl pl-12 pr-4 text-[#FFFFFF] placeholder:text-[#FFFFFF]/20 focus:outline-none focus:border-[#FF6B35]/40 transition-all text-sm"
                            placeholder="Your name"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm text-[#FFFFFF]/60 font-medium ml-1">Email</label>
                    <div className="relative group/input">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FFFFFF]/20 group-focus-within/input:text-[#FF6B35] transition-colors" />
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full h-14 bg-white/[0.03] border border-[#0D0808]/10 rounded-2xl pl-12 pr-4 text-[#FFFFFF] placeholder:text-[#FFFFFF]/20 focus:outline-none focus:border-[#FF6B35]/40 transition-all text-sm"
                            placeholder="you@example.com"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm text-[#FFFFFF]/60 font-medium ml-1">Password</label>
                    <div className="relative group/input">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FFFFFF]/20 group-focus-within/input:text-[#FF6B35] transition-colors" />
                        <input
                            type="password"
                            required
                            minLength={8}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full h-14 bg-white/[0.03] border border-[#0D0808]/10 rounded-2xl pl-12 pr-4 text-[#FFFFFF] placeholder:text-[#FFFFFF]/20 focus:outline-none focus:border-[#FF6B35]/40 transition-all text-sm"
                            placeholder="Minimum 8 characters"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 rounded-2xl bg-[#FF6B35] text-black font-black text-sm uppercase tracking-wider shadow-[0_0_40px_rgba(255,107,53,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                        <>
                            <UserPlus className="w-4 h-4" /> Create Account
                        </>
                    )}
                </button>
            </form>

            <div className="relative z-10 mt-8 space-y-6">
                <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="text-xs text-[#FFFFFF]/30">or continue with</span>
                    <div className="h-px flex-1 bg-white/5" />
                </div>

                <button
                    onClick={googleLogin}
                    type="button"
                    className="w-full h-14 rounded-2xl bg-white/[0.03] border border-[#0D0808]/10 text-[#FFFFFF] text-sm font-medium flex items-center justify-center gap-3 hover:bg-white/[0.06] hover:border-[#0D0808]/20 transition-all"
                >
                    <Chrome className="w-4 h-4 text-[#FF6B35]" /> Continue with Google
                </button>
            </div>
        </div>

        {/* Footer Links */}
        <div className="text-center space-y-4">
            <p className="text-xs text-[#FFFFFF]/30 leading-relaxed">
                By creating an account, you agree to our{' '}
                <Link to="/terms" className="text-[#FFFFFF] hover:text-[#FF6B35] transition-colors underline underline-offset-2">Terms of Service</Link> and{' '}
                <Link to="/privacy" className="text-[#FFFFFF] hover:text-[#FF6B35] transition-colors underline underline-offset-2">Privacy Policy</Link>.
            </p>
            <div className="flex justify-center items-center gap-2">
                <span className="text-sm text-[#FFFFFF]/40">Already have an account?</span>
                <Link to="/login" className="group flex items-center gap-1.5 text-sm font-bold text-[#FF6B35] hover:text-[#FFFFFF] transition-colors">
                    Sign in <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                </Link>
            </div>
        </div>
      </div>
    </AuthShell>
  );
}
