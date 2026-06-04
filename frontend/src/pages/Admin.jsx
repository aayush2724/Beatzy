import { useEffect, useState } from 'react';
import { getStats, getUsers, updateUser, getAuditLogs } from '../api/admin';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import PageWrapper from '../components/PageWrapper';
import clsx from 'clsx';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 border border-glass-border rounded-lg text-xs font-mono backdrop-blur-xl" style={{ 
        background: 'rgba(11, 11, 18, 0.9)', 
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' 
      }}>
        <p className="text-white font-bold">{payload[0].payload.name}</p>
        <p className="text-primary mt-1">{payload[0].value} {payload[0].unit || ''}</p>
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
    } catch (e) { alert('Update failed'); }
  };

  const handleToggleActive = async (u) => {
    try {
      await updateUser(u.id, { is_active: !u.is_active });
      setUsers(prev => prev.map(item => item.id === u.id ? { ...item, is_active: !item.is_active } : item));
    } catch (e) { alert('Update failed'); }
  };

  const handleChangePlan = async (u, plan) => {
    try {
      await updateUser(u.id, { plan });
      setUsers(prev => prev.map(item => item.id === u.id ? { ...item, plan } : item));
    } catch (e) { alert('Update failed'); }
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
    <PageWrapper className="space-y-gutter pb-16">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
        <div>
          <h1 className="font-headline text-3xl font-extrabold text-white tracking-tight">Admin Operations</h1>
          <p className="font-sans text-sm text-on-surface-variant flex items-center gap-2 mt-1">
            System status monitoring and user authorization database controls
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          </p>
        </div>
      </header>

      {/* Tabs bar */}
      <div className="flex border-b border-glass-border">
        {[
          { id: 'overview', label: 'Telemetry Overview', icon: 'monitoring' },
          { id: 'users', label: 'User Directory', icon: 'group' },
          { id: 'logs', label: 'Security Audit logs', icon: 'security' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'flex items-center gap-2 px-6 py-3 border-b-2 font-mono text-[11px] uppercase tracking-wider transition-all',
              tab === t.id
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-on-surface-variant hover:text-white'
            )}
          >
            <span className="material-symbols-outlined text-base">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping"></div>
            <div className="absolute inset-2 rounded-full border border-t-transparent border-primary animate-spin"></div>
          </div>
          <span className="font-mono text-[10px] text-primary uppercase tracking-widest">Querying database...</span>
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW */}
          {tab === 'overview' && stats && (
            <div className="space-y-gutter">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                <div className="glass-panel p-6 rounded-xl border border-glass-border">
                  <p className="font-mono text-[9px] text-on-surface-variant tracking-[0.1em] uppercase mb-1">Total Users</p>
                  <span className="font-mono text-3xl font-bold text-white">{stats.totalUsers}</span>
                </div>
                <div className="glass-panel p-6 rounded-xl border border-glass-border">
                  <p className="font-mono text-[9px] text-on-surface-variant tracking-[0.1em] uppercase mb-1">Signals Analyzed</p>
                  <span className="font-mono text-3xl font-bold text-primary">
                    {Object.values(stats.jobsByStatus).reduce((a, b) => a + b, 0)}
                  </span>
                </div>
                <div className="glass-panel p-6 rounded-xl border border-glass-border">
                  <p className="font-mono text-[9px] text-on-surface-variant tracking-[0.1em] uppercase mb-1">Active Subscribers</p>
                  <span className="font-mono text-3xl font-bold text-secondary">
                    {(stats.usersByPlan.pro || 0) + (stats.usersByPlan.enterprise || 0)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                {/* Plan Distribution */}
                <div className="glass-panel rounded-xl border border-glass-border p-6 h-[300px] flex flex-col justify-between">
                  <h3 className="font-headline font-bold text-sm text-primary uppercase tracking-wider">Subscribers Tier Mix</h3>
                  <div className="w-full h-[200px] font-mono text-[9px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={planData} margin={{ left: -25, right: 10 }}>
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" />
                        <YAxis stroke="rgba(255,255,255,0.3)" />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                        <Bar dataKey="value">
                          {planData.map((e, i) => (
                            <Cell key={`cell-${i}`} fill={i % 3 === 0 ? 'var(--color-primary)' : i % 3 === 1 ? 'var(--color-secondary)' : '#FFFFFF'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Job Distribution */}
                <div className="glass-panel rounded-xl border border-glass-border p-6 h-[300px] flex flex-col justify-between">
                  <h3 className="font-headline font-bold text-sm text-primary uppercase tracking-wider">Job Status Log</h3>
                  <div className="w-full h-[200px] font-mono text-[9px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={jobData} margin={{ left: -25, right: 10 }}>
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" />
                        <YAxis stroke="rgba(255,255,255,0.3)" />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                        <Bar dataKey="value">
                          {jobData.map((e, i) => (
                            <Cell key={`cell-${i}`} fill={e.name === 'Completed' ? 'var(--color-primary)' : e.name === 'Failed' ? '#EF4444' : 'var(--color-secondary)'} />
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
            <div className="space-y-4">
              <div className="glass-panel rounded-xl border border-glass-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/[0.02] border-b border-glass-border font-mono text-[9px] text-on-surface-variant/70 uppercase tracking-widest">
                        <th className="px-6 py-3.5">User</th>
                        <th className="px-6 py-3.5">Tier Plan</th>
                        <th className="px-6 py-3.5">Admin status</th>
                        <th className="px-6 py-3.5">Usage</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5 text-right">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-glass-border">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-sans text-xs font-semibold text-white truncate">{u.name}</p>
                            <p className="font-mono text-[9px] text-on-surface-variant mt-0.5 tracking-wider">{u.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={u.plan}
                              onChange={(e) => handleChangePlan(u, e.target.value)}
                              className="bg-surface-container border border-glass-border text-xs font-mono text-white rounded px-2.5 py-1.5 focus:border-primary focus:outline-none"
                            >
                              <option value="free">Free</option>
                              <option value="pro">Pro</option>
                              <option value="enterprise">Enterprise</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={u.is_admin}
                                onChange={() => handleToggleAdmin(u)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-on-surface">
                            {u.total_jobs} analyses
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleActive(u)}
                              className={clsx(
                                'px-2 py-0.5 rounded font-mono text-[8px] uppercase tracking-wider border',
                                u.is_active
                                  ? 'bg-primary/10 border-primary/30 text-primary'
                                  : 'bg-red-500/10 border-red-500/20 text-red-400'
                              )}
                            >
                              {u.is_active ? 'Active' : 'Suspended'}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-[10px] text-on-surface-variant">
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
            <div className="space-y-4">
              <div className="glass-panel rounded-xl border border-glass-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/[0.02] border-b border-glass-border font-mono text-[9px] text-on-surface-variant/70 uppercase tracking-widest">
                        <th className="px-6 py-3.5">Operator</th>
                        <th className="px-6 py-3.5">Action Code</th>
                        <th className="px-6 py-3.5">IP Address</th>
                        <th className="px-6 py-3.5">Metadata Payload</th>
                        <th className="px-6 py-3.5 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-glass-border">
                      {logs.map(log => (
                        <tr key={log.id} className="hover:bg-white/[0.01] transition-colors font-mono text-xs">
                          <td className="px-6 py-4 text-white font-medium">
                            {log.email || 'System / Daemon'}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded bg-secondary/10 border border-secondary/20 text-secondary text-[9px] tracking-wide">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-on-surface-variant">
                            {log.ip_address || '127.0.0.1'}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-[10px] text-on-surface-variant truncate max-w-xs">{JSON.stringify(log.metadata)}</p>
                          </td>
                          <td className="px-6 py-4 text-right text-on-surface-variant text-[10px]">
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
        </>
      )}
    </PageWrapper>
  );
}
