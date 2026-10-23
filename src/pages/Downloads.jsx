import { useEffect, useMemo, useState } from 'react';
import { Download, FileArchive, Monitor, Laptop, Clock3, ExternalLink, RefreshCw, Search, Package, CheckCircle2 } from 'lucide-react';

const RELEASES = [
  { id: 'windows', name: 'DOGEUB Lite for Windows', detail: 'Windows 10/11 · Installer', file: 'DOGEUB-Lite-Windows-x64.exe', icon: Monitor, url: 'https://github.com/2122pspblore-dev/dogeub/releases/latest' },
  { id: 'linux', name: 'DOGEUB Lite for Chromebook / Linux', detail: 'Linux environment enabled · AppImage / DEB', file: 'DOGEUB-Lite-ChromeOS-Linux-x64.AppImage', icon: Laptop, url: 'https://github.com/2122pspblore-dev/dogeub/releases/latest' },
  { id: 'source', name: 'DOGEUB Lite source code', detail: 'ZIP archive · Developers', file: 'dogeub-source.zip', icon: FileArchive, url: 'https://github.com/2122pspblore-dev/dogeub/archive/refs/heads/main.zip' },
];

const readHistory = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem('dogeub-downloads-history') || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};

const formatDate = (value) => {
  try { return new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  catch { return 'Recently'; }
};

export default function Downloads() {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState(readHistory);
  const [tab, setTab] = useState('available');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const refresh = () => setHistory(readHistory());
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);

  const items = useMemo(() => RELEASES.filter((item) => `${item.name} ${item.detail} ${item.file}`.toLowerCase().includes(query.toLowerCase())), [query]);

  const startDownload = (item) => {
    const entry = { id: `${item.id}-${Date.now()}`, name: item.name, file: item.file, url: item.url, date: new Date().toISOString() };
    const next = [entry, ...readHistory()].slice(0, 50);
    try { localStorage.setItem('dogeub-downloads-history', JSON.stringify(next)); } catch {}
    setHistory(next);
    setNotice(item.id === 'windows' || item.id === 'linux'
      ? 'Opening GitHub Releases. The installer appears there after a release build has been published.'
      : 'Opening the source ZIP download.');
    window.open(item.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-16 pt-8 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-sky-300/20 bg-sky-400/10 text-sky-200"><Download size={28} /></div>
          <div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-[.25em] text-sky-300">DOGEUB OS</p><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Downloads</h1><p className="mt-1 text-sm text-white/55">Download files and find links you opened from DOGEUB.</p></div>
          <button onClick={() => { setHistory(readHistory()); setNotice('Download history refreshed.'); }} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"><RefreshCw size={15} /> Refresh</button>
        </div>

        <div className="mb-6 flex gap-2 border-b border-white/10 pb-3">
          <button onClick={() => setTab('available')} className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === 'available' ? 'bg-sky-400 text-slate-950' : 'text-white/65 hover:bg-white/5'}`}>Available files</button>
          <button onClick={() => setTab('history')} className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === 'history' ? 'bg-sky-400 text-slate-950' : 'text-white/65 hover:bg-white/5'}`}>Opened downloads <span className="ml-1 opacity-70">({history.length})</span></button>
        </div>

        {notice && <div role="status" className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-sky-300/20 bg-sky-300/10 px-4 py-3 text-sm text-sky-100"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss notice" className="text-white/60 hover:text-white">×</button></div>}

        {tab === 'available' ? <>
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.04] px-3 py-2.5"><Search size={18} className="text-white/40" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search files..." className="w-full bg-transparent text-sm outline-none placeholder:text-white/35" aria-label="Search files" /></div>
          <div className="grid gap-3 md:grid-cols-2">
            {items.map((item) => {
              const Icon = item.icon;
              return <section key={item.id} className="flex min-w-0 flex-col rounded-2xl border border-white/10 bg-white/[.035] p-5 transition hover:border-sky-300/30 hover:bg-white/[.055]">
                <div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/5 text-sky-200"><Icon size={22} /></div><div className="min-w-0 flex-1"><h2 className="font-semibold">{item.name}</h2><p className="mt-1 text-xs leading-5 text-white/50">{item.detail}</p></div></div>
                <div className="mt-4 rounded-lg bg-black/20 px-3 py-2 font-mono text-xs text-white/60 break-all">{item.file}</div>
                <button onClick={() => startDownload(item)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-sky-300"><Download size={16} /> {item.id === 'source' ? 'Download source ZIP' : 'Open release downloads'} <ExternalLink size={14} /></button>
              </section>;
            })}
          </div>
          <p className="mt-5 text-xs leading-5 text-white/40">Note: this app records download links opened from DOGEUB. Browser security does not let a website read every file in your device’s Downloads folder. Windows installers and Chromebook/Linux builds will be available once published in GitHub Releases.</p>
        </> : <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.035]">
          {history.length ? <div className="divide-y divide-white/10">{history.map((item) => <div key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-4"><div className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-sky-200"><Package size={20} /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.name}</p><p className="mt-1 break-all text-xs text-white/45">{item.file} · {formatDate(item.date)}</p></div><a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5">Open again <ExternalLink size={13} /></a></div>)}</div> : <div className="flex flex-col items-center px-6 py-14 text-center"><Clock3 size={34} className="text-white/25" /><h2 className="mt-3 font-semibold">Nothing opened yet</h2><p className="mt-1 text-sm text-white/45">Files you open from Available files will show up here.</p><button onClick={() => setTab('available')} className="mt-4 rounded-xl bg-sky-400 px-4 py-2 text-sm font-bold text-slate-950">Browse files</button></div>}
          {history.length > 0 && <div className="border-t border-white/10 px-4 py-3 text-right"><button onClick={() => { try { localStorage.removeItem('dogeub-downloads-history'); } catch {} setHistory([]); setNotice('Opened-download history cleared.'); }} className="text-xs text-white/50 hover:text-white">Clear history</button></div>}
        </section>}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-xs text-white/40"><span><CheckCircle2 size={13} className="mr-1 inline" /> History is stored on this device only</span><a href="/" className="underline decoration-white/25 underline-offset-4 hover:text-white">Back to DOGEUB OS</a></div>
      </div>
    </main>
  );
}
