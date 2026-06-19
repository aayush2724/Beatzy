import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getHistory } from '../api/audio';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import GlassRecordSleeve from '../components/GlassRecordSleeve';
import PageWrapper from '../components/PageWrapper';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Database, 
  Cpu, 
  Waves, 
  ArrowUpRight, 
  History as HistoryIcon,
  ChevronRight
} from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 border border-[#0D0808]/10 rounded-xl text-xs font-mono backdrop-blur-2xl" style={{ 
        background: 'rgba(5, 5, 5, 0.95)', 
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)' 
      }}>
        <p className="text-[#FFFFFF] font-bold">{payload[0].payload.name}</p>
        <p className="text-[#FF6B35] mt-1">{payload[0].value} BPM</p>
      </div>
    );
  }
  return null;
};

const TiltCard = ({ children, className }) => {
  const cardRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const onMouseMove = (e) => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const rx = ((y / r.height) - 0.5) * -5;
      const ry = ((x / r.width) - 0.5) * 5;
      card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
    };

    const onMouseLeave = () => {
      card.style.transform = '';
    };

    card.addEventListener('mousemove', onMouseMove);
    card.addEventListener('mouseleave', onMouseLeave);

    return () => {
      card.removeEventListener('mousemove', onMouseMove);
      card.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <div ref={cardRef} className={`transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
};

export default function Dashboard() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = () => {
    setLoading(true);
    setError(null);
    getHistory(1, 6)
      .then(({ data }) => setHistory(data.data.jobs))
      .catch((err) => setError(err.response?.data?.error?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const chartData = history.filter(j => j.bpm).map((j, i) => ({
    name: j.song_title || `T-${i}`,
    bpm: Math.round(j.bpm),
  })).reverse();

  return (
    <PageWrapper className="space-y-12 pb-20 animate-page-entrance">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 border-b border-[#0D0808]/5 pb-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/5 text-[#FF6B35] font-mono text-[11px] uppercase tracking-[0.15em]">
            <Activity className="w-3 h-3" /> System Operational
          </div>
          <h1 className="text-6xl font-display font-black text-[#FFFFFF] tracking-[-0.04em] uppercase">
            Control <span className="text-[#FF6B35] text-glow-orange">Center</span>
          </h1>
          <p className="text-on-surface-variant max-w-xl text-sm leading-relaxed">
            Welcome to the Beatzy AI terminal. Monitor spectral telemetry, manage your track archives, and initialize the neural engine.
          </p>
        </div>
        <div className="flex gap-4">
          <Link 
            to="/history" 
            className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/[0.03] border border-[#0D0808]/10 text-[#FFFFFF] font-mono text-[10px] uppercase tracking-widest hover:bg-white/[0.06] transition-all"
          >
            <HistoryIcon className="w-4 h-4" /> Archives
          </Link>
          <Link 
            to="/upload" 
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#FF6B35] text-black font-black text-[10px] uppercase tracking-[0.15em] shadow-[0_0_30px_rgba(255,107,53,0.2)] hover:scale-105 transition-all"
          >
            <Waves className="w-4 h-4" /> Start Engine
          </Link>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-8">
          {/* Recent Archives Section */}
          <div className="col-span-12 xl:col-span-8 space-y-8">
              <div className="flex justify-between items-center">
                  <h3 className="font-display font-bold text-lg text-[#FFFFFF] uppercase tracking-widest flex items-center gap-4">
                    <span className="w-8 h-px bg-[#FF6B35]/30" /> Recent Waveforms
                  </h3>
                  <Link to="/history" className="group flex items-center gap-2 text-[11px] font-mono text-[#FF6B35] uppercase tracking-widest hover:text-[#FFFFFF] transition-colors">
                    View full archive <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
              </div>
              
              {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="h-72 rounded-3xl bg-white/[0.02] border border-[#0D0808]/5 animate-pulse" />
                      ))}
                  </div>
              ) : error ? (
                  <div className="h-72 glass-card flex flex-col items-center justify-center text-center p-12 gap-6">
                      <p className="text-[#FFFFFF]/50 font-mono text-xs uppercase tracking-widest">{error}</p>
                      <button onClick={fetchDashboard} className="px-8 py-3 rounded-xl border border-[#0D0808]/10 text-[#FFFFFF] font-mono text-[11px] uppercase tracking-widest hover:bg-white/5">Initialize Retry</button>
                  </div>
              ) : history.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {history.slice(0, 4).map(job => (
                          <GlassRecordSleeve key={job.id} job={job} />
                      ))}
                  </div>
              ) : (
                  <div className="h-72 glass-card flex flex-col items-center justify-center text-center p-12">
                      <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-6 border border-[#0D0808]/5">
                        <Waves className="w-8 h-8 text-[#FFFFFF]/20" />
                      </div>
                      <p className="text-[#FFFFFF]/40 font-mono text-xs uppercase tracking-[0.2em]">Neural database empty. Start by uploading a signal.</p>
                  </div>
              )}
          </div>

          {/* Sidebar Telemetry */}
          <div className="col-span-12 xl:col-span-4 space-y-8">
              <TiltCard className="glass-card p-8 border border-[#0D0808]/10 overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Activity className="w-24 h-24 text-[#FF6B35]" />
                  </div>
                  <h3 className="font-display font-bold text-xs text-[#FFFFFF] uppercase tracking-widest mb-10 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#FF6B35]" /> Tempo Trends
                  </h3>
                  <div className="h-56 w-full font-mono text-[10px] relative z-10">
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                              <defs>
                                  <linearGradient id="colorBpm" x1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#FF6B35" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                              <XAxis dataKey="name" hide />
                              <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
                              <Tooltip content={<CustomTooltip />} />
                              <Area 
                                type="monotone" 
                                dataKey="bpm" 
                                stroke="#FF6B35" 
                                strokeWidth={3} 
                                fillOpacity={1} 
                                fill="url(#colorBpm)" 
                                animationDuration={1500}
                              />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
              </TiltCard>

              <TiltCard className="obsidian-panel p-8 rounded-3xl border border-[#0D0808]/5 space-y-8">
                  <div className="flex justify-between items-center">
                    <h3 className="font-display font-bold text-xs text-[#FFFFFF] uppercase tracking-widest flex items-center gap-3">
                      <Cpu className="w-4 h-4 text-[#FF6B35]" /> System Status
                    </h3>
                    <div className="px-2 py-0.5 rounded border border-[#FF6B35]/30 text-[#FF6B35] font-mono text-[10px] uppercase tracking-tighter">
                      Operational
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                      <div className="space-y-2">
                          <div className="flex justify-between items-end">
                              <span className="font-mono text-[11px] text-[#FFFFFF]/40 uppercase tracking-widest">Neural Pipeline</span>
                              <span className="font-mono text-[11px] text-[#FF6B35] font-bold">STABLE</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '78%' }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF6B35]" 
                              />
                          </div>
                      </div>
                      <div className="space-y-2">
                          <div className="flex justify-between items-end">
                              <span className="font-mono text-[11px] text-[#FFFFFF]/40 uppercase tracking-widest">Cluster Node Load</span>
                              <span className="font-mono text-[11px] text-[#FFFFFF] font-bold">42%</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '42%' }}
                                transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                                className="h-full bg-[#0D0808]" 
                              />
                          </div>
                      </div>
                  </div>

                  <div className="pt-4 grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-[#0D0808]/5">
                      <Database className="w-4 h-4 text-[#FFFFFF]/20 mb-2" />
                      <p className="text-[16px] font-display font-black text-[#FFFFFF]">1.2 TB</p>
                      <p className="text-[10px] font-mono text-[#FFFFFF]/30 uppercase tracking-widest">Storage</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-[#0D0808]/5">
                      <Cpu className="w-4 h-4 text-[#FFFFFF]/20 mb-2" />
                      <p className="text-[16px] font-display font-black text-[#FFFFFF]">184ms</p>
                      <p className="text-[10px] font-mono text-[#FFFFFF]/30 uppercase tracking-widest">Latency</p>
                    </div>
                  </div>
              </TiltCard>
          </div>
      </div>

      {/* Quick Actions / Getting Started */}
      <section className="glass-card p-12 border border-[#0D0808]/10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-[#FF6B35]/5 blur-[80px] rounded-full group-hover:bg-[#FF6B35]/10 transition-colors" />
        <div className="relative z-10 grid lg:grid-cols-[1fr_auto] gap-12 items-center text-center lg:text-left">
          <div className="space-y-6">
            <h2 className="text-4xl font-display font-black text-[#FFFFFF] uppercase tracking-tight">
              Ready to decode <span className="text-[#FF6B35]">new tracks?</span>
            </h2>
            <p className="text-on-surface-variant max-w-2xl text-base leading-relaxed">
              Upload any track up to 50MB. Our neural engine will identify the song, extract BPM, key, mood, and provide a full spectral analysis in seconds.
            </p>
          </div>
          <div className="flex justify-center">
            <Link 
              to="/upload" 
              className="group flex items-center gap-6 px-10 py-6 rounded-3xl bg-white text-black font-black text-[12px] uppercase tracking-[0.2em] hover:bg-[#FF6B35] hover:scale-105 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
            >
              Initialize Neural Engine <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}
