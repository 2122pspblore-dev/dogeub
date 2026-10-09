import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AppWindow, BatteryFull, Globe, Home, Search, Settings, Volume2,
  Wifi, X, Youtube, BookOpen, Grid3X3, Power, ChevronUp
} from 'lucide-react';

const apps = [
  { name: 'Home', description: 'DogeUB homepage', icon: Home, path: '/' },
  { name: 'Browser', description: 'Browse the web', icon: Globe, path: '/search' },
  { name: 'Apps', description: 'Explore apps', icon: Grid3X3, path: '/materials' },
  { name: 'Docs', description: 'Games and resources', icon: BookOpen, path: '/docs' },
  { name: 'Settings', description: 'Customize DogeUB', icon: Settings, path: '/settings' },
];

function formatClock(date) {
  return {
    time: date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    date: date.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' }),
  };
}

export default function Taskbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [startOpen, setStartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [clock, setClock] = useState(() => formatClock(new Date()));
  const [trayOpen, setTrayOpen] = useState(false);
  const [startBackground, setStartBackground] = useState(() => {
    try { return window.localStorage.getItem('dogeub-site-background') || ''; } catch { return ''; }
  });

  useEffect(() => {
    const timer = window.setInterval(() => setClock(formatClock(new Date())), 15000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setStartOpen(false);
    setSearchOpen(false);
    setTrayOpen(false);
  }, [location.pathname]);

  const handleBackgroundUpload = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      window.alert('Please choose an image file.');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      window.alert('Please choose an image smaller than 12 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => window.alert('Could not read that image. Please try another one.');
    reader.onload = () => {
      const source = new Image();
      source.onerror = () => window.alert('That image could not be opened. Please try another one.');
      source.onload = () => {
        const scale = Math.min(1, 1920 / source.width, 1080 / source.height);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(source.width * scale));
        canvas.height = Math.max(1, Math.round(source.height * scale));
        const context = canvas.getContext('2d');
        if (!context) {
          window.alert('Your browser could not process that image.');
          return;
        }
        context.drawImage(source, 0, 0, canvas.width, canvas.height);
        const image = canvas.toDataURL('image/jpeg', 0.82);
        try {
          window.localStorage.setItem('dogeub-site-background', image);
          setStartBackground(image);
          window.dispatchEvent(new Event('dogeub-background-change'));
        } catch {
          window.alert('Could not save this image in browser storage. Try another, smaller image.');
        }
      };
      source.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  };

  const clearStartBackground = () => {
    try { window.localStorage.removeItem('dogeub-site-background');
      window.dispatchEvent(new Event('dogeub-background-change')); } catch {}
    setStartBackground('');
  };

  const openApp = (app) => {
    navigate(app.path);
    setStartOpen(false);
    setSearchOpen(false);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    navigate('/search', {
      state: { url: (value.startsWith('http://') || value.startsWith('https://')) ? value : `https://www.bing.com/search?q=${encodeURIComponent(value)}` },
    });
    setQuery('');
    setStartOpen(false);
    setSearchOpen(false);
  };

  return (
    <>
      {(startOpen || searchOpen || trayOpen) && (
        <button
          aria-label="Close taskbar panels"
          className="fixed inset-0 z-[10998] cursor-default"
          onClick={() => { setStartOpen(false); setSearchOpen(false); setTrayOpen(false); }}
        />
      )}

      {startOpen && (
        <section className="fixed bottom-[4.6rem] left-1/2 z-[10999] w-[min(92vw,390px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/15 bg-[#172033]/95 p-4 text-white shadow-2xl backdrop-blur-2xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold"><Grid3X3 size={17} /> Pinned</div>
            <span className="text-xs text-white/50">DogeUB</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {apps.map((app) => {
              const Icon = app.icon;
              return (
                <button key={app.name} onClick={() => openApp(app)} className="flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-xl p-2 text-center hover:bg-white/10">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#243a59] text-sky-200"><Icon size={21} /></span>
                  <span className="text-xs">{app.name}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 border-t border-white/10 pt-3">
            <div className="mb-2 text-xs font-semibold text-white/60">Recommended</div>
            <button onClick={() => openApp(apps[1])} className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-white/10">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/20 text-sky-200"><Globe size={19} /></span>
              <span><span className="block text-sm">Open browser</span><span className="block text-xs text-white/50">Start browsing on DogeUB</span></span>
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium hover:bg-white/15">
              <input type="file" accept="image/*" className="hidden" onChange={handleBackgroundUpload} />
              {startBackground ? "Change site background" : "Upload site background"}
            </label>
            {startBackground && <button onClick={clearStartBackground} className="rounded-lg px-3 py-2 text-xs text-white/70 hover:bg-white/10 hover:text-white">Remove image</button>}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-white/65">
            <span className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/30">D</span> DogeUB user</span>
            <button title="Close Start menu" onClick={() => setStartOpen(false)} className="rounded-lg p-2 hover:bg-white/10"><Power size={16} /></button>
          </div>
        </section>
      )}

      {searchOpen && (
        <form onSubmit={submitSearch} className="fixed bottom-[4.6rem] left-1/2 z-[10999] flex w-[min(92vw,440px)] -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/15 bg-[#172033]/95 p-3 text-white shadow-2xl backdrop-blur-2xl">
          <Search size={18} className="shrink-0 text-sky-300" />
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the web or enter a URL" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/45" />
          <button type="submit" className="rounded-lg bg-sky-500 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-400">Search</button>
          <button type="button" aria-label="Close search" onClick={() => setSearchOpen(false)} className="rounded-lg p-1.5 hover:bg-white/10"><X size={16} /></button>
        </form>
      )}

      {trayOpen && (
        <div className="fixed bottom-[4.6rem] right-3 z-[10999] w-56 rounded-2xl border border-white/15 bg-[#172033]/95 p-4 text-white shadow-2xl backdrop-blur-2xl">
          <div className="mb-3 text-sm font-semibold">Quick settings</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 rounded-xl bg-sky-500/20 p-3"><Wifi size={17} /> Wi-Fi</div>
            <div className="flex items-center gap-2 rounded-xl bg-white/10 p-3"><Volume2 size={17} /> Volume</div>
            <div className="col-span-2 flex items-center gap-2 rounded-xl bg-white/10 p-3"><BatteryFull size={17} /> Battery status unavailable</div>
          </div>
          <p className="mt-3 text-[11px] leading-4 text-white/45">These are visual controls only; DogeUB cannot change your device settings from this panel.</p>
        </div>
      )}

      <nav aria-label="Windows style taskbar" className="fixed inset-x-0 bottom-0 z-[11000] flex h-[58px] items-center justify-center border-t border-white/10 bg-[#101827]/85 px-2 text-white shadow-[0_-8px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl">
        <div className="flex min-w-0 items-center gap-1.5">
          <button aria-label="Start" title="Start" onClick={() => { setStartOpen((v) => !v); setSearchOpen(false); setTrayOpen(false); }} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition hover:bg-white/10 ${startOpen ? 'bg-white/15' : ''}`}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M2 3.5 10.5 2.3v8.2H2V3.5Zm9.5-1.35L22 0.5v10H11.5V2.15ZM2 11.5h8.5v8.2L2 18.5v-7Zm9.5 0H22v10l-10.5-1.65V11.5Z" /></svg>
          </button>
          <button aria-label="Taskbar search" title="Search" onClick={() => { setSearchOpen((v) => !v); setStartOpen(false); setTrayOpen(false); }} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition hover:bg-white/10 ${searchOpen ? 'bg-white/15' : ''}`}><Search size={19} /></button>
          <span className="mx-1 h-7 w-px shrink-0 bg-white/10" />
          {[
            { name: 'Home', icon: Home, path: '/' },
            { name: 'Browser', icon: Globe, path: '/search' },
            { name: 'Apps', icon: Grid3X3, path: '/materials' },
            { name: 'YouTube', icon: Youtube, path: '/search', url: 'https://www.youtube.com' },
          ].map((app) => {
            const Icon = app.icon;
            const active = location.pathname === app.path;
            return <button key={app.name} title={app.name} aria-label={app.name} onClick={() => app.url ? navigate('/search', { state: { url: app.url } }) : navigate(app.path)} className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition hover:bg-white/10 ${active ? 'bg-white/10' : ''}`}><Icon size={20} />{active && <span className="absolute bottom-0.5 h-1 w-4 rounded-full bg-sky-400" />}</button>;
          })}
        </div>

        <div className="absolute right-2 flex h-10 items-center gap-2 rounded-xl px-2 hover:bg-white/10 sm:right-3">
          <button aria-label="Quick settings" title="Quick settings" onClick={() => { setTrayOpen((v) => !v); setStartOpen(false); setSearchOpen(false); }} className="flex items-center gap-1 rounded-lg p-2 hover:bg-white/10">
            <Wifi size={15} className="hidden sm:block" /><Volume2 size={15} className="hidden sm:block" /><ChevronUp size={13} className="hidden md:block" />
          </button>
          <button title={`${clock.time}, ${clock.date}`} onClick={() => { setTrayOpen((v) => !v); setStartOpen(false); setSearchOpen(false); }} className="hidden min-w-[76px] flex-col items-end leading-tight sm:flex">
            <span className="text-xs">{clock.time}</span><span className="mt-0.5 text-[10px] text-white/65">{clock.date}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
