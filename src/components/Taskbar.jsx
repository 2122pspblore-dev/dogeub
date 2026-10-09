import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AppWindow, BatteryFull, Globe, Home, Search, Settings, BatteryCharging,
  Wifi, X, Youtube, BookOpen, Grid3X3, Power, ChevronUp, Cpu, LockKeyhole
} from 'lucide-react';

const apps = [
  { name: 'Home', description: 'DogeUB homepage', icon: Home, path: '/' },
  { name: 'Browser', description: 'Browse the web', icon: Globe, path: '/search' },
  { name: 'Apps', description: 'Explore apps', icon: Grid3X3, path: '/materials' },
  { name: 'Docs', description: 'Games and resources', icon: BookOpen, path: '/docs' },
  { name: 'Settings', description: 'Customize DogeUB', icon: Settings, path: '/settings' },
  { name: 'Doge Hub', description: 'Control center, files, widgets, notes and themes', icon: AppWindow, hub: true },
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
  const [battery, setBattery] = useState(null);
  const [network, setNetwork] = useState(() => ({ online: navigator.onLine, type: navigator.connection?.effectiveType || 'Unavailable', downlink: navigator.connection?.downlink, rtt: navigator.connection?.rtt, saveData: navigator.connection?.saveData }));
  const [powerConfirm, setPowerConfirm] = useState(false);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [isShutdown, setIsShutdown] = useState(false);
  const [startBackground, setStartBackground] = useState(() => {
    try { return window.localStorage.getItem('dogeub-site-background') || ''; } catch { return ''; }
  });

  useEffect(() => {
    const timer = window.setInterval(() => setClock(formatClock(new Date())), 15000);
    return () => window.clearInterval(timer);
  }, []);


  useEffect(() => {
    let mounted = true;
    let batteryManager;
    const updateBattery = (manager) => {
      if (mounted) setBattery({ level: Math.round(manager.level * 100), charging: Boolean(manager.charging), chargingTime: manager.chargingTime, dischargingTime: manager.dischargingTime });
    };
    if (typeof navigator.getBattery === 'function') {
      navigator.getBattery().then((manager) => {
        if (!mounted) return;
        batteryManager = manager;
        updateBattery(manager);
        manager.addEventListener('levelchange', () => updateBattery(manager));
        manager.addEventListener('chargingchange', () => updateBattery(manager));
        manager.addEventListener('chargingtimechange', () => updateBattery(manager));
        manager.addEventListener('dischargingtimechange', () => updateBattery(manager));
      }).catch(() => { if (mounted) setBattery(null); });
    }
    const updateNetwork = () => {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      setNetwork({ online: navigator.onLine, type: connection?.effectiveType || 'Unavailable', downlink: connection?.downlink, rtt: connection?.rtt, saveData: connection?.saveData });
    };
    window.addEventListener('online', updateNetwork);
    window.addEventListener('offline', updateNetwork);
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    connection?.addEventListener?.('change', updateNetwork);
    return () => {
      mounted = false;
      window.removeEventListener('online', updateNetwork);
      window.removeEventListener('offline', updateNetwork);
      connection?.removeEventListener?.('change', updateNetwork);
    };
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
    if (app.hub) {
      window.dispatchEvent(new CustomEvent('dogeub-open-hub', { detail: { tab: 'control' } }));
      setStartOpen(false);
      setSearchOpen(false);
      return;
    }
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
      {(startOpen || searchOpen || trayOpen || specsOpen || powerConfirm) && (
        <button
          aria-label="Close taskbar panels"
          className="fixed inset-0 z-[10998] cursor-default"
          onClick={() => { setStartOpen(false); setSearchOpen(false); setTrayOpen(false); setSpecsOpen(false); setPowerConfirm(false); }}
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
            <div className="flex items-center gap-1">
              <button title="Lock DogeUB (Alt+L)" aria-label="Lock DogeUB" onClick={() => { setStartOpen(false); window.dispatchEvent(new Event('dogeub-lock')); }} className="rounded-lg p-2 hover:bg-sky-500/20 hover:text-sky-200"><LockKeyhole size={16} /></button>
              <button title="Power off / close page" onClick={() => setPowerConfirm(true)} className="rounded-lg p-2 hover:bg-red-500/25"><Power size={16} /></button>
            </div>
          </div>
        </section>
      )}


      {powerConfirm && (
        <div role="dialog" aria-modal="true" aria-labelledby="power-confirm-title" className="fixed bottom-[4.6rem] left-1/2 z-[11002] w-[min(92vw,340px)] -translate-x-1/2 rounded-2xl border border-white/15 bg-[#172033]/[.98] p-5 text-white shadow-2xl backdrop-blur-2xl">
          <div className="mb-3 flex items-center gap-3"><span className="rounded-xl bg-red-500/20 p-2 text-red-300"><Power size={20} /></span><div><h2 id="power-confirm-title" className="text-sm font-semibold">Close DogeUB?</h2><p className="mt-1 text-xs text-white/60">DogeUB will shut down and lock. Your password will be required to unlock it again.</p></div></div>
          <div className="flex justify-end gap-2"><button onClick={() => setPowerConfirm(false)} className="rounded-lg px-3 py-2 text-xs hover:bg-white/10">Cancel</button><button onClick={() => { setPowerConfirm(false); setIsShutdown(true); window.dispatchEvent(new Event('dogeub-lock')); }} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold hover:bg-red-500">Shut down & lock</button></div>
          
        </div>
      )}

      {specsOpen && (
        <div className="fixed bottom-[4.6rem] right-3 z-[10999] w-64 rounded-2xl border border-white/15 bg-[#172033]/95 p-4 text-white shadow-2xl backdrop-blur-2xl">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Cpu size={17} className="text-sky-300" /> Device specs</div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between gap-3"><span className="text-white/55">Logical CPU cores</span><b>{navigator.hardwareConcurrency || 'Unknown'}</b></div>
            <div className="flex justify-between gap-3"><span className="text-white/55">Reported memory</span><b>{navigator.deviceMemory ? '~' + navigator.deviceMemory + ' GB' : 'Not exposed'}</b></div>
            <div className="flex justify-between gap-3"><span className="text-white/55">Screen</span><b>{window.screen.width} × {window.screen.height}</b></div>
            <div className="flex justify-between gap-3"><span className="text-white/55">Browser</span><b className="max-w-28 truncate">{navigator.userAgent.includes('Edg/') ? 'Microsoft Edge' : navigator.userAgent.includes('Chrome/') ? 'Chrome' : 'Other'}</b></div>
            <div className="flex justify-between gap-3"><span className="text-white/55">Platform</span><b className="max-w-28 truncate">{navigator.userAgentData?.platform || navigator.platform || 'Unknown'}</b></div>
          </div>
          <p className="mt-3 text-[10px] leading-4 text-white/45">Browser-reported info only. Exact CPU model and total RAM aren't available to websites in most browsers.</p>
        </div>
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
        <div className="fixed bottom-[4.6rem] right-3 z-[10999] w-64 rounded-2xl border border-white/15 bg-[#172033]/95 p-4 text-white shadow-2xl backdrop-blur-2xl">
          <div className="mb-3 text-sm font-semibold">Connection & battery</div>
          <div className="space-y-3 text-xs">
            <div className="rounded-xl bg-white/5 p-3">
              <div className="mb-1 flex items-center gap-2 font-semibold"><BatteryCharging size={16} className="text-sky-300" /> Battery</div>
              {battery ? <>
                <div className="mb-2 flex items-center justify-between"><span className="text-white/60">Charge</span><b>{battery.level}%{battery.charging ? ' · Charging' : ''}</b></div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-sky-400 transition-all" style={{ width: battery.level + '%' }} /></div>
                <p className="mt-2 text-[10px] text-white/50">{battery.charging ? (Number.isFinite(battery.chargingTime) && battery.chargingTime > 0 ? 'About ' + Math.round(battery.chargingTime / 60) + ' min until full' : 'Charging status reported by browser') : (Number.isFinite(battery.dischargingTime) && battery.dischargingTime > 0 ? 'About ' + Math.round(battery.dischargingTime / 60) + ' min remaining' : 'Time remaining unavailable')}</p>
              </> : <p className="text-white/55">Live battery data is not supported by this browser or device.</p>}
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <div className="mb-2 flex items-center gap-2 font-semibold"><Wifi size={16} className={network.online ? 'text-emerald-300' : 'text-red-300'} /> Internet connection</div>
              <div className="flex justify-between gap-3"><span className="text-white/55">Status</span><b className={network.online ? 'text-emerald-300' : 'text-red-300'}>{network.online ? 'Online' : 'Offline'}</b></div>
              <div className="mt-1 flex justify-between gap-3"><span className="text-white/55">Connection type</span><b>{network.type}</b></div>
              <div className="mt-1 flex justify-between gap-3"><span className="text-white/55">Estimated downlink</span><b>{typeof network.downlink === 'number' ? network.downlink + ' Mbps' : 'Unavailable'}</b></div>
              <div className="mt-1 flex justify-between gap-3"><span className="text-white/55">Estimated latency</span><b>{typeof network.rtt === 'number' ? network.rtt + ' ms' : 'Unavailable'}</b></div>
              {network.saveData && <p className="mt-2 text-[10px] text-amber-200">Data saver is enabled.</p>}
            </div>
          </div>
          <p className="mt-3 text-[10px] leading-4 text-white/45">Stats refresh when your browser reports changes. Browsers generally do not expose Wi-Fi name or signal strength to websites.</p>
        </div>
      )}

      {isShutdown && (
        <div className="fixed inset-0 z-[12000] flex flex-col items-center justify-center bg-[#080d18] px-6 text-center text-white">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-300"><Power size={30} /></div>
          <h1 className="text-2xl font-semibold">DogeUB is shut down</h1>
          <p className="mt-2 max-w-sm text-sm text-white/60">DogeUB is off. Sign in with your password first, then turn DogeUB back on.</p>
          <button onClick={() => setIsShutdown(false)} className="mt-6 rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-400">Turn DogeUB back on</button>
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
            { name: 'Doge Hub', icon: AppWindow, hub: true },
            { name: 'YouTube', icon: Youtube, path: '/search', url: 'https://www.youtube.com' },
          ].map((app) => {
            const Icon = app.icon;
            const active = location.pathname === app.path;
            return <button key={app.name} title={app.name} aria-label={app.name} onClick={() => app.hub ? window.dispatchEvent(new CustomEvent('dogeub-open-hub', { detail: { tab: 'control' } })) : app.url ? navigate('/search', { state: { url: app.url } }) : navigate(app.path)} className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition hover:bg-white/10 ${active ? 'bg-white/10' : ''}`}><Icon size={20} />{active && <span className="absolute bottom-0.5 h-1 w-4 rounded-full bg-sky-400" />}</button>;
          })}
        </div>

        <div className="absolute right-2 flex h-10 items-center gap-2 rounded-xl px-2 hover:bg-white/10 sm:right-3">
          <button aria-label="Device specs" title="Device specs" onClick={() => { setSpecsOpen((v) => !v); setTrayOpen(false); setStartOpen(false); setSearchOpen(false); }} className="flex items-center gap-1 rounded-lg p-2 hover:bg-white/10"><Cpu size={15} /></button>
          <button aria-label="Quick settings" title="Quick settings" onClick={() => { setTrayOpen((v) => !v); setSpecsOpen(false); setStartOpen(false); setSearchOpen(false); }} className="flex items-center gap-1 rounded-lg p-2 hover:bg-white/10">
            <Wifi size={15} className="hidden sm:block" /><ChevronUp size={13} className="hidden md:block" />
          </button>
          <button title={`${clock.time}, ${clock.date}`} onClick={() => { setTrayOpen((v) => !v); setSpecsOpen(false); setStartOpen(false); setSearchOpen(false); }} className="hidden min-w-[76px] flex-col items-end leading-tight sm:flex">
            <span className="text-xs">{clock.time}</span><span className="mt-0.5 text-[10px] text-white/65">{clock.date}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
