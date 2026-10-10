import { useEffect, useState } from 'react';
import { Activity, Cpu, HardDrive, MemoryStick, Monitor, Network, RefreshCw } from 'lucide-react';

function Card({ title, value, detail, icon: Icon }) {
  return <section className="rounded-xl border border-white/10 bg-white/[.045] p-4">
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sky-300"><Icon size={15}/>{title}</div>
    <div className="mt-3 break-words text-lg font-bold text-white">{value}</div>
    <p className="mt-2 text-xs leading-relaxed text-white/50">{detail}</p>
  </section>;
}

export default function DeviceManager() {
  const [now, setNow] = useState(() => new Date());
  const [quota, setQuota] = useState('Checking browser storage…');
  const [metrics, setMetrics] = useState([]);

  useEffect(() => {
    let alive = true;
    const refresh = () => {
      setNow(new Date());
      const memory = performance.memory;
      setMetrics([
        { name: 'This page JavaScript heap', value: memory?.usedJSHeapSize ? (memory.usedJSHeapSize / 1048576).toFixed(1) + ' MB used' : 'Not exposed', detail: 'Only this page’s JavaScript memory, not total RAM.' },
        { name: 'JavaScript heap limit', value: memory?.jsHeapSizeLimit ? (memory.jsHeapSizeLimit / 1048576).toFixed(0) + ' MB' : 'Not exposed', detail: 'Browser limit; not installed physical memory.' },
        { name: 'CPU threads', value: navigator.hardwareConcurrency ? String(navigator.hardwareConcurrency) : 'Not exposed', detail: 'Logical processors reported by the browser. CPU utilization is unavailable.' },
        { name: 'Page state', value: document.visibilityState === 'visible' ? 'Active' : 'Background', detail: 'Visibility state of this DogeUB tab.' },
        { name: 'Network', value: navigator.onLine ? 'Online' : 'Offline', detail: navigator.connection?.effectiveType || 'Connection type unavailable' },
        { name: 'Page uptime', value: Math.floor(performance.now() / 1000) + ' seconds', detail: 'Time since this page loaded.' },
      ]);
    };
    refresh();
    const timer = window.setInterval(refresh, 2000);
    navigator.storage?.estimate?.().then(({ usage, quota: total }) => {
      if (alive) setQuota(total ? Math.round(total / 1073741824 * 100) / 100 + ' GB browser quota · ' + Math.round((usage || 0) / 1048576) + ' MB used' : 'Not exposed');
    }).catch(() => { if (alive) setQuota('Not exposed'); });
    return () => { alive = false; window.clearInterval(timer); };
  }, []);

  const browser = navigator.userAgentData?.brands?.map((item) => item.brand + ' ' + item.version).join(', ') || navigator.userAgent;
  const platform = navigator.userAgentData?.platform || navigator.platform || 'Not exposed';
  return <div className="space-y-5 text-white">
    <div><h2 className="text-xl font-bold">Device Specs</h2><p className="mt-1 text-xs text-white/50">Browser-visible details only. Hardware values that websites cannot read are clearly marked.</p></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <Card title="Processor" value={navigator.hardwareConcurrency ? navigator.hardwareConcurrency + ' logical threads' : 'Not exposed'} detail="Exact installed CPU model and current CPU speed are blocked from normal webpages." icon={Cpu}/>
      <Card title="Installed memory" value={navigator.deviceMemory ? 'About ' + navigator.deviceMemory + ' GB browser estimate' : 'Not exposed'} detail="Approximate memory hint, not a verified physical RAM total." icon={MemoryStick}/>
      <Card title="NVMe / storage" value="Physical drive details unavailable" detail="Browser security prevents reading your NVMe model, total capacity, free space, or drive health." icon={HardDrive}/>
      <Card title="Graphics" value="Web graphics available" detail="Exact GPU model and live GPU usage are not reliably exposed to websites." icon={Monitor}/>
      <Card title="Operating system" value={platform} detail="Platform reported by the browser; exact OS build may be hidden." icon={Monitor}/>
      <Card title="Browser" value={browser} detail="Browser-reported identification string." icon={Activity}/>
      <Card title="Screen" value={window.screen.width + ' × ' + window.screen.height} detail={'CSS pixels · device pixel ratio ' + (window.devicePixelRatio || 1) + '×'} icon={Monitor}/>
      <Card title="Website storage" value={quota} detail="Quota for browser-managed site data, not your physical disk size." icon={HardDrive}/>
      <Card title="Network status" value={navigator.onLine ? 'Online' : 'Offline'} detail={'Last updated ' + now.toLocaleTimeString()} icon={Network}/>
    </div>
    <div className="rounded-xl border border-white/10 bg-white/[.035] p-4"><h2 className="text-xl font-bold">Task Manager</h2><p className="mt-1 text-xs text-white/50">Live browser diagnostics refresh every 2 seconds. This is not Windows Task Manager and cannot inspect other tabs or apps.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{metrics.map((item) => <Card key={item.name} title={item.name} value={item.value} detail={item.detail} icon={Activity}/>)}</div>
      <button onClick={() => window.location.reload()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-400 px-3 py-2 text-xs font-bold text-slate-950"><RefreshCw size={14}/>Refresh page metrics</button>
    </div>
    <div className="rounded-xl border border-amber-300/20 bg-amber-300/[.06] p-4"><h3 className="font-semibold text-amber-200">For exact Windows hardware details</h3><p className="mt-2 text-xs leading-relaxed text-white/60">A native helper or a system report supplied by the user is required to show the exact CPU model, NVMe capacity, installed RAM, GPU model, temperatures, and system-wide CPU/RAM usage. DogeUB will not invent these values.</p></div>
  </div>;
}
