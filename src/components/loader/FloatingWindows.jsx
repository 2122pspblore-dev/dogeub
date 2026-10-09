import { useRef, useState } from 'react';
import { AppWindow, X, Minus, Plus, RotateCw, ExternalLink } from 'lucide-react';
import { process } from '/src/utils/hooks/loader/utils';
import { useOptions } from '/src/utils/optionsContext';
import loaderStore from '/src/utils/hooks/loader/useLoaderStore';

const makeWindow = (title = 'New Window', url = 'https://www.bing.com') => ({
  id: crypto.randomUUID(),
  title,
  minimized: false,
  input: url,
  url: process(url, false, 'auto', 'https://www.bing.com/search?q=') || url,
  x: 48 + Math.round(Math.random() * 80),
  y: 70 + Math.round(Math.random() * 70),
  width: 620,
  height: 430,
  z: Date.now(),
});

export default function FloatingWindows() {
  const { options } = useOptions();
  const activeTab = loaderStore((state) => state.tabs.find((tab) => tab.active));
  const [windows, setWindows] = useState([]);
  const [nextZ, setNextZ] = useState(10);
  const drag = useRef(null);

  const focusWindow = (id) => {
    const z = nextZ + 1;
    setNextZ(z);
    setWindows((items) => items.map((item) => item.id === id ? { ...item, z, minimized: false } : item));
  };
  const addWindow = (url = 'https://www.bing.com', title) => {
    if (windows.length >= 8) return;
    const item = makeWindow(title || (url.includes('bing.com') ? 'Bing' : 'New Window'), url);
    item.z = nextZ + 1;
    setNextZ(item.z);
    setWindows((items) => [...items, item]);
  };
  const update = (id, patch) => setWindows((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  const navigate = (item) => {
    const raw = item.input.trim();
    if (!raw) return;
    const next = process(raw, false, options.prType || 'auto', options.engine || 'https://www.bing.com/search?q=');
    if (next) update(item.id, { url: next, title: raw.startsWith('http') ? new URL(raw).hostname : raw });
  };

  const beginDrag = (e, item) => {
    if (e.target.closest('button, input')) return;
    focusWindow(item.id);
    drag.current = { id: item.id, x: e.clientX, y: e.clientY, left: item.x, top: item.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const moveDrag = (e) => {
    if (!drag.current) return;
    const d = drag.current;
    update(d.id, {
      x: Math.max(0, Math.min(window.innerWidth - 120, d.left + e.clientX - d.x)),
      y: Math.max(0, Math.min(window.innerHeight - 80, d.top + e.clientY - d.y)),
    });
  };

  return (
    <>
      <div className="fixed bottom-[4.5rem] right-4 z-[10000] flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            const currentUrl = activeTab?.url && activeTab.url !== 'tabs://new'
              ? process(activeTab.url, true, options.prType || 'auto', options.engine || 'https://www.bing.com/search?q=')
              : 'https://www.bing.com';
            const currentTitle = activeTab?.url && activeTab.url !== 'tabs://new'
              ? (activeTab.title && activeTab.title !== 'New Tab' ? activeTab.title : 'Current Page')
              : 'Bing';
            addWindow(currentUrl || 'https://www.bing.com', currentTitle);
          }}
          disabled={windows.length >= 8}
          className="flex items-center gap-2 rounded-xl border border-white/15 bg-[#10243b] px-4 py-3 text-sm font-semibold text-white shadow-2xl hover:bg-[#193b5c] disabled:opacity-50"
          title="Open a floating browser window"
        >
          <AppWindow size={17} /> Floating Windows <Plus size={15} />
          {windows.length > 0 && <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs">{windows.length}/8</span>}
        </button>
      </div>
      {windows.length > 0 && (
        <div className="fixed bottom-[4.5rem] left-1/2 z-[10000] flex max-w-[70vw] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-2xl border border-white/15 bg-[#101a2a]/95 p-1.5 text-white shadow-2xl backdrop-blur-xl">
          {windows.map((item) => (
            <button
              key={item.id}
              type="button"
              title={item.minimized ? `Restore ${item.title}` : `Minimize ${item.title}`}
              onClick={() => item.minimized ? focusWindow(item.id) : setWindows((items) => items.map((w) => w.id === item.id ? { ...w, minimized: true } : w))}
              className={`flex max-w-44 min-w-24 items-center gap-2 rounded-xl px-3 py-2 text-xs transition-colors hover:bg-white/10 ${item.minimized ? 'opacity-70' : 'bg-white/10'}`}
            >
              <AppWindow size={14} className="shrink-0" />
              <span className="truncate">{item.title}</span>
            </button>
          ))}
        </div>
      )}
      {windows.map((item) => (
        <section
          key={item.id}
          onPointerDown={() => focusWindow(item.id)}
          className="fixed z-[10001] flex flex-col overflow-hidden rounded-xl border border-white/20 bg-[#0b1220] text-white shadow-2xl"
          style={{ left: item.x, top: item.y, width: item.width, height: item.height, display: item.minimized ? 'none' : 'flex', zIndex: item.z + 10001, resize: 'both', minWidth: 300, minHeight: 220, maxWidth: '95vw', maxHeight: '90vh' }}
        >
          <header
            onPointerDown={(e) => beginDrag(e, item)}
            onPointerMove={moveDrag}
            onPointerUp={() => { drag.current = null; }}
            onPointerCancel={() => { drag.current = null; }}
            className="flex min-h-10 cursor-move items-center gap-2 border-b border-white/10 bg-[#13243a] px-3"
          >
            <AppWindow size={15} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate text-xs font-semibold">{item.title}</span>
            <button title="Minimize window" className="rounded p-1 hover:bg-white/10" onClick={() => setWindows((items) => items.map((w) => w.id === item.id ? { ...w, minimized: true } : w))}><Minus size={14} /></button>
            <button title="Open in a new browser tab" className="rounded p-1 hover:bg-white/10" onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}><ExternalLink size={14} /></button>
            <button title="Close window" className="rounded p-1 hover:bg-red-500/70" onClick={() => setWindows((items) => items.filter((w) => w.id !== item.id))}><X size={15} /></button>
          </header>
          <form
            className="flex shrink-0 items-center gap-1 border-b border-white/10 bg-[#0d1929] p-2"
            onSubmit={(e) => { e.preventDefault(); navigate(item); }}
          >
            <input
              aria-label="Address or search"
              value={item.input}
              onChange={(e) => update(item.id, { input: e.target.value })}
              className="min-w-0 flex-1 rounded-md border border-white/10 bg-[#070d16] px-2 py-1.5 text-xs outline-none focus:border-blue-400"
              placeholder="Search Bing or enter a URL"
            />
            <button type="submit" title="Go" className="rounded-md bg-blue-600 px-2 py-1.5 text-xs hover:bg-blue-500">Go</button>
            <button type="button" title="Reload" className="rounded-md p-1.5 hover:bg-white/10" onClick={() => update(item.id, { url: item.url + (item.url.includes('?') ? '&' : '?') + '_refresh=' + Date.now() })}><RotateCw size={14} /></button>
          </form>
          <iframe
            title={item.title}
            src={item.url}
            className="min-h-0 flex-1 border-0 bg-white"
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-downloads"
            allow="fullscreen; autoplay; clipboard-read; clipboard-write"
          />
        </section>
      ))}
    </>
  );
}
