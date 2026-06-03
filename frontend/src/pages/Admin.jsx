import { useEffect, useState } from 'react';
import { getStats, getUsers, updateUser, getAuditLogs } from '../api/admin';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip } from 'recharts';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 border border-glass-border rounded-lg text-xs font-mono backdrop-blur-xl" style={{ 
        background: 'rgba(11, 11, 18, 0.9)', 
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' 
      }}>
        <p className="text-white font-bold">{payload[0].payload.name}</p>
        <p className="text-sonic-lime mt-1">{payload[0].value} {payload[0].unit || ''}</p>
      </div>
    );
  }
  return null;
};

export default function Admin() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [logs, setLogs] = useState([]);
  const [logPage, setLogPage] = useState(1);
  const [logTotalPages, setLogTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Fetch Stats & Overview data
  useEffect(() => {
    if (tab === 'overview') {
      setLoading(true);
      getStats()
        .then(({ data }) => setStats(data.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (tab === 'users') {
      setLoading(true);
      getUsers(userPage, 15)
        .then(({ data }) => {
          setUsers(data.data.users);
          setUserTotalPages(data.data.pagination.pages);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (tab === 'logs') {
      setLoading(true);
      getAuditLogs(logPage, 25)
        .then(({ data }) => {
          setLogs(data.data.logs);
          setLogTotalPages(data.data.pagination.pages);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [tab, userPage, logPage]);

  async function handleToggleActive(user) {
    try {
      const { data } = await updateUser(user.id, { is_active: !user.is_active });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: data.data.is_active } : u));
      toast.success(`User ${data.data.is_active ? 'activated' : 'deactivated'}`);
    } catch {
      toast.error('Failed to update status');
    }
  }

  async function handleToggleAdmin(user) {
    try {
      const { data } = await updateUser(user.id, { is_admin: !user.is_admin });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_admin: data.data.is_admin } : u));
      toast.success(`Admin privilege updated`);
    } catch {
      toast.error('Failed to update privileges');
    }
  }

  async function handleChangePlan(user, newPlan) {
    try {
      const { data } = await updateUser(user.id, { plan: newPlan });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, plan: data.data.plan } : u));
      toast.success(`Plan updated to ${newPlan}`);
    } catch {
      toast.error('Failed to update plan');
    }
  }

  // Map charts
  const planData = stats
    ? Object.keys(stats.usersByPlan).map(plan => ({
        name: plan.charAt(0).toUpperCase() + plan.slice(1),
        value: stats.usersByPlan[plan],
      }))
    : [];

  const jobData = stats
    ? Object.keys(stats.jobsByStatus).map(status => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: stats.jobsByStatus[status],
      }))
    : [];

  return (
    <div className="space-y-gutter pb-16">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
        <div>
          <h1 className="font-headline text-3xl font-extrabold text-white tracking-tight">Admin Operations</h1>
          <p className="font-sans text-sm text-on-surface-variant flex items-center gap-2 mt-1">
            System status monitoring and user authorization database controls
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-sonic-lime animate-pulse" />
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
                ? 'border-sonic-lime text-sonic-lime bg-sonic-lime/5'
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
            <div className="absolute inset-0 rounded-full border border-sonic-lime/20 animate-ping"></div>
            <div className="absolute inset-2 rounded-full border border-t-transparent border-sonic-lime animate-spin"></div>
          </div>
          <span className="font-mono text-[10px] text-sonic-lime uppercase tracking-widest">Querying database...</span>
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
                  <span className="font-mono text-3xl font-bold text-sonic-lime">
                    {Object.values(stats.jobsByStatus).reduce((a, b) => a + b, 0)}
                  </span>
                </div>
                <div className="glass-panel p-6 rounded-xl border border-glass-border">
                  <p className="font-mono text-[9px] text-on-surface-variant tracking-[0.1em] uppercase mb-1">Active Subscribers</p>
                  <span className="font-mono text-3xl font-bold text-prism-violet">
                    {(stats.usersByPlan.pro || 0) + (stats.usersByPlan.enterprise || 0)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                {/* Plan Distribution */}
                <div className="glass-panel rounded-xl border border-glass-border p-6 h-[300px] flex flex-col justify-between">
                  <h3 className="font-headline font-bold text-sm text-sonic-lime uppercase tracking-wider">Subscribers Tier Mix</h3>
                  <div className="w-full h-[200px] font-mono text-[9px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={planData} margin={{ left: -25, right: 10 }}>
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" />
                        <YAxis stroke="rgba(255,255,255,0.3)" />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                        <Bar dataKey="value">
                          {planData.map((e, i) => (
                            <Cell key={`cell-${i}`} fill={i % 3 === 0 ? '#ff2e97' : i % 3 === 1 ? '#9d4edd' : '#FFFFFF'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Job Distribution */}
                <div className="glass-panel rounded-xl border border-glass-border p-6 h-[300px] flex flex-col justify-between">
                  <h3 className="font-headline font-bold text-sm text-sonic-lime uppercase tracking-wider">Job Status Log</h3>
                  <div className="w-full h-[200px] font-mono text-[9px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={jobData} margin={{ left: -25, right: 10 }}>
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" />
                        <YAxis stroke="rgba(255,255,255,0.3)" />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                        <Bar dataKey="value">
                          {jobData.map((e, i) => (
                            <Cell key={`cell-${i}`} fill={e.name === 'Completed' ? '#ff2e97' : e.name === 'Failed' ? '#EF4444' : '#9d4edd'} />
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
                              className="bg-[#160f2b] border border-glass-border text-xs font-mono text-white rounded px-2.5 py-1.5 focus:border-sonic-lime focus:outline-none"
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
                              <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sonic-lime"></div>
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
                                  ? 'bg-sonic-lime/10 border-sonic-lime/30 text-sonic-lime'
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

              {/* Pagination controls */}
              <div className="flex justify-between items-center font-mono text-xs">
                <button
                  disabled={userPage <= 1}
                  onClick={() => setUserPage(p => p - 1)}
                  className="px-4 py-2 border border-glass-border rounded disabled:opacity-30 hover:bg-white/[0.02]"
                >
                  Prev
                </button>
                <span>Page {userPage} of {userTotalPages}</span>
                <button
                  disabled={userPage >= userTotalPages}
                  onClick={() => setUserPage(p => p + 1)}
                  className="px-4 py-2 border border-glass-border rounded disabled:opacity-30 hover:bg-white/[0.02]"
                >
                  Next
                </button>
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
                            <span className="px-2 py-0.5 rounded bg-prism-violet/10 border border-prism-violet/20 text-prism-violet text-[9px] tracking-wide">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-on-surface-variant">
                            {log.ip_address || '127.0.0.1'}
                          </td>
                          <td className="px-6 py-4 max-w-xs truncate text-[10px] text-on-surface-variant/80">
                            {log.metadata ? JSON.stringify(log.metadata) : '--'}
                          </td>
                          <td className="px-6 py-4 text-right text-[10px] text-on-surface-variant">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination controls */}
              <div className="flex justify-between items-center font-mono text-xs">
                <button
                  disabled={logPage <= 1}
                  onClick={() => setLogPage(p => p - 1)}
                  className="px-4 py-2 border border-glass-border rounded disabled:opacity-30 hover:bg-white/[0.02]"
                >
                  Prev
                </button>
                <span>Page {logPage} of {logTotalPages}</span>
                <button
                  disabled={logPage >= logTotalPages}
                  onClick={() => setLogPage(p => p + 1)}
                  className="px-4 py-2 border border-glass-border rounded disabled:opacity-30 hover:bg-white/[0.02]"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
