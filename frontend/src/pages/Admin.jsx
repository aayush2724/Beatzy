import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip } from 'recharts';
import { Activity, ScrollText, ShieldCheck, Users } from 'lucide-react';
import { getStats, getUsers, updateUser, getAuditLogs } from '../api/admin';
import PageWrapper from '../components/PageWrapper';
import { usePalette } from '../lib/palette';
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  SearchField,
  SectionHeader,
  Skeleton,
  StatTile,
  Tabs,
} from '../components/ui';

const selectClass =
  'h-9 rounded-lg border border-line bg-surface px-2.5 text-sm text-ink transition-colors focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/20';

const ChartTip = ({ active, payload, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-raised px-3 py-2 text-xs shadow-[var(--shadow-md)]">
      <p className="font-medium text-ink">{payload[0].payload.name}</p>
      <p className="mt-0.5 tabular-nums text-ink-muted">{payload[0].value} {unit}</p>
    </div>
  );
};

function CountChart({ data, colors, unit }) {
  const c = usePalette();
  return (
    <div className="h-52 w-full text-xs">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <XAxis dataKey="name" tick={{ fill: c.inkMuted, fontSize: 12 }} axisLine={{ stroke: c.line }} tickLine={false} />
          <YAxis tick={{ fill: c.inkMuted, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<ChartTip unit={unit} />} cursor={{ fill: c.line, opacity: 0.4 }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

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
    const requests = [getStats()];
    if (tab === 'users') requests.push(getUsers());
    if (tab === 'logs') requests.push(getAuditLogs());
    Promise.all(requests)
      .then(([s, extra]) => {
        setStats(s.data.data);
        if (tab === 'users' && extra) setUsers(extra.data.data);
        if (tab === 'logs' && extra) setLogs(extra.data.data);
      })
      .catch(() => toast.error("Couldn't load admin data"))
      .finally(() => setLoading(false));
  }, [tab]);

  async function patchUser(u, patch, message) {
    try {
      await updateUser(u.id, patch);
      setUsers((list) => list.map((item) => (item.id === u.id ? { ...item, ...patch } : item)));
      toast.success(message);
    } catch {
      toast.error("Couldn't update the user");
    }
  }

  const planData = stats
    ? [
        { name: 'Free', value: stats.usersByPlan?.free || 0 },
        { name: 'Pro', value: stats.usersByPlan?.pro || 0 },
        { name: 'Enterprise', value: stats.usersByPlan?.enterprise || 0 },
      ]
    : [];
  const jobData = stats
    ? [
        { name: 'Completed', value: stats.jobsByStatus?.completed || 0 },
        { name: 'Processing', value: stats.jobsByStatus?.processing || 0 },
        { name: 'Failed', value: stats.jobsByStatus?.failed || 0 },
      ]
    : [];
  const totalJobs = jobData.reduce((a, b) => a + b.value, 0);
  const paidUsers = (stats?.usersByPlan?.pro || 0) + (stats?.usersByPlan?.enterprise || 0);

  const visibleUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => [u.name, u.email].some((v) => v && v.toLowerCase().includes(q)));
  }, [users, search]);

  return (
    <PageWrapper className="space-y-8 pb-16">
      <PageHeader
        eyebrow="Admin"
        title="Administration"
        description="Usage across the service, user accounts, and the audit log."
        actions={
          <Tabs
            aria-label="Admin section"
            value={tab}
            onChange={setTab}
            items={[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'logs', label: 'Audit log', icon: ScrollText },
            ]}
          />
        }
      />

      {tab === 'overview' && (
        loading || !stats ? (
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
              <StatTile label="Users" value={stats.totalUsers ?? 0} hint="All accounts" icon={Users} />
              <StatTile label="Analyses" value={totalJobs} hint={`${stats.jobsByStatus?.failed || 0} failed`} icon={Activity} />
              <StatTile label="Paid plans" value={paidUsers} hint="Pro and Enterprise" icon={ShieldCheck} />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <SectionHeader title="Users by plan" />
                <div className="mt-4"><CountChart data={planData} colors={[c.lineStrong, c.brand, c.accentWarm]} unit="users" /></div>
              </Card>
              <Card>
                <SectionHeader title="Analyses by status" />
                <div className="mt-4"><CountChart data={jobData} colors={[c.ok, c.brand, c.danger]} unit="analyses" /></div>
              </Card>
            </div>
          </div>
        )
      )}

      {tab === 'users' && (
        <Card padding="none">
          <div className="flex flex-col gap-3 border-b border-line-subtle px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <SectionHeader title="Users" description={`${users.length} loaded`} />
            <SearchField value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email" className="sm:w-64" aria-label="Search users" />
          </div>
          {loading ? (
            <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
          ) : visibleUsers.length === 0 ? (
            <EmptyState title="No users match" className="m-5" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-ink-faint">
                  <tr className="border-b border-line-subtle">
                    <th className="px-5 py-3 font-medium">User</th>
                    <th className="px-5 py-3 font-medium">Plan</th>
                    <th className="px-5 py-3 font-medium">Analyses</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Admin</th>
                    <th className="px-5 py-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {visibleUsers.map((u) => (
                    <tr key={u.id} className="transition-colors hover:bg-veil-1">
                      <td className="px-5 py-3">
                        <p className="font-medium text-ink">{u.name}</p>
                        <p className="text-xs text-ink-muted">{u.email}</p>
                      </td>
                      <td className="px-5 py-3">
                        <select className={selectClass} value={u.plan} onChange={(e) => patchUser(u, { plan: e.target.value }, 'Plan updated')}>
                          <option value="free">Free</option>
                          <option value="pro">Pro</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </td>
                      <td className="px-5 py-3 tabular-nums text-ink">{u.total_jobs ?? 0}</td>
                      <td className="px-5 py-3">
                        <button type="button" onClick={() => patchUser(u, { is_active: !u.is_active }, u.is_active ? 'Account suspended' : 'Account reactivated')} title={u.is_active ? 'Suspend' : 'Reactivate'}>
                          <Badge variant={u.is_active ? 'ok' : 'danger'} dot>{u.is_active ? 'Active' : 'Suspended'}</Badge>
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <button type="button" onClick={() => patchUser(u, { is_admin: !u.is_admin }, 'Permissions updated')} title={u.is_admin ? 'Remove admin' : 'Make admin'}>
                          <Badge variant={u.is_admin ? 'brand' : 'neutral'}>{u.is_admin ? 'Admin' : 'Member'}</Badge>
                        </button>
                      </td>
                      <td className="px-5 py-3 text-ink-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'logs' && (
        <Card padding="none">
          <div className="border-b border-line-subtle px-5 py-4">
            <SectionHeader title="Audit log" description="Most recent events first." />
          </div>
          {loading ? (
            <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 rounded-xl" />)}</div>
          ) : logs.length === 0 ? (
            <EmptyState title="No events yet" className="m-5" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-ink-faint">
                  <tr className="border-b border-line-subtle">
                    <th className="px-5 py-3 font-medium">When</th>
                    <th className="px-5 py-3 font-medium">Who</th>
                    <th className="px-5 py-3 font-medium">Action</th>
                    <th className="px-5 py-3 font-medium">IP</th>
                    <th className="px-5 py-3 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {logs.map((log) => (
                    <tr key={log.id} className="align-top transition-colors hover:bg-veil-1">
                      <td className="whitespace-nowrap px-5 py-3 text-ink-muted">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="px-5 py-3 text-ink">{log.email || 'System'}</td>
                      <td className="px-5 py-3"><Badge variant="neutral" className="font-mono">{log.action}</Badge></td>
                      <td className="px-5 py-3 font-mono text-xs text-ink-muted">{log.ip_address || '—'}</td>
                      <td className="max-w-xs truncate px-5 py-3 font-mono text-xs text-ink-muted" title={JSON.stringify(log.metadata)}>{log.metadata ? JSON.stringify(log.metadata) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </PageWrapper>
  );
}
