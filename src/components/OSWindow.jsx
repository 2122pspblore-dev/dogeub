import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Minus, Maximize2, X, LayoutGrid, Monitor } from 'lucide-react';

const TITLES = [
  [/^\/$/, 'DOGEUB Desktop'], [/^\/materials/, 'Apps'], [/^\/docs/, 'Games & Resources'],
  [/^\/search/, 'Browser'], [/^\/settings/, 'Settings'], [/^\/recommended/, 'Recommended'],
  [/^\/files/, 'DogeFiler'], [/^\/shortcuts/, 'Keyboard Shortcuts'], [/^\/messages/, 'Doge Messages'],
  [/^\/dashboard/, 'Dashboard Studio'], [/^\/toolbox/, 'Toolbox'], [/^\/pc-center/, 'PC Center'],
  [/^\/game-library/, 'Game Library'], [/^\/student-center/, 'Student Center'], [/^\/social/, 'Social Center'],
  [/^\/remote-desktop/, 'Remote Desktop'], [/^\/collaboration-center/, 'Collaboration Center'],
  [/^\/office\/word/, 'DOGEUB Writer'], [/^\/office\/sheet/, 'DOGEUB Sheets'],
  [/^\/office\/slides/, 'DOGEUB Slides'], [/^\/office/, 'DOGEUB Office'], [/^\/profile/, 'Profile'],
];
const titleFor = (path) => TITLES.find(([pattern]) => pattern.test(path))?.[1] || 'DOGEUB App';
const readLayout = () => { try { return localStorage.getItem('dogeub-app-layout') || 'taskbar'; } catch { return 'taskbar'; } };

export default function OSWindow({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [snapOpen, setSnapOpen] = useState(false);
  const [layout, setLayout] = useState(readLayout);
  const [position, setPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(null);
  const title = titleFor(location.pathname);

  useEffect(() => {
    const sync = () => setLayout(readLayout());
    window.addEventListener('storage', sync);
    window.addEventListener('dogeub-app-layout-change', sync);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener('dogeub-app-layout-change', sync); };
  }, []);

  const snap = (kind) => {
    const w = window.innerWidth;
    const h = window.innerHeight - 76;
    const halfW = Math.floor(w / 2);
    const halfH = Math.floor(h / 2);
    const layouts = {
      left: { x: 8, y: 8, width: halfW - 12, height: h - 8 },
      right: { x: halfW + 4, y: 8, width: halfW - 12, height: h - 8 },
      topLeft: { x: 8, y: 8, width: halfW - 12, height: halfH - 8 },
      topRight: { x: halfW + 4, y: 8, width: halfW - 12, height: halfH - 8 },
      bottomLeft: { x: 8, y: halfH + 4, width: halfW - 12, height: halfH - 12 },
      bottomRight: { x: halfW + 4, y: halfH + 4, width: halfW - 12, height: halfH - 12 },
      maximize: { x: 0, y: 0, width: w, height: h },
      center: { x: Math.max(8, (w - Math.min(1000, w - 32)) / 2), y: 12, width: Math.min(1000, w - 32), height: Math.min(720, h - 16) },
    };
    setPosition(layouts[kind] || layouts.center);
    setMaximized(kind === 'maximize');
    setSnapOpen(false);
  };
  const beginDrag = (event) => {
    if (event.target.closest('button')) return;
    if (maximized) { setMaximized(false); setPosition({ x: 8, y: 8, width: Math.min(1000, window.innerWidth - 16), height: Math.min(700, window.innerHeight - 90) }); }
    dragRef.current = { x: event.clientX, y: event.clientY, left: position.x || 24, top: position.y || 24 };
    setDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const moveDrag = (event) => {
    if (!dragRef.current) return;
    const d = dragRef.current;
    setPosition((current) => ({ ...current, x: Math.max(0, Math.min(window.innerWidth - 160, d.left + event.clientX - d.x)), y: Math.max(0, Math.min(window.innerHeight - 90, d.top + event.clientY - d.y)) }));
  };
  const endDrag = () => { dragRef.current = null; setDragging(false); };
  const toggleLayout = () => {
    const next = layout === 'taskbar' ? 'desktop' : 'taskbar';
    setLayout(next);
    try { localStorage.setItem('dogeub-app-layout', next); } catch {}
    window.dispatchEvent(new CustomEvent('dogeub-app-layout-change', { detail: { layout: next } }));
  };

  if (minimized) return <button className="dogeub-window-restore" onClick={() => setMinimized(false)} title={'Restore ' + title}><Monitor size={15}/><span>{title}</span></button>;

  return <section className={'dogeub-os-window' + (maximized ? ' is-maximized' : '') + (dragging ? ' is-dragging' : '')}
    data-dogeub-os-window="true"
    style={maximized ? undefined : { left: position.x || undefined, top: position.y || undefined, width: position.width || undefined, height: position.height || undefined }}
    onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
    <header className="dogeub-window-titlebar" onPointerDown={beginDrag} aria-label={title + ' window title bar'}>
      <div className="dogeub-window-traffic">
        <button className="dogeub-window-control close" aria-label="Close window" title="Close" onClick={() => navigate('/')}><X size={11}/></button>
        <button className="dogeub-window-control minimize" aria-label="Minimize window" title="Minimize" onClick={() => setMinimized(true)}><Minus size={11}/></button>
        <button className="dogeub-window-control maximize" aria-label="Maximize window" title="Maximize / restore" onClick={() => { if (maximized) { setMaximized(false); setPosition({ x: 24, y: 24, width: 0, height: 0 }); } else snap('maximize'); }}><Maximize2 size={10}/></button>
      </div>
      <span className="dogeub-window-title">{title}</span>
      <div className="dogeub-window-actions">
        <button title={layout === 'taskbar' ? 'Switch to desktop app icons' : 'Switch to taskbar app layout'} aria-label="Toggle app layout" onClick={toggleLayout}><Monitor size={14}/></button>
        <div className="dogeub-snap-wrap">
          <button title="Snap layouts" aria-label="Open snap layouts" onClick={() => setSnapOpen((value) => !value)}><LayoutGrid size={14}/></button>
          {snapOpen && <div className="dogeub-snap-menu">
            {[['left','Left half'],['right','Right half'],['topLeft','Top left'],['topRight','Top right'],['bottomLeft','Bottom left'],['bottomRight','Bottom right'],['center','Centered'],['maximize','Full screen']].map(([key,label]) => <button key={key} onClick={() => snap(key)}>{label}</button>)}
          </div>}
        </div>
      </div>
    </header>
    <div className="dogeub-window-content">{children}</div>
  </section>;
}
