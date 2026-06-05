import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { login, googleLogin } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import AuthShell from '../components/AuthShell';
import { Mail, Lock, LogIn, Chrome, ArrowRight, Activity, Cpu } from 'lucide-react';

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
      setAuth(data.data.user, data.data.token, data.data.refreshToken);
      toast.success('Uplink established. Welcome back, operator.');
      navigate('/upload');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="w-full max-w-md mx-auto space-y-10 animate-page-entrance">
        {/* Technical Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/5 text-[#FF6B35] font-mono text-[9px] uppercase tracking-[0.2em] mb-4">
            <Cpu className="w-3 h-3" /> Secure Access Node
          </div>
          <h1 className="text-5xl font-display font-black text-[#FFFFFF] uppercase tracking-tighter leading-none">Initialize <span className="text-[#FF6B35] text-glow-orange">Session</span></h1>
          <p className="text-on-surface-variant font-mono text-[10px] uppercase tracking-[0.2em]">Enter credentials to establish neural uplink</p>
        </div>

        {/* Auth Form */}
        <div className="glass-card p-10 border border-[#0D0808]/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div className="space-y-2">
                    <label className="font-mono text-[10px] text-[#FFFFFF]/30 uppercase tracking-[0.3em] ml-1">Operator Identifier</label>
                    <div className="relative group/input">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FFFFFF]/10 group-focus-within/input:text-[#FF6B35] transition-colors" />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-14 bg-white/[0.03] border border-[#0D0808]/10 rounded-2xl pl-12 pr-4 text-[#FFFFFF] placeholder:text-[#FFFFFF]/20 focus:outline-none focus:border-[#FF6B35]/40 transition-all"
                            placeholder="operator@beatzy.io"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="font-mono text-[10px] text-[#FFFFFF]/30 uppercase tracking-[0.3em] ml-1">Access Key</label>
                    <div className="relative group/input">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FFFFFF]/10 group-focus-within/input:text-[#FF6B35] transition-colors" />
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-14 bg-white/[0.03] border border-[#0D0808]/10 rounded-2xl pl-12 pr-4 text-[#FFFFFF] placeholder:text-[#FFFFFF]/20 focus:outline-none focus:border-[#FF6B35]/40 transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-16 rounded-2xl bg-[#FF6B35] text-black font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(255,107,53,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                        <>
                            <LogIn className="w-4 h-4" /> Establish Uplink
                        </>
                    )}
                </button>
            </form>

            <div className="relative z-10 mt-10 space-y-6">
                <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="font-mono text-[9px] text-[#FFFFFF]/20 uppercase tracking-[0.3em]">Or use 3rd party protocol</span>
                    <div className="h-px flex-1 bg-white/5" />
                </div>

                <button
                    onClick={googleLogin}
                    type="button"
                    className="w-full h-14 rounded-2xl bg-white/[0.03] border border-[#0D0808]/10 text-[#FFFFFF] font-mono text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/[0.06] hover:border-[#0D0808]/20 transition-all"
                >
                    <Chrome className="w-4 h-4 text-[#FF6B35]" /> Google Auth Uplink
                </button>
            </div>
        </div>

        {/* Footer Links */}
        <div className="text-center space-y-6">
            <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest">
                Unauthorized access is strictly monitored.
            </p>
            <div className="flex justify-center items-center gap-4">
                <span className="text-[11px] text-[#FFFFFF]/30 uppercase tracking-widest">New Operator?</span>
                <Link to="/register" className="group flex items-center gap-2 text-[11px] font-black text-[#FF6B35] uppercase tracking-widest hover:text-[#FFFFFF] transition-colors">
                    Initialize Account <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>

        {/* Technical Metadata Decoration */}
        <div className="flex justify-between items-center pt-10 font-mono text-[7px] text-[#FFFFFF]/10 uppercase tracking-[0.4em] select-none">
            <div className="flex items-center gap-3">
                <div className="w-1 h-1 rounded-full bg-[#FF6B35] animate-pulse" />
                SSL: ACTIVE
            </div>
            <div className="flex items-center gap-2">
                <Activity className="w-2 h-2" />
                Login V4.2
            </div>
        </div>
      </div>
    </AuthShell>
  );
}
