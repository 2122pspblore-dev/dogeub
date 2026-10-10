import { useEffect, useState } from 'react';
import Nav from '../layouts/Nav';
import { Activity, AppWindow, Cpu, Gauge, MemoryStick, RefreshCw, Search, X } from 'lucide-react';

export default function TaskManager() {
  const [fps, setFps] = useState(0);
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState(() => [{ id: 'page', name: 'DOGEUB current tab', type: 'Browser tab', status: 'Running' }]);
  const [memory, setMemory] = useState(() => performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null);
  useEffect(() => {
    let id, frames = 0, start = performance.now();
    const tick = (time) => {
      frames++;
      if (time - start >= 1000) {
        setFps(Math.round(frames * 1000 / (time - start)));
        frames = 0; start = time;
        setMemory(performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null);
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);
  const filtered = rows.filter((row) => row.name.toLowerCase().includes(query.toLowerCase()));
  const endTask = (id) => setRows((current) => current.map((row) => row.id === id ? { ...row, status: 'Ended' } : row));
  return <main className="min-h-screen px-4 pb-24 pt-20 text-white">
    <Nav />
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center gap-3"><span className="rounded-2xl bg-cyan-400/15 p-3 text-cyan-200"><Activity size={25}/></span><div><h1 className="text-3xl font-bold">Task Manager</h1><p className="text-sm text-white/55">DOGEUB browser activity · not Windows Task Manager</p></div><button onClick={() => { setRows([{ id: 'page', name: 'DOGEUB current tab', type: 'Browser tab', status: 'Running' }]); setQuery(''); }} className="ml-auto inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"><RefreshCw size={15}/> Refresh</button></div>
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {[{label:'Page frame rate',value:fps+' FPS',icon:Gauge},{label:'JavaScript heap',value:memory === null ? 'Unavailable' : memory+' MB',icon:MemoryStick},{label:'Visible entries',value:String(rows.length),icon:AppWindow}].map(({label,value,icon:Icon})=><div key={label} className="rounded-2xl border border-white/10 bg-slate-950/65 p-4"><Icon className="mb-3 text-cyan-300" size={19}/><div className="text-2xl font-bold">{value}</div><div className="mt-1 text-xs text-white/50">{label}</div></div>)}
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/65">
        <div className="flex items-center gap-2 border-b border-white/10 p-3"><Search size={17} className="text-white/45"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Filter entries..." className="min-w-0 flex-1 bg-transparent text-sm outline-none"/></div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 border-b border-white/10 px-4 py-3 text-xs text-white/45"><span>Name</span><span>Status</span><span>Action</span></div>
        {filtered.map((row)=><div key={row.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-white/5 px-4 py-4 last:border-0"><div className="min-w-0"><div className="truncate text-sm font-medium">{row.name}</div><div className="mt-1 text-xs text-white/45">{row.type}</div></div><span className={'text-xs '+(row.status==='Running'?'text-emerald-300':'text-white/35')}>{row.status}</span><button disabled={row.status!=='Running'} onClick={()=>endTask(row.id)} title="Mark this DOGEUB entry ended" className="rounded-lg border border-white/10 p-2 text-white/70 hover:bg-rose-400/15 hover:text-rose-200 disabled:opacity-30"><X size={15}/></button></div>)}
        {filtered.length===0&&<p className="p-6 text-center text-sm text-white/45">No matching entries.</p>}
      </div>
      <p className="mt-4 text-xs leading-5 text-white/45">Browsers do not expose system-wide processes or allow websites to terminate other apps. The End action only marks this local DOGEUB entry as ended; it does not close Windows apps or browser tabs.</p>
    </div>
  </main>;
}
