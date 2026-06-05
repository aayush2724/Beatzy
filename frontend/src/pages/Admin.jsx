import { useEffect, useState } from 'react';
import { getStats, getUsers, updateUser, getAuditLogs } from '../api/admin';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip } from 'recharts';
import PageWrapper from '../components/PageWrapper';
import clsx from 'clsx';
import { 
  ShieldCheck, 
  Activity, 
  Users, 
  ShieldAlert, 
  Database, 
  Cpu, 
  Search, 
  Terminal,
  Zap,
  Lock
} from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 border border-white/10 rounded-xl text-xs font-mono backdrop-blur-2xl" style={{ 
        background: 'rgba(5, 5, 5, 0.95)', 
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)' 
      }}>
        <p className="text-white font-bold">{payload[0].payload.name}</p>
        <p className="text-[#c41e3a] mt-1">{payload[0].value} Operators</p>
      </div>
    );
  }
  return null;
};

export default function Admin() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const promises = [getStats()];
    if (tab === 'users') promises.push(getUsers());
    if (tab === 'logs') promises.push(getAuditLogs());

    Promise.all(promises)
      .then(([s, u, l]) => {
        setStats(s.data.data);
        if (u) setUsers(u.data.data);
        if (l) setLogs(l.data.data);
      })
      .finally(() => setLoading(false));
  }, [tab]);

  const handleToggleAdmin = async (u) => {
    try {
      await updateUser(u.id, { is_admin: !u.is_admin });
      setUsers(prev => prev.map(item => item.id === u.id ? { ...item, is_admin: !item.is_admin } : item));
      toast.success('Permissions updated');
    } catch (e) { toast.error('Update failed'); }
  };

  const handleToggleActive = async (u) => {
    try {
      await updateUser(u.id, { is_active: !u.is_active });
      setUsers(prev => prev.map(item => item.id === u.id ? { ...item, is_active: !item.is_active } : item));
      toast.success('Operator status updated');
    } catch (e) { toast.error('Update failed'); }
  };

  const handleChangePlan = async (u, plan) => {
    try {
      await updateUser(u.id, { plan });
      setUsers(prev => prev.map(item => item.id === u.id ? { ...item, plan } : item));
      toast.success('Resource tier modified');
    } catch (e) { toast.error('Update failed'); }
  };

  const planData = stats ? [
    { name: 'Free', value: stats.usersByPlan.free || 0 },
    { name: 'Pro', value: stats.usersByPlan.pro || 0 },
    { name: 'Enterprise', value: stats.usersByPlan.enterprise || 0 },
  ] : [];

  const jobData = stats ? [
    { name: 'Completed', value: stats.jobsByStatus.completed || 0 },
    { name: 'Processing', value: stats.jobsByStatus.processing || 0 },
    { name: 'Failed', value: stats.jobsByStatus.failed || 0 },
  ] : [];

  return (
    <PageWrapper className="space-y-12 pb-20 animate-page-entrance">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 border-b border-white/5 pb-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/20 bg-red-500/5 text-red-400 font-mono text-[9px] uppercase tracking-[0.2em]">
            <Lock className="w-3 h-3" /> Admin Restricted Sector
          </div>
          <h1 className="text-6xl font-display font-black text-white tracking-tighter uppercase leading-none">Control <span className="text-[#c41e3a] text-glow-crimson">Terminal</span></h1>
          <p className="text-on-surface-variant max-w-xl text-sm leading-relaxed">
            Global system monitoring, operator database management, and high-level security protocol audit.
          </p>
        </div>
        <div className="flex gap-4">
            <div className="flex items-center gap-3 px-6 py-4 rounded-xl border border-white/5 bg-white/[0.02] text-white/40 font-mono text-[9px] uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-[#c41e3a] animate-pulse shadow-[0_0_10px_#c41e3a]" />
                Mainframe Link: Stabilized
            </div>
        </div>
      </header>

      {/* Tabs bar */}
      <div className="flex gap-2 p-1 obsidian-panel rounded-2xl border border-white/5 w-max">
        {[
          { id: 'overview', label: 'Telemetry', icon: Activity },
          { id: 'users', label: 'Operator Directory', icon: Users },
          { id: 'logs', label: 'Security Audit', icon: ShieldAlert },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'flex items-center gap-2 px-6 py-2.5 rounded-xl font-mono text-[10px] uppercase tracking-widest transition-all duration-300',
              tab === t.id
                ? 'bg-[#c41e3a] text-black font-black shadow-[0_0_20px_rgba(196,30,58,0.15)]'
                : 'text-on-surface-variant hover:text-white hover:bg-white/5'
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-8">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border border-[#c41e3a]/20 animate-ping" />
            <div className="absolute inset-4 rounded-[2rem] border-2 border-t-[#c41e3a] border-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
                <Terminal className="w-6 h-6 text-[#c41e3a] opacity-40" />
            </div>
          </div>
          <span className="font-mono text-[10px] text-[#c41e3a] uppercase tracking-[0.4em] animate-pulse">Querying Mainframe Database...</span>
        </div>
      ) : (
        <div className="space-y-12">
          {/* TAB 1: OVERVIEW */}
          {tab === 'overview' && stats && (
            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-8 border border-white/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Users className="w-24 h-24 text-white" />
                  </div>
                  <p className="font-mono text-[9px] text-on-surface-variant tracking-[0.2em] uppercase font-black mb-6 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-white/20" /> Total Operators
                  </p>
                  <span className="text-5xl font-display font-black text-white tracking-tighter">{stats.totalUsers}</span>
                </div>
                <div className="glass-card p-8 border border-[#c41e3a]/20 bg-[#c41e3a]/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Zap className="w-24 h-24 text-[#c41e3a]" />
                  </div>
                  <p className="font-mono text-[9px] text-[#c41e3a] tracking-[0.2em] uppercase font-black mb-6 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-[#c41e3a]" /> Neural Extractions
                  </p>
                  <span className="text-5xl font-display font-black text-white tracking-tighter text-glow-crimson">
                    {Object.values(stats.jobsByStatus).reduce((a, b) => a + b, 0)}
                  </span>
                </div>
                <div className="glass-card p-8 border border-[#f4a460]/20 bg-[#f4a460]/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <ShieldCheck className="w-24 h-24 text-[#f4a460]" />
                  </div>
                  <p className="font-mono text-[9px] text-[#f4a460] tracking-[0.2em] uppercase font-black mb-6 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-[#f4a460]" /> Pro Uplinks
                  </p>
                  <span className="text-5xl font-display font-black text-white tracking-tighter text-glow-sandy">
                    {(stats.usersByPlan.pro || 0) + (stats.usersByPlan.enterprise || 0)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Plan Distribution */}
                <div className="obsidian-panel rounded-[2.5rem] border border-white/5 p-10 h-[450px] flex flex-col group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Database className="w-32 h-32 text-white" />
                  </div>
                  <h3 className="font-display font-black text-lg text-white uppercase tracking-widest mb-12 flex items-center gap-4 relative z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#c41e3a]" /> Resource Tiers
                  </h3>
                  <div className="w-full flex-1 font-mono text-[10px] relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={planData} margin={{ left: -30, bottom: 20 }}>
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.1)" font-family="JetBrains Mono" />
                        <YAxis stroke="rgba(255,255,255,0.1)" font-family="JetBrains Mono" />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {planData.map((e, i) => (
                            <Cell key={`cell-${i}`} fill={i % 3 === 0 ? '#c41e3a' : i % 3 === 1 ? '#f4a460' : '#e8a084'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Job Distribution */}
                <div className="obsidian-panel rounded-[2.5rem] border border-white/5 p-10 h-[450px] flex flex-col group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Cpu className="w-32 h-32 text-white" />
                  </div>
                  <h3 className="font-display font-black text-lg text-white uppercase tracking-widest mb-12 flex items-center gap-4 relative z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#c41e3a]" /> Extraction Pipeline
                  </h3>
                  <div className="w-full flex-1 font-mono text-[10px] relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={jobData} margin={{ left: -30, bottom: 20 }}>
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.1)" font-family="JetBrains Mono" />
                        <YAxis stroke="rgba(255,255,255,0.1)" font-family="JetBrains Mono" />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {jobData.map((e, i) => (
                            <Cell key={`cell-${i}`} fill={e.name === 'Completed' ? '#c41e3a' : e.name === 'Failed' ? '#8b2e5f' : '#f4a460'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USERS DIRECTORY */}
          {tab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center px-4">
                  <p className="font-mono text-[10px] text-white/20 uppercase tracking-[0.3em]">Operator Registry</p>
                  <div className="relative w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4" />
                    <input 
                        type="text" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search registry..."
                        className="w-full h-11 bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-4 text-white text-xs focus:outline-none focus:border-[#c41e3a]/30 transition-all font-mono uppercase tracking-widest"
                    />
                  </div>
              </div>

              <div className="obsidian-panel rounded-[2.5rem] border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/[0.02] border-b border-white/5 font-mono text-[10px] text-white/40 uppercase tracking-[0.2em]">
                        <th className="px-8 py-5">Operator Identification</th>
                        <th className="px-8 py-5 text-center">Resource Tier</th>
                        <th className="px-8 py-5 text-center">Admin Access</th>
                        <th className="px-8 py-5 text-center">Spectral Usage</th>
                        <th className="px-8 py-5 text-center">Status</th>
                        <th className="px-8 py-5 text-right">Uplink Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-white/[0.01] transition-all group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 font-black font-display text-sm group-hover:bg-[#c41e3a] group-hover:text-black transition-all">
                                    {u.name?.[0]?.toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-display font-black text-white uppercase tracking-tight truncate">{u.name}</p>
                                    <p className="font-mono text-[9px] text-on-surface-variant mt-1 tracking-widest lowercase">{u.email}</p>
                                </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <select
                              value={u.plan}
                              onChange={(e) => handleChangePlan(u, e.target.value)}
                              className="bg-black border border-white/10 text-[10px] font-mono font-black text-white rounded-lg px-4 py-2 focus:border-[#c41e3a]/50 focus:outline-none uppercase tracking-widest hover:border-white/20 transition-all appearance-none cursor-pointer text-center"
                            >
                              <option value="free">Free</option>
                              <option value="pro">Pro</option>
                              <option value="enterprise">Enterprise</option>
                            </select>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={u.is_admin}
                                onChange={() => handleToggleAdmin(u)}
                                className="sr-only peer"
                              />
                              <div className="w-10 h-5 bg-white/5 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white/40 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#c41e3a] peer-checked:after:bg-black"></div>
                            </label>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <span className="font-mono text-[10px] text-white font-bold uppercase">{u.total_jobs} Signatures</span>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <button
                              onClick={() => handleToggleActive(u)}
                              className={clsx(
                                'px-3 py-1.5 rounded-lg font-mono text-[9px] font-black uppercase tracking-widest border transition-all',
                                u.is_active
                                  ? 'bg-[#c41e3a]/10 border-[#c41e3a]/20 text-[#c41e3a] hover:bg-[#c41e3a] hover:text-black'
                                  : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white'
                              )}
                            >
                              {u.is_active ? 'Active' : 'Locked'}
                            </button>
                          </td>
                          <td className="px-8 py-6 text-right font-mono text-[10px] text-white/20 uppercase tracking-widest">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT LOGS */}
          {tab === 'logs' && (
            <div className="space-y-6">
              <p className="font-mono text-[10px] text-white/20 uppercase tracking-[0.3em] px-4">System Security Event Log</p>
              <div className="obsidian-panel rounded-[2.5rem] border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/[0.02] border-b border-white/5 font-mono text-[10px] text-white/40 uppercase tracking-[0.2em]">
                        <th className="px-8 py-5">Origin Operator</th>
                        <th className="px-8 py-5">Event Code</th>
                        <th className="px-8 py-5">Network IP</th>
                        <th className="px-8 py-5">Diagnostic Payload</th>
                        <th className="px-8 py-5 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {logs.map(log => (
                        <tr key={log.id} className="hover:bg-white/[0.01] transition-all group font-mono text-[10px]">
                          <td className="px-8 py-6 text-white font-black uppercase tracking-tight">
                            {log.email || 'SYSTEM / DAEMON'}
                          </td>
                          <td className="px-8 py-6">
                            <span className="px-3 py-1 rounded-lg bg-[#f4a460]/10 border border-[#f4a460]/20 text-[#f4a460] font-black uppercase tracking-widest">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-on-surface-variant/60">
                            {log.ip_address || '0.0.0.0'}
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-[#e8a084] truncate max-w-xs opacity-60 group-hover:opacity-100 transition-opacity font-bold">{JSON.stringify(log.metadata)}</p>
                          </td>
                          <td className="px-8 py-6 text-right text-white/20 uppercase tracking-widest">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Technical Footer Decoration */}
      <div className="flex justify-between items-center pt-20 font-mono text-[8px] text-white/10 uppercase tracking-[0.4em] select-none">
            <div className="flex items-center gap-4">
                <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_red]" />
                Security Layer: ACTIVE
            </div>
            <div>Cluster Load: Balanced</div>
            <div className="flex items-center gap-2">
                <Cpu className="w-2 h-2" />
                Control V4.2.0
            </div>
        </div>
    </PageWrapper>
  );
}

import toast from 'react-hot-toast';
