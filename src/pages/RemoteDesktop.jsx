import { useEffect, useRef, useState } from 'react';
import { Monitor, MonitorUp, ShieldCheck, Square, Wifi, CircleHelp, ExternalLink, Copy, Check, AlertTriangle } from 'lucide-react';
import Nav from '../layouts/Nav';

export default function RemoteDesktop() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [sessionName, setSessionName] = useState('My device');
  const [sessionCode] = useState(() => Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase());

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const startPreview = async () => {
    setError('');
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setError('Screen sharing is unavailable in this browser or context. Use a supported browser over HTTPS.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      stream.getVideoTracks()[0]?.addEventListener('ended', stopPreview, { once: true });
      setSharing(true);
    } catch (err) {
      if (err?.name !== 'NotAllowedError' && err?.name !== 'AbortError') {
        setError('Could not start screen preview. Check browser permissions and try again.');
      }
    }
  };

  const stopPreview = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setSharing(false);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(sessionCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Clipboard access was blocked. You can select and copy the code manually.');
    }
  };

  return <div className="min-h-screen text-white"><Nav /><main className="mx-auto max-w-7xl px-4 pb-28 pt-7 sm:px-7">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.25em] text-cyan-300">DOGEUB CONNECT</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Remote Desktop</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">A secure starting point for device sharing. Preview your screen locally and manage the connection details for a future paired session.</p></div><span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[.07] px-3 py-2 text-xs text-emerald-100"><ShieldCheck size={15}/> Consent-first sharing</span></div>
    <div className="mt-7 grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,.8fr)]">
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/65 shadow-2xl">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-200/15 bg-cyan-200/[.08] text-cyan-100"><MonitorUp size={19}/></span><div><h2 className="font-semibold">Screen preview</h2><p className="mt-0.5 text-xs text-slate-500">{sharing ? 'Your selected screen is being shared to this preview' : 'Nothing is being captured yet'}</p></div></div>{sharing ? <button onClick={stopPreview} className="inline-flex items-center gap-2 rounded-xl bg-rose-300 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-rose-200"><Square size={14}/> Stop sharing</button> : <button onClick={startPreview} className="inline-flex items-center gap-2 rounded-xl bg-cyan-200 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-white"><Monitor size={15}/> Share my screen</button>}</header>
        <div className="relative grid min-h-[260px] place-items-center bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,.10),transparent_55%),#050914] p-4 sm:min-h-[420px]">
          <video ref={videoRef} autoPlay playsInline muted className={(sharing ? 'block' : 'hidden') + ' max-h-[65vh] w-full rounded-xl bg-black object-contain'} />
          {!sharing && <div className="max-w-sm text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/[.04] text-slate-500"><Monitor size={28}/></div><h3 className="mt-4 text-sm font-semibold">Ready when you are</h3><p className="mt-2 text-xs leading-5 text-slate-500">Choose a screen or window in your browser's permission prompt. You can stop sharing here or through the browser's own sharing controls.</p></div>}
          {sharing && <span className="absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-full border border-rose-300/20 bg-slate-950/90 px-3 py-1.5 text-[10px] font-semibold text-rose-100"><span className="h-2 w-2 animate-pulse rounded-full bg-rose-300"/> SCREEN SHARE ACTIVE</span>}
        </div>
      </section>
      <aside className="space-y-4">
        <section className="rounded-3xl border border-white/10 bg-slate-950/65 p-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-300/10 text-violet-200"><Wifi size={19}/></span><div><h2 className="font-semibold">Connection setup</h2><p className="mt-0.5 text-xs text-slate-500">This browser session</p></div></div>
          <label className="mt-5 block text-xs text-slate-400">Device label<input value={sessionName} onChange={(event) => setSessionName(event.target.value.slice(0, 40))} maxLength={40} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm text-white outline-none focus:border-cyan-200/40"/></label>
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Local setup code</p><div className="mt-2 flex items-center justify-between gap-2"><span className="font-mono text-xl font-bold tracking-[.16em] text-cyan-100">{sessionCode}</span><button onClick={copyCode} aria-label="Copy setup code" className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10">{copied ? <Check size={15}/> : <Copy size={15}/>}</button></div><p className="mt-2 text-[10px] leading-4 text-slate-500">This is a local demo code only. It does not connect another device.</p></div>
          {error && <p role="alert" className="mt-3 rounded-xl border border-rose-300/20 bg-rose-300/[.06] p-3 text-xs leading-5 text-rose-100">{error}</p>}
        </section>
        <section className="rounded-3xl border border-amber-200/15 bg-amber-100/[.035] p-5"><div className="flex items-start gap-3"><AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-200"/><div><h3 className="text-sm font-semibold text-amber-100">Remote connection is not enabled yet</h3><p className="mt-2 text-xs leading-5 text-slate-400">Actual device-to-device access needs an authenticated signaling service and a paired host agent. This app does not expose mouse/keyboard control or allow anyone to connect silently.</p></div></div></section>
      </aside>
    </div>
    <section className="mt-5 grid gap-3 sm:grid-cols-3">{[{title:'Explicit approval',body:'The browser asks you to choose what to share.'},{title:'Visible sharing state',body:'A clear active indicator and stop button stay available.'},{title:'No silent access',body:'This MVP cannot control your computer or accept incoming connections.'}].map((item) => <article key={item.title} className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><h3 className="text-sm font-semibold">{item.title}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{item.body}</p></article>)}</section>
    <p className="mt-5 text-xs text-slate-600"><CircleHelp size={13} className="mr-1 inline"/> Screen capture requires a supported browser and a secure context such as HTTPS or localhost.</p>
  </main></div>;
}
