import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getHistory } from '../api/audio';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import GlassRecordSleeve from '../components/GlassRecordSleeve';
import PageWrapper from '../components/PageWrapper';
import clsx from 'clsx';

const SG = { fontFamily: "'Space Grotesk', 'Hanken Grotesk', sans-serif" };

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 border border-glass-border rounded-lg text-xs font-mono backdrop-blur-xl" style={{ 
        background: 'rgba(20, 20, 20, 0.92)', 
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' 
      }}>
        <p className="text-white font-bold">{payload[0].payload.name}</p>
        <p className="text-primary mt-1">{payload[0].value} {payload[0].unit || ''}</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user } = useAuthStore();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory(1, 6)
      .then(({ data }) => setHistory(data.data.jobs))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const chartData = history.filter(j => j.bpm).map((j, i) => ({
    name: j.song_title || `T-${i}`,
    bpm: Math.round(j.bpm),
  })).reverse();

  return (
    <PageWrapper className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6 mb-4 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-5xl font-headline font-extrabold text-white tracking-tighter" style={SG}>Control Center</h1>
          <p className="font-sans text-sm text-on-surface-variant flex items-center gap-2 mt-2">
            Operational status: <span className="text-primary font-mono uppercase tracking-widest text-[10px]">Optimal</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          </p>
        </div>
        <Link 
          to="/upload" 
          className="btn-primary flex items-center gap-2 uppercase text-xs tracking-wider"
        >
          <span className="material-symbols-outlined text-base">waves</span>
          Initialize Analyzer
        </Link>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-8">
          {/* Recent Archives Section */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
              <div className="flex justify-between items-center">
                  <h3 className="font-headline font-bold text-sm text-white uppercase tracking-widest">Recent Waveforms</h3>
                  <Link to="/history" className="text-[10px] font-mono text-primary uppercase tracking-widest hover:underline">View All Archives</Link>
              </div>
              
              {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="h-64 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse" />
                      ))}
                  </div>
              ) : history.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {history.slice(0, 4).map(job => (
                          <GlassRecordSleeve key={job.id} job={job} />
                      ))}
                  </div>
              ) : (
                  <div className="h-64 glass-panel border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-12">
                      <span className="material-symbols-outlined text-4xl text-white/10 mb-4">album</span>
                      <p className="text-white/40 font-mono text-xs uppercase tracking-widest">Database empty. Start by uploading a signal.</p>
                  </div>
              )}
          </div>

          {/* Sidebar Telemetry */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
              <section className="glass-panel p-6 border border-glass-border">
                  <h3 className="font-headline font-bold text-xs text-white uppercase tracking-widest mb-6">Tempo Trends</h3>
                  <div className="h-48 w-full font-mono text-[9px]">
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                              <defs>
                                  <linearGradient id="colorBpm" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2}/>
                                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                              <XAxis dataKey="name" hide />
                              <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                              <Tooltip content={<CustomTooltip />} />
                              <Area type="monotone" dataKey="bpm" unit="BPM" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorBpm)" />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
              </section>

              <section className="glass-panel p-6 border border-glass-border">
                  <h3 className="font-headline font-bold text-xs text-white uppercase tracking-widest mb-6">System Load</h3>
                  <div className="space-y-4">
                      <div className="flex justify-between items-end mb-1">
                          <span className="font-mono text-[9px] text-white/40 uppercase">ML Pipeline</span>
                          <span className="font-mono text-[10px] text-primary font-bold">ACTIVE</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-primary w-2/3" />
                      </div>
                      <div className="flex justify-between items-end mb-1 pt-2">
                          <span className="font-mono text-[9px] text-white/40 uppercase">Storage</span>
                          <span className="font-mono text-[10px] text-secondary font-bold">1.2 TB</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-secondary w-1/4" />
                      </div>
                  </div>
              </section>
          </div>
      </div>
    </PageWrapper>
  );
}
