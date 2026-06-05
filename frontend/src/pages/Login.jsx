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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#CCFF00]/20 bg-[#CCFF00]/5 text-[#CCFF00] font-mono text-[9px] uppercase tracking-[0.2em] mb-4">
            <Cpu className="w-3 h-3" /> Secure Access Node
          </div>
          <h1 className="text-5xl font-display font-black text-white uppercase tracking-tighter leading-none">Initialize <span className="text-[#CCFF00] text-glow-lime">Session</span></h1>
          <p className="text-on-surface-variant font-mono text-[10px] uppercase tracking-[0.2em]">Enter credentials to establish neural uplink</p>
        </div>

        {/* Auth Form */}
        <div className="glass-card p-10 border border-white/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#CCFF00]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div className="space-y-2">
                    <label className="font-mono text-[10px] text-white/30 uppercase tracking-[0.3em] ml-1">Operator Identifier</label>
                    <div className="relative group/input">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 group-focus-within/input:text-[#CCFF00] transition-colors" />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-[#CCFF00]/40 transition-all"
                            placeholder="operator@beatzy.io"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="font-mono text-[10px] text-white/30 uppercase tracking-[0.3em] ml-1">Access Key</label>
                    <div className="relative group/input">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 group-focus-within/input:text-[#CCFF00] transition-colors" />
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-[#CCFF00]/40 transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-16 rounded-2xl bg-[#CCFF00] text-black font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(204,255,0,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
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
                    <span className="font-mono text-[9px] text-white/20 uppercase tracking-[0.3em]">Or use 3rd party protocol</span>
                    <div className="h-px flex-1 bg-white/5" />
                </div>

                <button
                    onClick={googleLogin}
                    type="button"
                    className="w-full h-14 rounded-2xl bg-white/[0.03] border border-white/10 text-white font-mono text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/[0.06] hover:border-white/20 transition-all"
                >
                    <Chrome className="w-4 h-4 text-[#28E0D4]" /> Google Auth Uplink
                </button>
            </div>
        </div>

        {/* Footer Links */}
        <div className="text-center space-y-6">
            <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest">
                Unauthorized access is strictly monitored.
            </p>
            <div className="flex justify-center items-center gap-4">
                <span className="text-[11px] text-white/30 uppercase tracking-widest">New Operator?</span>
                <Link to="/register" className="group flex items-center gap-2 text-[11px] font-black text-[#CCFF00] uppercase tracking-widest hover:text-white transition-colors">
                    Initialize Account <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>

        {/* Technical Metadata Decoration */}
        <div className="flex justify-between items-center pt-10 font-mono text-[7px] text-white/10 uppercase tracking-[0.4em] select-none">
            <div className="flex items-center gap-3">
                <div className="w-1 h-1 rounded-full bg-[#CCFF00] animate-pulse" />
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
