import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { register, googleLogin } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import AuthShell from '../components/AuthShell';
import { UserPlus, Mail, Lock, User, Chrome, ArrowLeft, Activity, Cpu } from 'lucide-react';

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
      setAuth(data.data.user, data.data.token, data.data.refreshToken);
      toast.success('Account initialized. Welcome to the neural core.');
      navigate('/upload');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Initialization failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="w-full max-w-md mx-auto space-y-10 animate-page-entrance">
        {/* Technical Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#C41E3A]/20 bg-[#C41E3A]/5 text-[#C41E3A] font-mono text-[9px] uppercase tracking-[0.2em] mb-4">
            <Cpu className="w-3 h-3" /> New Node Provisioning
          </div>
          <h1 className="text-5xl font-display font-black text-[#F5EFE7] uppercase tracking-tighter leading-none">Register <span className="text-[#C41E3A] text-glow-rust">Operator</span></h1>
          <p className="text-on-surface-variant font-mono text-[10px] uppercase tracking-[0.2em]">Initialize your identifier in the neural registry</p>
        </div>

        {/* Auth Form */}
        <div className="glass-card p-10 border border-[#1A1410]/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#C41E3A]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div className="space-y-2">
                    <label className="font-mono text-[10px] text-[#F5EFE7]/30 uppercase tracking-[0.3em] ml-1">Interface Label</label>
                    <div className="relative group/input">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F5EFE7]/10 group-focus-within/input:text-[#C41E3A] transition-colors" />
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full h-14 bg-white/[0.03] border border-[#1A1410]/10 rounded-2xl pl-12 pr-4 text-[#F5EFE7] placeholder:text-[#F5EFE7]/20 focus:outline-none focus:border-[#C41E3A]/40 transition-all"
                            placeholder="Operator Name"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="font-mono text-[10px] text-[#F5EFE7]/30 uppercase tracking-[0.3em] ml-1">Spectral Email</label>
                    <div className="relative group/input">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F5EFE7]/10 group-focus-within/input:text-[#C41E3A] transition-colors" />
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full h-14 bg-white/[0.03] border border-[#1A1410]/10 rounded-2xl pl-12 pr-4 text-[#F5EFE7] placeholder:text-[#F5EFE7]/20 focus:outline-none focus:border-[#C41E3A]/40 transition-all"
                            placeholder="operator@beatzy.io"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="font-mono text-[10px] text-[#F5EFE7]/30 uppercase tracking-[0.3em] ml-1">New Access Key</label>
                    <div className="relative group/input">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F5EFE7]/10 group-focus-within/input:text-[#C41E3A] transition-colors" />
                        <input
                            type="password"
                            required
                            minLength={8}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full h-14 bg-white/[0.03] border border-[#1A1410]/10 rounded-2xl pl-12 pr-4 text-[#F5EFE7] placeholder:text-[#F5EFE7]/20 focus:outline-none focus:border-[#C41E3A]/40 transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-16 rounded-2xl bg-[#C41E3A] text-black font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(244,164,96,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                        <>
                            <UserPlus className="w-4 h-4" /> Provision Account
                        </>
                    )}
                </button>
            </form>

            <div className="relative z-10 mt-10 space-y-6">
                <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="font-mono text-[9px] text-[#F5EFE7]/20 uppercase tracking-[0.3em]">Or use automated uplink</span>
                    <div className="h-px flex-1 bg-white/5" />
                </div>

                <button
                    onClick={googleLogin}
                    type="button"
                    className="w-full h-14 rounded-2xl bg-white/[0.03] border border-[#1A1410]/10 text-[#F5EFE7] font-mono text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/[0.06] hover:border-[#1A1410]/20 transition-all"
                >
                    <Chrome className="w-4 h-4 text-[#C41E3A]" /> Google Registry Sync
                </button>
            </div>
        </div>

        {/* Footer Links */}
        <div className="text-center space-y-6">
            <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest leading-relaxed">
                By provisioning an account, you agree to our <br />
                <Link to="/terms" className="text-[#F5EFE7] hover:text-[#C41E3A] transition-colors">Service Terms</Link> and <Link to="/privacy" className="text-[#F5EFE7] hover:text-[#C41E3A] transition-colors">Privacy Protocol</Link>.
            </p>
            <div className="flex justify-center items-center gap-4">
                <span className="text-[11px] text-[#F5EFE7]/30 uppercase tracking-widest">Already Registered?</span>
                <Link to="/login" className="group flex items-center gap-2 text-[11px] font-black text-[#C41E3A] uppercase tracking-widest hover:text-[#F5EFE7] transition-colors">
                    Establish Uplink <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>

        {/* Technical Metadata Decoration */}
        <div className="flex justify-between items-center pt-10 font-mono text-[7px] text-[#F5EFE7]/10 uppercase tracking-[0.4em] select-none">
            <div className="flex items-center gap-3">
                <div className="w-1 h-1 rounded-full bg-[#C41E3A] animate-pulse" />
                Registry: CONNECTED
            </div>
            <div className="flex items-center gap-2">
                <Activity className="w-2 h-2" />
                Provision V4.2
            </div>
        </div>
      </div>
    </AuthShell>
  );
}
