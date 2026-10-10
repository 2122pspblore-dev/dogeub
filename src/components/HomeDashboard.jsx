import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Compass, Focus, Gamepad2, Pause, Play, RotateCcw, Settings2, Sparkles } from 'lucide-react';

const shortcuts = [
  { label: 'Explore apps', detail: 'Find something useful', icon: Compass, path: '/materials' },
  { label: 'Study space', detail: 'Docs and resources', icon: BookOpen, path: '/docs' },
  { label: 'Settings', detail: 'Make it yours', icon: Settings2, path: '/settings' },
  { label: 'Games', detail: 'Jump back in', icon: Gamepad2, path: '/search', url: 'https://www.roblox.com' },
];

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

export default function HomeDashboard() {
  const navigate = useNavigate();
  const [duration, setDuration] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setRunning(false);
          setDone(true);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const reset = (nextDuration = duration) => {
    setRunning(false);
    setDone(false);
    setDuration(nextDuration);
    setRemaining(nextDuration * 60);
  };

  return (
    <section className="mx-auto mt-7 w-full max-w-5xl px-4">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/20 via-slate-900/80 to-cyan-500/10 p-5 shadow-xl shadow-black/10 sm:p-7">
        <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-lg">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
              <Sparkles size={14} /> DOGEUB QUICK SPACE
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Your web, your way.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">Quick-launch your favorite areas or run a focus sprint. Lightweight, no assistant running in the background.</p>
          </div>
          <div className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 md:max-w-[250px]">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300"><Focus size={15} /> Focus sprint</div>
            <div className="text-4xl font-semibold tabular-nums tracking-tight text-white">{formatTime(remaining)}</div>
            <div className="mt-3 flex gap-2">
              {[15, 25, 45].map((minutes) => (
                <button key={minutes} type="button" onClick={() => reset(minutes)} className={`rounded-lg px-3 py-1.5 text-xs transition ${duration === minutes ? 'bg-cyan-300 text-slate-950' : 'bg-white/10 text-slate-200 hover:bg-white/15'}`}>{minutes}m</button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => { setDone(false); setRunning((value) => !value); }} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100">
                {running ? <Pause size={15} /> : <Play size={15} />} {running ? 'Pause' : 'Start'}
              </button>
              <button type="button" aria-label="Reset focus timer" onClick={() => reset()} className="rounded-xl border border-white/15 px-3 text-slate-200 hover:bg-white/10"><RotateCcw size={15} /></button>
            </div>
            {done && <p role="status" className="mt-2 text-xs font-medium text-cyan-200">Sprint complete — nice work!</p>}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {shortcuts.map(({ label, detail, icon: Icon, path, url }, index) => (
          <button key={label} type="button" onClick={() => navigate(path, url ? { state: { url } } : undefined)} className="group rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left transition-colors hover:border-cyan-300/30 hover:bg-cyan-300/[0.07] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
            <span className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${['bg-violet-400/15 text-violet-200','bg-cyan-400/15 text-cyan-200','bg-amber-400/15 text-amber-200','bg-emerald-400/15 text-emerald-200'][index]}`}><Icon size={20} /></span>
            <span className="block text-sm font-semibold text-white">{label}</span>
            <span className="mt-1 block text-xs text-slate-400">{detail}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
