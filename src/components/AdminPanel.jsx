import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowDownToLine, BellRing, Check, ChevronRight, CircleHelp,
  Clock3, Command, Cpu, Database, ExternalLink, Gauge, Globe, LayoutDashboard, LoaderCircle,
  LockKeyhole, MessageSquare, RefreshCw, Search, ShieldAlert, ShieldCheck, UserCheck, UserCog,
  UserRound, UserRoundX, Users, Wrench, X
} from 'lucide-react';

const ADMIN_PANEL_CODE = 'y:LVXjJwM3nQTRU';
const TABS = [
  { id: 'overview', label: 'Overview', icon: Gauge },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'reports', label: 'Reports', icon: ShieldAlert },
  { id: 'site', label: 'Site controls', icon: Globe },
  { id: 'audit', label: 'Audit log', icon: Activity },
];
const QUICK_LINKS = [
  { title: 'Dashboard Studio', path: '/dashboard', icon: LayoutDashboard },
  { title: 'Toolbox', path: '/toolbox', icon: Wrench },
  { title: 'PC Center', path: '/pc-center', icon: Cpu },
  { title: 'Game Library', path: '/game-library', icon: Command },
  { title: 'Student Center', path: '/student-center', icon: UserCheck },
  { title: 'Social Center', path: '/social', icon: Users },
  { title: 'Messages', path: '/messages', icon: MessageSquare },
  { title: 'Settings', path: '/settings', icon: UserCog },
];
async function adminRequest(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  let data = {};
  try { data = await response.json(); } catch {}
  if (!response.ok) {
    const error = new Error(data.error || 'The admin service could not complete that request.');
    error.status = response.status;
    throw error;
  }
  return data;
}
const dateTime = (value) => {
  const date = new Date(value || 0);
  return !value || Number.isNaN(date.getTime()) ? '—' : date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};
const fmt = (value) => new Intl.NumberFormat().format(Number(value) || 0);
function StatCard({ label, value, sub, icon: Icon, accent = 'cyan' }) {
  const tone = accent === 'violet' ? 'text-violet-200 bg-violet-300/10 border-violet-200/15' : accent === 'amber' ? 'text-amber-200 bg-amber-300/10 border-amber-200/15' : accent === 'rose' ? 'text-rose-200 bg-rose-300/10 border-rose-200/15' : 'text-cyan-200 bg-cyan-300/10 border-cyan-200/15';
  return <div className="rounded-2xl border border-white/10 bg-black/15 p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-white/45">{label}</p><p className="mt-2 text-3xl font-bold tabular-nums text-white">{fmt(value)}</p></div><span className={'grid h-10 w-10 place-items-center rounded-xl border ' + tone}><Icon size={18} /></span></div><p className="mt-2 text-xs text-white/40">{sub}</p></div>;
}
function Panel({ title, description, icon: Icon, action, children }) {
  return <section className="rounded-3xl border border-white/10 bg-slate-950/65 p-4 shadow-[0_15px_60px_rgba(0,0,0,.12)] sm:p-6"><div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cyan-200/15 bg-cyan-200/[.07] text-cyan-100"><Icon size={18} /></span><div><h2 className="font-semibold text-white">{title}</h2>{description && <p className="mt-1 max-w-2xl text-xs leading-5 text-white/45">{description}</p>}</div></div>{action}</div>{children}</section>;
}
function Avatar({ user }) {
  return <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white/[.04] font-bold text-cyan-100">{user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : user?.username?.[0]?.toUpperCase() || '?'}</span>;
}
function downloadCsv(rows, filename) {
  const csv = rows.map((row) => row.map((cell) => '"' + String(cell ?? '').replace(/"/g, '""') + '"').join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; anchor.click();
  URL.revokeObjectURL(url);
}
export default function AdminPanel() {
  const [unlocked, setUnlocked] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [tab, setTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [audit, setAudit] = useState([]);
  const [userQuery, setUserQuery] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);
  const [registrationPaused, setRegistrationPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [needsAdminSetup, setNeedsAdminSetup] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadOverview = useCallback(async () => {
    setLoading(true); setError(''); setNeedsAdminSetup(false);
    try {
      const result = await adminRequest('/api/messages/admin/overview');
      setOverview({ ...(result.stats || {}), admin: result.admin || null });
      setAnnouncement(result.siteSettings?.announcement || '');
      setAnnouncementEnabled(Boolean(result.siteSettings?.announcementEnabled));
      setRegistrationPaused(Boolean(result.siteSettings?.registrationPaused));
      const [usersResult, reportsResult, auditResult] = await Promise.all([
        adminRequest('/api/messages/admin/users'),
        adminRequest('/api/messages/admin/reports'),
        adminRequest('/api/messages/admin/audit'),
      ]);
      setUsers(usersResult.users || []);
      setReports(reportsResult.reports || []);
      setAudit(auditResult.entries || []);
      setLastUpdated(Date.now());
    } catch (problem) {
      setError(problem.message || 'Unable to load the admin overview.');
      setNeedsAdminSetup(problem.status === 401 || problem.status === 403);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (unlocked) loadOverview(); }, [unlocked, loadOverview]);
  const runAction = async (key, callback) => {
    setActionBusy(key); setError(''); setNotice('');
    try { await callback(); }
    catch (problem) {
      setError(problem.message || 'The admin action failed.');
      setNeedsAdminSetup(problem.status === 401 || problem.status === 403);
    } finally { setActionBusy(''); }
  };
  const unlock = (event) => {
    event.preventDefault(); setError(''); setNotice('');
    if (passcode === ADMIN_PANEL_CODE) {
      setUnlocked(true); setPasscode(''); setFailedAttempts(0);
      setNotice('Admin interface unlocked for this page session.');
      return;
    }
    const next = failedAttempts + 1;
    setFailedAttempts(next);
    setError(next >= 3 ? 'That code did not match. The panel will remain locked until you reload the Settings page.' : 'Incorrect access code.');
    if (next >= 3) setPasscode('');
  };
  const lock = () => {
    setUnlocked(false); setPasscode(''); setOverview(null); setUsers([]); setReports([]); setAudit([]);
    setNotice('Admin interface locked.');
  };
  const refreshUsers = async (query = userQuery) => {
    const result = await adminRequest('/api/messages/admin/users?q=' + encodeURIComponent(query.trim()));
    setUsers(result.users || []);
  };
  const changeSuspension = (user) => runAction('user:' + user.id, async () => {
    const suspended = !user.isSuspended;
    let reason = '';
    if (suspended) {
      reason = window.prompt('Reason for suspending @' + user.username + ' (shown in the admin audit log):', 'Violation of site rules') || '';
      if (!reason.trim()) { setNotice('Suspension cancelled; a reason is required.'); return; }
      if (!window.confirm('Suspend @' + user.username + '? Their Messages account will be blocked from authenticated API actions.')) return;
    } else if (!window.confirm('Unsuspend @' + user.username + '?')) return;
    await adminRequest('/api/messages/admin/users/status', { method: 'POST', body: JSON.stringify({ userId: user.id, suspended, reason }) });
    await loadOverview();
    setNotice(suspended ? '@' + user.username + ' was suspended.' : '@' + user.username + ' was unsuspended.');
  });
  const reviewReport = (report, action) => runAction('report:' + report.id, async () => {
    if (!window.confirm(action === 'remove-message' ? 'Remove the reported message? This changes the stored message text.' : 'Dismiss this report?')) return;
    await adminRequest('/api/messages/admin/reports/action', { method: 'POST', body: JSON.stringify({ reportId: report.id, action }) });
    await loadOverview();
    setNotice(action === 'dismiss' ? 'Report dismissed.' : 'Reported message removed.');
  });
  const saveSiteControls = (event) => {
    event.preventDefault();
    runAction('settings', async () => {
      const result = await adminRequest('/api/messages/admin/settings', { method: 'PATCH', body: JSON.stringify({ announcement, announcementEnabled, registrationPaused }) });
      setAnnouncement(result.siteSettings?.announcement || '');
      setAnnouncementEnabled(Boolean(result.siteSettings?.announcementEnabled));
      setRegistrationPaused(Boolean(result.siteSettings?.registrationPaused));
      await loadOverview();
      setNotice('Site controls saved.');
    });
  };
  const exportUsers = () => {
    downloadCsv([
      ['Username','Account created','Presence','Suspended','Messages sent','Related reports'],
      ...users.map((user) => [user.username, dateTime(user.createdAt), user.presence, user.isSuspended ? 'Yes' : 'No', user.messageCount, user.reportCount]),
    ], 'dogeub-admin-users.csv');
    setNotice('User list exported as a CSV without passwords, email addresses, or private message content.');
  };
  const filteredUsers = useMemo(() => {
    const query = userQuery.trim().toLowerCase();
    return users.filter((user) => !query || user.username.toLowerCase().includes(query));
  }, [users, userQuery]);
  const openReports = reports.filter((report) => !report.status || report.status === 'open').length;
  const health = [
    { label: 'Browser online', value: navigator.onLine ? 'Connected' : 'Offline', ok: navigator.onLine },
    { label: 'Viewport', value: window.innerWidth + ' × ' + window.innerHeight, ok: true },
    { label: 'Secure context', value: window.isSecureContext ? 'HTTPS / secure' : 'Not secure', ok: window.isSecureContext },
    { label: 'Admin APIs', value: needsAdminSetup ? 'Setup required' : overview ? 'Connected' : 'Not checked', ok: Boolean(overview) && !needsAdminSetup },
  ];

  if (!unlocked) return <div className="flex min-h-full flex-1 items-center justify-center overflow-y-auto bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,.12),transparent_55%)] p-4 sm:p-8">
    <div className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-cyan-200/15 bg-slate-950/90 shadow-[0_0_90px_rgba(8,145,178,.09)]">
      <div className="border-b border-white/10 bg-gradient-to-br from-cyan-300/[.08] via-transparent to-violet-400/[.06] p-6 sm:p-8">
        <div className="mb-5 flex items-center justify-between gap-3"><div className="grid h-14 w-14 place-items-center rounded-2xl border border-cyan-200/20 bg-cyan-200/10 text-cyan-100"><LockKeyhole size={25} /></div><span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[.2em] text-white/40">Restricted area</span></div>
        <p className="text-xs font-bold uppercase tracking-[.25em] text-cyan-200">DOGEUB Control Center</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Admin Panel</h1><p className="mt-3 text-sm leading-6 text-slate-300">A control room for site metrics, account moderation, announcements, and operational tools.</p>
      </div>
      <form onSubmit={unlock} className="p-6 sm:p-8"><label className="block text-sm font-medium text-slate-200">Admin access code<input autoComplete="off" autoCapitalize="off" spellCheck={false} name="dogeub-admin-passcode" type={showPasscode ? 'text' : 'password'} value={passcode} onChange={(event) => setPasscode(event.target.value)} required disabled={failedAttempts >= 3} placeholder="Type your admin code…" className="mt-2 block w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3.5 font-mono tracking-wider text-white outline-none transition focus:border-cyan-200/50 disabled:opacity-40" /></label>
        <label className="mt-3 flex items-center gap-2 text-xs text-slate-400"><input type="checkbox" checked={showPasscode} onChange={(event) => setShowPasscode(event.target.checked)} className="accent-cyan-300" /> Show access code</label>
        {error && <p role="alert" className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/[.06] p-3 text-sm text-rose-100">{error}</p>}
        <button type="submit" disabled={failedAttempts >= 3 || !passcode} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3.5 font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"><LockKeyhole size={16} /> Unlock Admin Panel</button>
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-amber-200/15 bg-amber-200/[.045] p-3 text-xs leading-5 text-amber-100/75"><AlertTriangle size={15} className="mt-0.5 shrink-0" /><p>The code unlocks this interface only. DOGEUB source is public, so the code is not a secure server credential. Account and site changes also require your Messages username to be allowlisted on the server as <code>DOGEUB_ADMIN_USERNAMES</code>.</p></div>
      </form>
    </div>
  </div>;

  return <div className="min-h-full flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,rgba(8,145,178,.09),transparent_35%),radial-gradient(ellipse_at_bottom_left,rgba(124,58,237,.06),transparent_35%)] p-3 text-white sm:p-6 xl:p-8">
    <div className="mx-auto max-w-7xl">
      <header className="mb-5 overflow-hidden rounded-3xl border border-cyan-200/15 bg-slate-950/80">
        <div className="flex flex-wrap items-start justify-between gap-4 bg-gradient-to-r from-cyan-300/[.08] via-transparent to-violet-400/[.07] p-5 sm:p-7">
          <div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.25em] text-cyan-200"><ShieldCheck size={14} /> Administrator workspace</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Control Center<span className="text-cyan-200">.</span></h1><p className="mt-2 text-sm text-white/50">The big switchboard for DOGEUB.</p></div>
          <div className="flex flex-wrap gap-2"><button onClick={() => loadOverview()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 py-2.5 text-xs font-semibold hover:bg-white/[.08] disabled:opacity-50"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh</button><button onClick={lock} className="inline-flex items-center gap-2 rounded-xl border border-rose-200/15 px-3 py-2.5 text-xs font-semibold text-rose-100/80 hover:bg-rose-200/[.05]"><LockKeyhole size={14} /> Lock panel</button></div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-3 text-xs text-white/40 sm:px-7"><span className="inline-flex items-center gap-2"><span className={'h-2 w-2 rounded-full ' + (overview && !needsAdminSetup ? 'bg-emerald-300' : needsAdminSetup ? 'bg-amber-300' : 'bg-slate-500')} />{overview ? 'Server admin connected · @' + (overview.admin?.username || 'admin') : needsAdminSetup ? 'Server admin setup required' : 'Checking server authorization'}</span><span>Last refresh: {dateTime(lastUpdated)}</span></div>
      </header>
      {(error || notice) && <div role={error ? 'alert' : 'status'} className={'mb-4 flex items-start justify-between gap-3 rounded-2xl border p-4 text-sm ' + (error ? 'border-rose-200/20 bg-rose-300/[.06] text-rose-100' : 'border-emerald-200/15 bg-emerald-200/[.04] text-emerald-100')}><span>{error || notice}{needsAdminSetup && <span className="mt-2 block text-xs leading-5 text-rose-100/70">Sign into your DOGEUB Messages account, then configure <code>DOGEUB_ADMIN_USERNAMES</code> on Railway with your exact username. The passcode alone cannot grant server privileges.</span>}</span><button onClick={() => { setError(''); setNotice(''); }} aria-label="Dismiss message"><X size={15} /></button></div>}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">{TABS.map((item) => { const Icon = item.icon; const count = item.id === 'reports' ? openReports : item.id === 'users' && overview ? overview.suspendedUsers : 0; return <button key={item.id} onClick={() => setTab(item.id)} className={'flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ' + (tab === item.id ? 'border-cyan-200/30 bg-cyan-200/[.09] text-white' : 'border-white/10 bg-slate-950/45 text-white/50 hover:text-white')}><Icon size={14} />{item.label}{count > 0 && <span className="rounded-full bg-cyan-200 px-1.5 text-[10px] font-bold text-slate-950">{count}</span>}</button>; })}</div>

      {tab === 'overview' && <>
        {loading && !overview ? <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 p-12 text-sm text-white/50"><LoaderCircle className="animate-spin" size={17} /> Connecting to admin APIs…</div> : overview ? <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Registered users" value={overview.users} sub={fmt(overview.onlineUsers) + ' active in the last 90 seconds'} icon={Users} />
            <StatCard label="Messages stored" value={overview.messages} sub={fmt(overview.directMessages) + ' direct messages'} icon={MessageSquare} accent="violet" />
            <StatCard label="Open reports" value={overview.openReports} sub="Reports waiting for a decision" icon={ShieldAlert} accent={overview.openReports ? 'rose' : 'cyan'} />
            <StatCard label="Suspended accounts" value={overview.suspendedUsers} sub={fmt(overview.groups) + ' groups created' } icon={UserRoundX} accent={overview.suspendedUsers ? 'amber' : 'cyan'} />
            <StatCard label="Friend relationships" value={overview.friendRelationships} sub={fmt(overview.pendingFriendRequests) + ' pending requests'} icon={Users} accent="violet" />
            <StatCard label="Stored attachments" value={overview.attachments} sub="Files referenced in Messages data" icon={Database} />
            <StatCard label="Notifications" value={overview.notifications} sub="Persistent notification records" icon={BellRing} />
            <StatCard label="Group memberships" value={overview.groupMembers} sub="Membership rows in Messages data" icon={Activity} />
          </div>
          <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
            <Panel title="Quick command deck" description="Jump to any DOGEUB control area without hunting through the navigation." icon={Command}><div className="grid gap-2 sm:grid-cols-2">{QUICK_LINKS.map((item) => { const Icon = item.icon; return <a key={item.path} href={item.path} className="group flex items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.025] p-3 transition hover:border-cyan-200/20 hover:bg-cyan-200/[.04]"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[.05] text-cyan-100"><Icon size={16} /></span><span className="flex-1 text-sm font-medium">{item.title}</span><ChevronRight size={14} className="text-white/25 transition group-hover:translate-x-0.5 group-hover:text-cyan-100" /></a>; })}</div></Panel>
            <Panel title="Runtime snapshot" description="Browser-side readings only. This page cannot inspect raw server memory, disk health, or actual GPU temperature." icon={Activity}><div className="space-y-2">{health.map((item) => <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl border border-white/[.06] px-3 py-2.5"><span className="text-xs text-white/50">{item.label}</span><span className="inline-flex items-center gap-2 text-xs"><span className={'h-1.5 w-1.5 rounded-full ' + (item.ok ? 'bg-emerald-300' : 'bg-amber-300')} />{item.value}</span></div>)}<div className="mt-4 rounded-xl border border-white/[.07] bg-white/[.025] p-3 text-xs leading-5 text-white/45"><CircleHelp size={14} className="mr-2 inline text-cyan-200" />Server metrics reflect the persisted DOGEUB Messages store; visitor counts and host CPU/RAM are not available unless separately instrumented on the host.</div></Panel>
          </div>
        </> : <Panel title="Admin authorization needed" description="The UI code was accepted, but server privileges are not enabled for this session." icon={LockKeyhole}><p className="text-sm leading-6 text-white/60">Sign into DOGEUB Messages with your account and configure <code>DOGEUB_ADMIN_USERNAMES</code> on Railway to include your exact username. Only then can this panel read or change admin data.</p><a href="/messages" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-bold text-slate-950">Open Messages <ExternalLink size={14} /></a></Panel>}
      </>}

      {tab === 'users' && <Panel title="Account management" description="Search usernames and suspend/restore account access. Protected administrator accounts cannot be suspended here." icon={Users} action={<button onClick={exportUsers} disabled={!users.length} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10 disabled:opacity-40"><ArrowDownToLine size={14} /> Export CSV</button>}>
        <form onSubmit={(event) => { event.preventDefault(); runAction('users', () => refreshUsers(userQuery)); }} className="mb-4 flex gap-2"><label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-black/15 px-3"><Search size={15} className="text-white/35" /><input value={userQuery} onChange={(event) => setUserQuery(event.target.value)} placeholder="Filter users by username…" className="w-full bg-transparent py-3 text-sm outline-none" /></label><button type="submit" disabled={actionBusy === 'users'} className="rounded-xl bg-cyan-300 px-4 text-sm font-bold text-slate-950 disabled:opacity-40">Search</button></form>
        <div className="space-y-2">{filteredUsers.map((user) => <div key={user.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/[.07] p-3 sm:p-4"><Avatar user={user} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold">@{user.username}</p>{user.isProtectedAdmin && <span className="rounded-full border border-violet-200/20 bg-violet-200/[.07] px-2 py-0.5 text-[9px] uppercase tracking-wider text-violet-100">Protected admin</span>}{user.isSuspended && <span className="rounded-full border border-rose-200/20 bg-rose-200/[.06] px-2 py-0.5 text-[9px] uppercase tracking-wider text-rose-100">Suspended</span>}</div><p className="mt-1 text-[11px] text-white/40">Joined {dateTime(user.createdAt)} · {fmt(user.messageCount)} messages · {fmt(user.reportCount)} related reports</p>{user.isSuspended && user.suspensionReason && <p className="mt-1 text-xs text-rose-100/70">Reason: {user.suspensionReason}</p>}</div>{user.isProtectedAdmin ? <span className="text-[10px] text-violet-100/45">Protected</span> : <button onClick={() => changeSuspension(user)} disabled={Boolean(actionBusy) || loading} className={'rounded-xl border px-3 py-2 text-xs font-semibold disabled:opacity-40 ' + (user.isSuspended ? 'border-emerald-200/15 text-emerald-100 hover:bg-emerald-200/[.05]' : 'border-rose-200/15 text-rose-100 hover:bg-rose-200/[.05]')}>{actionBusy === 'user:' + user.id ? 'Saving…' : user.isSuspended ? 'Restore access' : 'Suspend'}</button>}</div>)}{filteredUsers.length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-7 text-center text-sm text-white/40">{needsAdminSetup ? 'Configure server admin access to load accounts.' : 'No accounts match this filter.'}</p>}</div>
      </Panel>}

      {tab === 'reports' && <Panel title="Report moderation" description="Review a report before dismissing it or removing its message. Actions are recorded in the audit log." icon={ShieldAlert} count={openReports}>
        {reports.map((report) => <article key={report.id} className="mb-3 rounded-2xl border border-white/[.08] p-4 last:mb-0"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold text-white">{report.reason || 'Other'} <span className="ml-2 rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-white/45">{report.status || 'open'}</span></p><p className="mt-1 text-xs text-white/40">Reporter @{report.reporter?.username || 'unknown'} · {dateTime(report.createdAt)}</p></div><span className="text-xs text-white/40">Author @{report.message?.sender?.username || 'unavailable'}</span></div><p className="mt-3 break-words rounded-xl bg-black/20 p-3 text-sm leading-6 text-white/65">{report.message?.text || 'The reported message is unavailable.'}</p>{(!report.status || report.status === 'open') && <div className="mt-3 flex flex-wrap gap-2"><button disabled={Boolean(actionBusy)} onClick={() => reviewReport(report, 'dismiss')} className="rounded-xl border border-white/10 px-3 py-2 text-xs hover:bg-white/10 disabled:opacity-40">Dismiss</button><button disabled={Boolean(actionBusy) || !report.message} onClick={() => reviewReport(report, 'remove-message')} className="rounded-xl border border-rose-200/15 bg-rose-300/[.06] px-3 py-2 text-xs font-semibold text-rose-100 hover:bg-rose-300/[.1] disabled:opacity-40">Remove message</button></div>}</article>)}{reports.length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-7 text-center text-sm text-white/40">No reports loaded.</p>}</Panel>}

      {tab === 'site' && <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,.75fr)]">
        <Panel title="Site-wide announcement" description="Publish a short banner for visitors. Updates are stored by the server." icon={BellRing}><form onSubmit={saveSiteControls}><label className="block text-sm text-white/70">Announcement text <span className="text-white/30">({announcement.length}/300)</span><textarea value={announcement} onChange={(event) => setAnnouncement(event.target.value)} maxLength={300} rows={4} placeholder="Write a maintenance notice, service update, or message for visitors…" className="mt-2 block w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm leading-6 outline-none focus:border-cyan-200/40" /></label><label className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-white/10 p-3"><span><span className="block text-sm font-medium">Publish announcement</span><span className="mt-1 block text-xs text-white/40">Show the message banner across DOGEUB.</span></span><input type="checkbox" checked={announcementEnabled} onChange={(event) => setAnnouncementEnabled(event.target.checked)} disabled={!announcement.trim()} className="h-4 w-4 accent-cyan-300" /></label><label className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-white/10 p-3"><span><span className="block text-sm font-medium">Pause new registrations</span><span className="mt-1 block text-xs text-white/40">Existing accounts remain available; new signup attempts are rejected.</span></span><input type="checkbox" checked={registrationPaused} onChange={(event) => setRegistrationPaused(event.target.checked)} className="h-4 w-4 accent-amber-300" /></label><button type="submit" disabled={Boolean(actionBusy)} className="mt-4 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50">{actionBusy === 'settings' ? 'Saving…' : 'Save site controls'}</button></form></Panel>
        <Panel title="Live preview" description="This is how the global announcement banner will appear." icon={Globe}><div className="rounded-2xl border border-cyan-200/15 bg-cyan-300/[.07] p-4"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-cyan-200"><BellRing size={13} /> DOGEUB announcement</p><p className="mt-2 break-words text-sm leading-6 text-white/80">{announcementEnabled && announcement.trim() ? announcement : 'Your announcement preview will appear here when it is enabled.'}</p><p className="mt-2 text-[10px] text-white/35">{announcementEnabled && announcement.trim() ? 'Preview · ready to publish' : 'Hidden from visitors'}</p></div><p className="mt-4 text-xs leading-5 text-white/40">The public announcement contains only your enabled banner text. Admin account lists and moderation data require server-side authorization.</p></Panel>
      </div>}

      {tab === 'audit' && <Panel title="Admin audit log" description="Recent admin actions: suspensions, restorations, report decisions, and site setting changes." icon={Activity} action={<button onClick={() => runAction('audit', async () => { const result = await adminRequest('/api/messages/admin/audit'); setAudit(result.entries || []); })} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs hover:bg-white/10"><RefreshCw size={13} /> Refresh log</button>}>
        <div className="space-y-2">{audit.map((entry) => <div key={entry.id} className="flex items-start gap-3 rounded-xl border border-white/[.06] p-3"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[.04] text-cyan-200"><Activity size={14} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold">{entry.action}</p><span className="text-[10px] text-white/35">{dateTime(entry.createdAt)}</span></div><p className="mt-1 text-xs text-white/50">By @{entry.actorUsername || 'admin'}{entry.target ? ' · Target: ' + entry.target : ''}</p>{entry.details && <p className="mt-1 break-words text-xs text-white/40">{entry.details}</p>}</div></div>)}{audit.length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-7 text-center text-sm text-white/40">No admin actions have been recorded yet.</p>}</div>
      </Panel>}
      <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[10px] text-white/30"><span className="inline-flex items-center gap-2"><ShieldCheck size={13} /> Protected by the server-side administrator allowlist.</span><span>Admin interface unlocked only in this page session.</span></footer>
    </div>
  </div>;
}
