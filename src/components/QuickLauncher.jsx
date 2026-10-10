import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AppWindow, ArrowRight, Command, FileText, Globe, Home, Search, Settings, Zap } from 'lucide-react';

const ITEMS = [
  { name: 'Home', detail: 'Open homepage', icon: Home, run: (navigate) => navigate('/') },
  { name: 'Search the web', detail: 'Search or enter a URL', icon: Globe, run: (navigate, query) => navigate('/search', { state: { url: /^https?:\/\//i.test(query) ? query : 'https://www.bing.com/search?q=' + encodeURIComponent(query || '') } }) },
  { name: 'Task Manager', detail: 'Browser performance and entries', icon: Activity, run: (navigate) => navigate('/task-manager') },
  { name: 'Apps & games', detail: 'Browse the catalog', icon: AppWindow, run: (navigate) => navigate('/materials') },
  { name: 'Settings', detail: 'Customize DOGEUB', icon: Settings, run: (navigate) => navigate('/settings') },
  { name: 'Shortcuts', detail: 'Keyboard shortcuts', icon: FileText, run: (navigate) => navigate('/shortcuts') },
];

export default function QuickLauncher() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const input = useRef(null);
  useEffect(() => {
    const onKey = (event) => {
      if ((event.altKey && event.code === 'Space') || (event.ctrlKey && event.shiftKey && event.code === 'KeyP')) {
        event.preventDefault(); setOpen((value) => !value); setQuery('');
      } else if (event.key === 'Escape') setOpen(false);
    };
    const onOpen = () => { setOpen(true); setQuery(''); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('dogeub-open-quick-launcher', onOpen);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('dogeub-open-quick-launcher', onOpen); };
  }, []);
  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  const matches = ITEMS.filter((item) => (item.name + ' ' + item.detail).toLowerCase().includes(query.toLowerCase()));
  const launch = (item) => { item.run(navigate, query.trim()); setOpen(false); };
  return <>{!open && <button type="button" aria-label="Open Quick Launcher" title="Quick Launcher (Ctrl + Shift + P)" onClick={() => { setOpen(true); setQuery(''); }} className="fixed bottom-20 right-4 z-[12000] flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/30 bg-slate-950/90 text-cyan-200 shadow-lg shadow-cyan-950/40 backdrop-blur-xl hover:bg-cyan-400/15"><Command size={20}/></button>}{open && <div className="fixed inset-0 z-[13000] flex items-start justify-center bg-black/45 px-3 pt-[16vh] backdrop-blur-sm" onMouseDown={(e)=>{if(e.target===e.currentTarget)setOpen(false);}}>
    <section role="dialog" aria-modal="true" aria-label="Quick Launcher" className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/15 bg-[#101827]/95 text-white shadow-2xl shadow-cyan-950/40">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4"><Zap className="text-cyan-300" size={20}/><input ref={input} value={query} onChange={(e)=>setQuery(e.target.value)} onKeyDown={(e)=>{if(e.key==='Enter'){if(matches[0])launch(matches[0]);else ITEMS[1].run(navigate,query.trim());setOpen(false);}}} placeholder="Search apps, settings, or the web…" className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-white/35"/><kbd className="rounded bg-white/10 px-2 py-1 text-[10px] text-white/45">ESC</kbd></div>
      <div className="max-h-[55vh] overflow-y-auto p-2">{matches.map((item)=>{const Icon=item.icon;return <button key={item.name} onClick={()=>launch(item)} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-cyan-300/10"><span className="rounded-lg bg-white/5 p-2 text-cyan-200"><Icon size={18}/></span><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{item.name}</span><span className="block text-xs text-white/45">{item.detail}</span></span><ArrowRight size={15} className="text-white/30"/></button>})}{matches.length===0&&<button onClick={()=>launch(ITEMS[1])} className="w-full rounded-xl px-3 py-4 text-left text-sm hover:bg-white/5"><Search className="mr-2 inline" size={16}/>Search the web for “{query}”</button>}</div>
      <div className="border-t border-white/10 px-4 py-3 text-[10px] text-white/40">Quick Launcher · Ctrl + Shift + P</div>
    </section>
  </div>}</>;
}
