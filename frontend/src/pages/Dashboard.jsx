import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Music2, CheckCircle, Clock, XCircle, TrendingUp, BarChart3, Zap } from 'lucide-react';
import { getHistory } from '../api/audio';
import { useAuthStore } from '../store/authStore';
import clsx from 'clsx';

const STATUS_BADGES = {
  completed: { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Completed', icon: '✓' },
  processing: { bg: 'bg-secondary-fixed/10', text: 'text-secondary-fixed', label: 'Processing', icon: '◉' },
  queued: { bg: 'bg-gray-500/10', text: 'text-gray-400', label: 'Queued', icon: '◦' },
  failed: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Failed', icon: '✕' },
};

const SpectrumBar = ({ delay }) => (
  <div
    className="spectrum-bar w-2 bg-secondary-fixed rounded-t"
    style={{
      animation: 'spectrum 1.5s ease-in-out infinite alternate',
      animationDelay: `${delay}s`,
      height: `${Math.random() * 100}%`,
    }}
  />
);

export default function Dashboard() {
  const { user } = useAuthStore();
  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [systemLatency] = useState(24); // Mock latency in ms
  const [tooltipData, setTooltipData] = useState(null);

  useEffect(() => {
    getHistory(1, 10).then(({ data }) => {
      setHistory(data.data.jobs);
      setTotal(data.data.pagination.total);
    }).finally(() => setLoading(false));
  }, []);

  const completed = history.filter(j => j.status === 'completed').length;
  const identified = history.filter(j => j.song_title).length;

  const handleSpectrumHover = (e) => {
    const freq = Math.floor(Math.random() * (20000 - 100) + 100);
    setTooltipData({
      freq,
      x: e.clientX + 10,
      y: e.clientY - 30,
    });
  };

  return (
    <div className="min-h-screen bg-surface pt-20">
      {/* Dashboard Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 px-8 pb-8">
        <div>
          <h1 className="text-4xl font-bold font-display-lg text-on-background mb-2">Dashboard</h1>
          <p className="font-body-lg text-on-surface-variant flex items-center gap-2">
            Welcome back, {user?.name?.split(' ')[0]}!
            <span className="inline-block w-2 h-2 rounded-full bg-secondary-fixed animate-pulse" />
            <span className="text-xs font-label-sm text-secondary-fixed/60 uppercase tracking-tighter">System Nominal</span>
          </p>
        </div>
        <Link to="/upload" className="bg-secondary-fixed text-on-secondary-fixed px-6 py-3 rounded font-label-md flex items-center gap-3 hover:scale-105 active:scale-95 transition-all neon-glow-lime">
          <Upload size={18} /> Analyze Audio
        </Link>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 px-8">
        {[
          { label: 'Total Analyses', value: total, icon: Music2, color: 'border-secondary-fixed', trend: '+12% vs LY' },
          { label: 'Completed', value: completed, icon: CheckCircle, color: 'border-green-500/50', trend: '98.4% Acc.' },
          { label: 'Songs Identified', value: identified, icon: TrendingUp, color: 'border-yellow-500/50', trend: 'Trending: Tech' },
          { label: 'Plan', value: <span className="capitalize text-tertiary">{user?.plan || 'Pro'}</span>, icon: Clock, color: 'border-on-tertiary-container/50', trend: 'Next bill: 12d' },
        ].map(({ label, value, icon: Icon, color, trend }) => (
          <div key={label} className={clsx('glass-panel p-6 rounded-lg border-l-4 transition-all hover:border-l-8', color)}>
            <div className="flex justify-between items-start mb-4">
              <span className={clsx('p-2 bg-opacity-10 rounded', 
                color === 'border-secondary-fixed' ? 'bg-secondary-fixed text-secondary-fixed' :
                color === 'border-green-500/50' ? 'bg-green-400 text-green-400' :
                color === 'border-yellow-500/50' ? 'bg-yellow-400 text-yellow-400' :
                'bg-tertiary text-tertiary'
              )}>
                <Icon size={20} />
              </span>
              <span className="font-label-sm text-on-surface-variant/40 text-xs">{trend}</span>
            </div>
            <p className="font-data-label text-on-surface-variant uppercase mb-2 text-xs tracking-widest">{label}</p>
            <h3 className="font-data-value text-3xl text-on-background tracking-tight">{value}</h3>
          </div>
        ))}
      </section>

      {/* Main Layout Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-8 pb-20">
        {/* Recent Analyses Table */}
        <div className="lg:col-span-2 glass-panel rounded-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center">
            <h2 className="font-headline-lg text-on-background">Recent Analyses</h2>
            <Link to="/upload" className="text-secondary-fixed text-sm font-label-md flex items-center gap-1 hover:underline">
              New analysis <span>→</span>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 font-label-sm text-on-surface-variant/60 uppercase tracking-widest text-[10px]">
                  <th className="px-8 py-4">Source</th>
                  <th className="px-8 py-4">Title / ID</th>
                  <th className="px-8 py-4">Artist</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4">Tech Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td colSpan="5" className="px-8 py-5">
                        <div className="h-8 bg-white/5 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-8 py-16 text-center">
                      <Music2 size={40} className="text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No analyses yet</p>
                    </td>
                  </tr>
                ) : (
                  history.map((job) => (
                    <tr key={job.id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-8 py-5">
                        <div className="w-10 h-10 rounded-lg bg-secondary-fixed/10 flex items-center justify-center text-secondary-fixed">
                          <Music2 size={18} />
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <Link to={job.status === 'completed' ? `/results/${job.id}` : '#'} className="hover:text-secondary-fixed transition-colors">
                          <p className="font-body-md font-medium text-on-background">{job.song_title || job.original_filename}</p>
                          <p className="text-[10px] text-outline">ID: {job.id?.substring(0, 10)}-X</p>
                        </Link>
                      </td>
                      <td className="px-8 py-5 text-on-surface-variant">{job.song_artist || 'System Gen'}</td>
                      <td className="px-8 py-5">
                        <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-label-sm uppercase', STATUS_BADGES[job.status]?.bg, STATUS_BADGES[job.status]?.text)}>
                          <span>{STATUS_BADGES[job.status]?.icon}</span>
                          {STATUS_BADGES[job.status]?.label}
                        </span>
                      </td>
                      <td className="px-8 py-5 font-label-sm text-secondary-fixed">{job.bpm ? `${job.bpm} BPM` : '-- BPM'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar: Visualizer & System Status */}
        <div className="space-y-6">
          {/* Spectrum Visualizer */}
          <div className="glass-panel p-6 rounded-xl overflow-hidden">
            <h4 className="font-label-md text-secondary-fixed mb-6 flex items-center gap-2 uppercase tracking-widest text-xs">
              <BarChart3 size={16} /> Live Spectrum
            </h4>
            <div className="flex items-end justify-between h-32 gap-1 px-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="spectrum-bar w-2 bg-secondary-fixed/80 rounded-t hover:brightness-150 transition-all cursor-pointer"
                  style={{
                    animation: 'spectrum 1.5s ease-in-out infinite alternate',
                    animationDelay: `${(i * 0.1 + 0.1).toFixed(1)}s`,
                    height: `${20 + Math.random() * 80}%`,
                  }}
                  onMouseEnter={handleSpectrumHover}
                  onMouseMove={handleSpectrumHover}
                  onMouseLeave={() => setTooltipData(null)}
                />
              ))}
            </div>
            <div className="mt-6 border-t border-white/5 pt-4">
              <p className="text-[10px] font-data-label text-on-surface-variant uppercase tracking-widest text-center">Spectral Fingerprinting Active</p>
            </div>
          </div>

          {/* System Latency */}
          <div className="glass-panel p-6 rounded-xl border border-secondary-fixed/20">
            <h4 className="font-label-md text-on-background mb-4 uppercase text-xs flex items-center gap-2">
              <Zap size={16} /> System Latency
            </h4>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-outline">US-East Node</span>
              <span className="text-secondary-fixed font-label-sm">{systemLatency}ms</span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-secondary-fixed" style={{ width: `${Math.min(systemLatency, 100)}%` }} />
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <div className="flex justify-between items-center bg-white/5 px-3 py-2 rounded">
                <span className="text-[10px] font-label-sm text-outline">ENCODER</span>
                <span className="text-[10px] font-label-sm text-secondary-fixed">READY</span>
              </div>
              <div className="flex justify-between items-center bg-white/5 px-3 py-2 rounded">
                <span className="text-[10px] font-label-sm text-outline">IDENTIFIER</span>
                <span className="text-[10px] font-label-sm text-tertiary">STABLE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltipData && (
        <div
          className="fixed pointer-events-none glass-panel px-3 py-1.5 rounded-lg border border-secondary-fixed/30 text-[10px] font-label-sm text-secondary-fixed z-50"
          style={{ left: `${tooltipData.x}px`, top: `${tooltipData.y}px` }}
        >
          {tooltipData.freq} Hz
        </div>
      )}

      <style>{`
        @keyframes spectrum {
          0% { height: 20%; }
          100% { height: 100%; }
        }
        .glass-panel {
          background: rgba(26, 26, 26, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .neon-glow-lime {
          box-shadow: 0 0 15px rgba(195, 244, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
