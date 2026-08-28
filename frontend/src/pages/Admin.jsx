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
      <div className="glass-card p-3 border border-line rounded-xl text-xs font-mono backdrop-blur-2xl" style={{ 
        background: 'rgba(5, 5, 5, 0.95)', 
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)' 
      }}>
        <p className="text-ink font-bold">{payload[0].payload.name}</p>
        <p className="text-brand mt-1">{payload[0].value} Operators</p>
      </div>
    );
  }
  return null;
};

export default function Admin() {
  const c = usePalette();
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
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 border-b border-line-subtle pb-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/20 bg-red-500/5 text-red-400 font-mono text-[9px] uppercase tracking-[0.2em]">
            <Lock className="w-3 h-3" /> Admin Restricted Sector
          </div>
          <h1 className="text-6xl font-display font-black text-ink tracking-tighter uppercase leading-none">Control <span className="text-brand text-glow-orange">Terminal</span></h1>
          <p className="text-on-surface-variant max-w-xl text-sm leading-relaxed">
            Global system monitoring, operator database management, and high-level security protocol audit.
          </p>
        </div>
        <div className="flex gap-4">
            <div className="flex items-center gap-3 px-6 py-4 rounded-xl border border-line-subtle bg-ink/[0.02] text-ink/40 font-mono text-[9px] uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse shadow-[0_0_10px_var(--brand)]" />
                Mainframe Link: Stabilized
            </div>
        </div>
      </header>

      {/* Tabs bar */}
      <div className="flex gap-2 p-1 obsidian-panel rounded-2xl border border-line-subtle w-max">
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
                ? 'bg-brand text-brand-ink font-black shadow-[0_0_20px_rgba(255,107,53,0.15)]'
                : 'text-on-surface-variant hover:text-ink hover:bg-ink/5'
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
            <div className="absolute inset-0 rounded-full border border-brand/20 animate-ping" />
            <div className="absolute inset-4 rounded-[2rem] border-2 border-t-brand border-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
                <Terminal className="w-6 h-6 text-brand opacity-40" />
            </div>
          </div>
          <span className="font-mono text-[10px] text-brand uppercase tracking-[0.4em] animate-pulse">Querying Mainframe Database...</span>
        </div>
      ) : (
        <div className="space-y-12">
          {/* TAB 1: OVERVIEW */}
          {tab === 'overview' && stats && (
            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-8 border border-line relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Users className="w-24 h-24 text-ink" />
                  </div>
                  <p className="font-mono text-[9px] text-on-surface-variant tracking-[0.2em] uppercase font-black mb-6 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-ink/20" /> Total Operators
                  </p>
                  <span className="text-5xl font-display font-black text-ink tracking-tighter">{stats.totalUsers}</span>
                </div>
                <div className="glass-card p-8 border border-brand/20 bg-brand/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Zap className="w-24 h-24 text-brand" />
                  </div>
                  <p className="font-mono text-[9px] text-brand tracking-[0.2em] uppercase font-black mb-6 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-brand" /> Neural Extractions
                  </p>
                  <span className="text-5xl font-display font-black text-ink tracking-tighter text-glow-orange">
                    {Object.values(stats.jobsByStatus).reduce((a, b) => a + b, 0)}
                  </span>
                </div>
                <div className="glass-card p-8 border border-brand/20 bg-brand/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <ShieldCheck className="w-24 h-24 text-brand" />
                  </div>
                  <p className="font-mono text-[9px] text-brand tracking-[0.2em] uppercase font-black mb-6 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-brand" /> Pro Uplinks
                  </p>
                  <span className="text-5xl font-display font-black text-ink tracking-tighter text-glow-ember">
                    {(stats.usersByPlan.pro || 0) + (stats.usersByPlan.enterprise || 0)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Plan Distribution */}
                <div className="obsidian-panel rounded-[2.5rem] border border-line-subtle p-10 h-[450px] flex flex-col group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Database className="w-32 h-32 text-ink" />
                  </div>
                  <h3 className="font-display font-black text-lg text-ink uppercase tracking-widest mb-12 flex items-center gap-4 relative z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand" /> Resource Tiers
                  </h3>
                  <div className="w-full flex-1 font-mono text-[10px] relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={planData} margin={{ left: -30, bottom: 20 }}>
                        <XAxis dataKey="name" stroke="color-mix(in_oklab,var(--ink)_10%,transparent)" font-family="JetBrains Mono" />
                        <YAxis stroke="color-mix(in_oklab,var(--ink)_10%,transparent)" font-family="JetBrains Mono" />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'color-mix(in_oklab,var(--ink)_2%,transparent)' }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {planData.map((e, i) => (
                            <Cell key={`cell-${i}`} fill={c.ramp[i % c.ramp.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Job Distribution */}
                <div className="obsidian-panel rounded-[2.5rem] border border-line-subtle p-10 h-[450px] flex flex-col group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Cpu className="w-32 h-32 text-ink" />
                  </div>
                  <h3 className="font-display font-black text-lg text-ink uppercase tracking-widest mb-12 flex items-center gap-4 relative z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand" /> Extraction Pipeline
                  </h3>
                  <div className="w-full flex-1 font-mono text-[10px] relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={jobData} margin={{ left: -30, bottom: 20 }}>
                        <XAxis dataKey="name" stroke="color-mix(in_oklab,var(--ink)_10%,transparent)" font-family="JetBrains Mono" />
                        <YAxis stroke="color-mix(in_oklab,var(--ink)_10%,transparent)" font-family="JetBrains Mono" />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'color-mix(in_oklab,var(--ink)_2%,transparent)' }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {jobData.map((e, i) => (
                            <Cell key={`cell-${i}`} fill={e.name === 'Completed' ? c.brand : e.name === 'Failed' ? c.danger : c.accentWarm} />
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
                  <p className="font-mono text-[10px] text-ink/20 uppercase tracking-[0.3em]">Operator Registry</p>
                  <div className="relative w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/20 w-4 h-4" />
                    <input 
                        type="text" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search registry..."
                        className="w-full h-11 bg-ink/[0.03] border border-line rounded-xl pl-12 pr-4 text-ink text-xs focus:outline-none focus:border-brand/30 transition-all font-mono uppercase tracking-widest"
                    />
                  </div>
              </div>

              <div className="obsidian-panel rounded-[2.5rem] border border-line-subtle overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-ink/[0.02] border-b border-line-subtle font-mono text-[10px] text-ink/40 uppercase tracking-[0.2em]">
                        <th className="px-8 py-5">Operator Identification</th>
                        <th className="px-8 py-5 text-center">Resource Tier</th>
                        <th className="px-8 py-5 text-center">Admin Access</th>
                        <th className="px-8 py-5 text-center">Spectral Usage</th>
                        <th className="px-8 py-5 text-center">Status</th>
                        <th className="px-8 py-5 text-right">Uplink Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/5">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-ink/[0.01] transition-all group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-ink/5 border border-line flex items-center justify-center text-ink/40 font-black font-display text-sm group-hover:bg-brand group-hover:text-brand-ink transition-all">
                                    {u.name?.[0]?.toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-display font-black text-ink uppercase tracking-tight truncate">{u.name}</p>
                                    <p className="font-mono text-[9px] text-on-surface-variant mt-1 tracking-widest lowercase">{u.email}</p>
                                </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <select
                              value={u.plan}
                              onChange={(e) => handleChangePlan(u, e.target.value)}
                              className="bg-canvas border border-line text-[10px] font-mono font-black text-ink rounded-lg px-4 py-2 focus:border-brand/50 focus:outline-none uppercase tracking-widest hover:border-line transition-all appearance-none cursor-pointer text-center"
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
                              <div className="w-10 h-5 bg-ink/5 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-ink/40 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brand peer-checked:after:bg-canvas"></div>
                            </label>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <span className="font-mono text-[10px] text-ink font-bold uppercase">{u.total_jobs} Signatures</span>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <button
                              onClick={() => handleToggleActive(u)}
                              className={clsx(
                                'px-3 py-1.5 rounded-lg font-mono text-[9px] font-black uppercase tracking-widest border transition-all',
                                u.is_active
                                  ? 'bg-brand/10 border-brand/20 text-brand hover:bg-brand hover:text-brand-ink'
                                  : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500 hover:text-ink'
                              )}
                            >
                              {u.is_active ? 'Active' : 'Locked'}
                            </button>
                          </td>
                          <td className="px-8 py-6 text-right font-mono text-[10px] text-ink/20 uppercase tracking-widest">
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
              <p className="font-mono text-[10px] text-ink/20 uppercase tracking-[0.3em] px-4">System Security Event Log</p>
              <div className="obsidian-panel rounded-[2.5rem] border border-line-subtle overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-ink/[0.02] border-b border-line-subtle font-mono text-[10px] text-ink/40 uppercase tracking-[0.2em]">
                        <th className="px-8 py-5">Origin Operator</th>
                        <th className="px-8 py-5">Event Code</th>
                        <th className="px-8 py-5">Network IP</th>
                        <th className="px-8 py-5">Diagnostic Payload</th>
                        <th className="px-8 py-5 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/5">
                      {logs.map(log => (
                        <tr key={log.id} className="hover:bg-ink/[0.01] transition-all group font-mono text-[10px]">
                          <td className="px-8 py-6 text-ink font-black uppercase tracking-tight">
                            {log.email || 'SYSTEM / DAEMON'}
                          </td>
                          <td className="px-8 py-6">
                            <span className="px-3 py-1 rounded-lg bg-brand/10 border border-brand/20 text-brand font-black uppercase tracking-widest">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-on-surface-variant/60">
                            {log.ip_address || '0.0.0.0'}
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-accent-warm truncate max-w-xs opacity-60 group-hover:opacity-100 transition-opacity font-bold">{JSON.stringify(log.metadata)}</p>
                          </td>
                          <td className="px-8 py-6 text-right text-ink/20 uppercase tracking-widest">
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
      <div className="flex justify-between items-center pt-20 font-mono text-[10px] text-ink/10 uppercase tracking-[0.3em] select-none">
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
import { usePalette } from '../lib/palette';
