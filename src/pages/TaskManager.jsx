import { useCallback, useEffect, useMemo, useState } from 'react';
import Nav from '../layouts/Nav';
import { Activity, AppWindow, Gauge, MemoryStick, RefreshCw, Search, X, CircleHelp, Monitor } from 'lucide-react';

const getHeap = () => {
  try {
    const heap = performance?.memory;
    return heap ? { used: Math.round(heap.usedJSHeapSize / 1048576), limit: Math.round(heap.jsHeapSizeLimit / 1048576) } : null;
  } catch {
    return null;
  }
};

const makeRows = () => [
  { id: 'page', name: 'DOGEUB current page', type: 'Website tab', status: 'Running' },
  { id: 'ui', name: 'Dashboard interface', type: 'DOGEUB UI', status: 'Running' },
  { id: 'widgets', name: 'Clock and weather widgets', type: 'Page widgets', status: 'Running' },
];

export default function TaskManager() {
  const [fps, setFps] = useState(null);
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState(makeRows);
  const [memory, setMemory] = useState(getHeap);
  const [lastUpdated, setLastUpdated] = useState(() => new Date());

  const refresh = useCallback(() => {
    setRows((current) => {
      const ended = new Set(current.filter((row) => row.status === 'Ended').map((row) => row.id));
      return makeRows().map((row) => ended.has(row.id) ? { ...row, status: 'Ended' } : row);
    });
    setMemory(getHeap());
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    let rafId;
    let frames = 0;
    let start = performance.now();
    const tick = (time) => {
      frames += 1;
      if (time - start >= 1000) {
        setFps(Math.round((frames * 1000) / (time - start)));
        frames = 0;
        start = time;
        setMemory(getHeap());
        setLastUpdated(new Date());
      }
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  const filtered = useMemo(
    () => rows.filter((row) => row.name.toLowerCase().includes(query.trim().toLowerCase()) || row.type.toLowerCase().includes(query.trim().toLowerCase())),
    [rows, query],
  );

  const endTask = (id) => {
    setRows((current) => current.map((row) => row.id === id ? { ...row, status: 'Ended' } : row));
  };

  return (
    <main className="min-h-screen w-full overflow-x-hidden px-3 pb-28 pt-20 text-white sm:px-6">
      <Nav />
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-xl backdrop-blur sm:p-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200"><Activity size={25} /></span>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold sm:text-3xl">Task Manager</h1>
            <p className="mt-1 text-sm leading-5 text-white/55">DOGEUB page activity and browser performance</p>
          </div>
          <button type="button" onClick={refresh} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm transition hover:bg-white/10">
            <RefreshCw size={15} /> Refresh
          </button>
        </header>

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <section className="min-w-0 rounded-2xl border border-white/10 bg-slate-950/65 p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2 text-emerald-300"><Gauge size={19} /><span className="text-sm text-white/65">Page frame rate</span></div>
            <p className="text-3xl font-bold tabular-nums">{fps === null ? 'Measuring…' : `${fps} FPS`}</p>
            <p className="mt-1 text-xs leading-5 text-white/45">Animation frames for this page only</p>
          </section>
          <section className="min-w-0 rounded-2xl border border-white/10 bg-slate-950/65 p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2 text-violet-300"><MemoryStick size={19} /><span className="text-sm text-white/65">JavaScript heap</span></div>
            <p className="text-3xl font-bold tabular-nums">{memory ? `${memory.used} MB` : 'Unavailable'}</p>
            <p className="mt-1 text-xs leading-5 text-white/45">{memory ? `Browser-reported heap limit: ${memory.limit} MB` : 'This browser does not expose heap usage'}</p>
          </section>
          <section className="min-w-0 rounded-2xl border border-white/10 bg-slate-950/65 p-4 sm:p-5 sm:col-span-2 xl:col-span-1">
            <div className="mb-3 flex items-center gap-2 text-cyan-300"><AppWindow size={19} /><span className="text-sm text-white/65">Tracked page entries</span></div>
            <p className="text-3xl font-bold tabular-nums">{rows.filter((row) => row.status === 'Running').length}<span className="ml-2 text-base font-medium text-white/45">running</span></p>
            <p className="mt-1 text-xs leading-5 text-white/45">Updated {lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })}</p>
          </section>
        </div>

        <section className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 shadow-xl">
          <div className="flex flex-wrap items-center gap-3 border-b border-white/10 p-4">
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold">Page activity</h2>
              <p className="mt-1 text-xs text-white/45">Entries are local to this DOGEUB tab.</p>
            </div>
            <label className="flex min-w-0 w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 sm:w-64">
              <Search size={16} className="shrink-0 text-white/45" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter activity…" aria-label="Filter activity" className="min-w-0 w-full bg-transparent text-sm outline-none placeholder:text-white/35" />
            </label>
          </div>
          <div className="hidden grid-cols-[minmax(0,1fr)_minmax(7rem,0.4fr)_7rem_5rem] gap-3 border-b border-white/10 px-5 py-3 text-xs uppercase tracking-wide text-white/40 sm:grid">
            <span>Activity</span><span>Type</span><span>Status</span><span className="text-right">Action</span>
          </div>
          <div className="divide-y divide-white/5">
            {filtered.map((row) => (
              <div key={row.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(7rem,0.4fr)_7rem_5rem] sm:px-5">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/65"><Monitor size={17} /></span>
                  <div className="min-w-0"><p className="break-words text-sm font-medium">{row.name}</p><p className="mt-1 text-xs text-white/45 sm:hidden">{row.type}</p></div>
                </div>
                <span className="hidden min-w-0 break-words text-sm text-white/55 sm:block">{row.type}</span>
                <span className={`text-xs font-medium ${row.status === 'Running' ? 'text-emerald-300' : 'text-white/35'}`}>{row.status}</span>
                <button type="button" disabled={row.status !== 'Running'} onClick={() => endTask(row.id)} aria-label={`End ${row.name}`} title="Mark this local entry as ended" className="justify-self-end rounded-lg border border-white/10 p-2 text-white/65 transition hover:bg-rose-400/15 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-25"><X size={15} /></button>
              </div>
            ))}
            {filtered.length === 0 && <div className="px-4 py-12 text-center"><Search className="mx-auto mb-3 text-white/30" size={22} /><p className="text-sm text-white/65">No activity matches “{query}”.</p><button type="button" onClick={() => setQuery('')} className="mt-3 text-sm text-cyan-200 hover:text-cyan-100">Clear filter</button></div>}
          </div>
        </section>

        <aside className="mt-4 flex items-start gap-3 rounded-xl border border-amber-300/15 bg-amber-200/[.04] p-4 text-sm leading-6 text-white/60">
          <CircleHelp size={18} className="mt-1 shrink-0 text-amber-200/80" />
          <p><strong className="font-semibold text-white/80">Browser limitation:</strong> websites cannot read whole-PC CPU, RAM, GPU, temperature, other browser tabs, or Windows processes, and cannot terminate other apps. The End button only marks a DOGEUB activity entry as ended; these values are not Windows Task Manager readings.</p>
        </aside>
      </div>
    </main>
  );
}
