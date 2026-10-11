import { useEffect, useRef, useState } from 'react';
import { Monitor, Copy, PhoneOff, ShieldCheck } from 'lucide-react';
import Nav from '../layouts/Nav';

const makeShortPeerId = () => {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = new Uint8Array(10);
  if (window.crypto?.getRandomValues) window.crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, byte => alphabet[byte % alphabet.length]).join('');
};

export default function RemoteDesktop() {
  const localVideo = useRef(null), remoteVideo = useRef(null);
  const peerRef = useRef(null), callRef = useRef(null), streamRef = useRef(null);
  const pendingRef = useRef(null), stoppingRef = useRef(false);
  const [mode, setMode] = useState('idle'), [code, setCode] = useState('');
  const [peerId, setPeerId] = useState(''), [incoming, setIncoming] = useState(false);
  const [connected, setConnected] = useState(false), [status, setStatus] = useState('Not connected');
  const [error, setError] = useState('');

  const stop = () => {
    stoppingRef.current = true;
    callRef.current?.close();
    pendingRef.current?.close();
    peerRef.current?.destroy();
    streamRef.current?.getTracks().forEach(t => t.stop());
    callRef.current = pendingRef.current = peerRef.current = streamRef.current = null;
    if (localVideo.current) localVideo.current.srcObject = null;
    if (remoteVideo.current) remoteVideo.current.srcObject = null;
    setMode('idle'); setPeerId(''); setIncoming(false); setConnected(false);
    setError(''); setStatus('Disconnected — session ended');
  };

  useEffect(() => () => {
    callRef.current?.close();
    pendingRef.current?.close();
    peerRef.current?.destroy();
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const wireCall = (call, incomingCall = false) => {
    callRef.current = call;
    call.on('stream', stream => {
      if (remoteVideo.current) remoteVideo.current.srcObject = stream;
      setConnected(true); setStatus('Connected — screen is live');
    });
    call.on('close', () => {
      setConnected(false);
      if (!stoppingRef.current) setStatus('The other computer disconnected');
      if (remoteVideo.current) remoteVideo.current.srcObject = null;
    });
    call.on('error', err => {
      if (!stoppingRef.current) setError(`Connection failed${err?.type ? ` (${err.type})` : ''}. Check both devices and try a new code.`);
    });
    if (incomingCall) call.answer(streamRef.current);
  };

  const host = async () => {
    stoppingRef.current = false; setError('');
    if (!window.Peer) return setError('Connection library did not load. Refresh and try again.');
    if (!navigator.mediaDevices?.getDisplayMedia) return setError('Screen sharing requires HTTPS and a supported browser.');
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (localVideo.current) localVideo.current.srcObject = stream;
      stream.getVideoTracks()[0]?.addEventListener('ended', stop, { once: true });
      const peer = new window.Peer(makeShortPeerId()); peerRef.current = peer; setMode('host');
      setStatus('Starting connection…');
      peer.on('open', id => { setPeerId(id); setStatus('Ready — waiting for connection'); });
      peer.on('call', call => {
        if (callRef.current || pendingRef.current) return call.close();
        pendingRef.current = call; setIncoming(true); setStatus('Incoming request — approval required');
      });
      peer.on('error', err => setError(err?.type === 'unavailable-id' ? 'That short code is already in use. Stop hosting and start again for a new code.' : `Host setup failed${err?.type ? ` (${err.type})` : ''}. Check the internet connection and refresh if needed.`));
    } catch (err) {
      if (!['NotAllowedError', 'AbortError'].includes(err?.name)) setError('Could not share screen. Check browser permissions.');
    }
  };

  const join = () => {
    stoppingRef.current = false; setError('');
    if (!window.Peer) return setError('Connection library did not load. Refresh and try again.');
    if (!code.trim()) return setError('Enter the host connection code.');
    const peer = new window.Peer(); peerRef.current = peer; setMode('viewer');
    setStatus('Connecting to host…');
    peer.on('open', () => {
      const hostCode = code.trim().toLowerCase();
      const call = peer.call(hostCode);
      if (call) wireCall(call);
      else {
        setError('Could not create the call. Check the host code and try again; if it repeats, the PeerJS signaling service may be unavailable.');
        setStatus('Call could not start');
      }
    });
    peer.on('error', err => {
      if (stoppingRef.current) return;
      const messages = {
        'peer-unavailable': 'Host code not found. Make sure hosting is still active and copy the newest 10-character code.',
        'network': 'PeerJS signaling connection failed. Check internet on both laptops and try again.',
        'server-error': 'PeerJS signaling server error. Wait a moment and retry.',
        'socket-error': 'Could not reach the signaling server. Check internet access and try again.',
        'disconnected': 'Disconnected from the signaling server. Stop and start the connection again.',
      };
      setError(messages[err?.type] || `Connection failed${err?.type ? ` (${err.type})` : ''}. Check the code and both internet connections.`);
    });
  };

  const approve = () => {
    const call = pendingRef.current;
    if (!call || !streamRef.current) return;
    pendingRef.current = null; setIncoming(false); wireCall(call, true);
    setConnected(true); setStatus('Approved — sharing screen');
  };

  const decline = () => {
    pendingRef.current?.close(); pendingRef.current = null;
    setIncoming(false); setStatus('Connection declined');
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(peerId); setStatus('Connection code copied'); }
    catch { setError('Copy was blocked; select the code and copy it manually.'); }
  };

  const panel = 'rounded-2xl border border-white/10 bg-slate-950/70 p-5';
  const button = 'w-full rounded-xl px-4 py-3 text-sm font-semibold';
  return <div className="min-h-screen text-white"><Nav />
    <main className="mx-auto max-w-6xl px-4 py-7 sm:px-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-bold tracking-widest text-cyan-300">DOGEUB CONNECT</p><h1 className="mt-2 text-3xl font-bold">Remote Desktop</h1><p className="mt-2 text-sm text-slate-400">Share a screen with another browser. The host must approve every request.</p></div>
        <span className="flex items-center gap-2 rounded-full border border-emerald-300/20 px-3 py-2 text-xs"><ShieldCheck size={15}/> Approval required</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4"><div><h2 className="font-semibold">{mode === 'viewer' ? 'Remote screen' : 'Your screen'}</h2><p className="mt-1 text-xs text-slate-400">{status}</p></div>
            {mode !== 'idle' && <button onClick={stop} className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-extrabold text-white hover:bg-rose-400"><PhoneOff size={14} className="mr-2 inline"/>EMERGENCY DISCONNECT</button>}
          </header>
          <div className="grid min-h-[300px] place-items-center bg-black/50 p-3">
            <video ref={mode === 'viewer' ? remoteVideo : localVideo} autoPlay playsInline muted={mode !== 'viewer'} className={(connected || (mode === 'host' && streamRef.current) ? 'block' : 'hidden') + ' max-h-[65vh] w-full rounded-xl object-contain'}/>
            {!connected && !(mode === 'host' && streamRef.current) && <div className="p-8 text-center text-slate-400"><Monitor size={32} className="mx-auto mb-3"/><p className="text-sm">Start hosting or enter a connection code.</p></div>}
          </div>
        </section>
        <aside className="space-y-4">
          {mode === 'idle' && <>
            <section className={panel}><h2 className="font-semibold">Share this computer</h2><p className="my-2 text-sm text-slate-400">Select the screen to share, then send the code to your other device.</p><button onClick={host} className={button + ' bg-cyan-200 text-slate-950'}>Start hosting</button></section>
            <section className={panel}><h2 className="font-semibold">Connect to a computer</h2><input value={code} onChange={e => setCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && join()} placeholder="Paste host connection code" className="my-3 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none focus:border-cyan-200/50"/><button onClick={join} className={button + ' border border-white/15 hover:bg-white/10'}>Request connection</button></section>
          </>}
          {mode === 'host' && <section className={panel}><h2 className="font-semibold">Connection code</h2><div className="my-3 flex items-center gap-2 rounded-xl bg-black/30 p-3"><code className="flex-1 break-all text-sm text-cyan-100">{peerId || 'Creating code…'}</code><button onClick={copy} disabled={!peerId} aria-label="Copy code" className="rounded-lg p-2 hover:bg-white/10 disabled:opacity-40"><Copy size={16}/></button></div>
            {incoming && <div className="rounded-xl border border-amber-200/20 p-3"><p className="text-sm">Someone wants to view your screen.</p><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={approve} className="rounded-lg bg-emerald-200 p-2 text-sm font-bold text-slate-950">Approve</button><button onClick={decline} className="rounded-lg border border-white/15 p-2 text-sm">Decline</button></div></div>}
          </section>}
          {mode === 'viewer' && <section className={panel}><p className="text-sm text-slate-300">Request sent. The host must approve before the screen appears.</p><button onClick={stop} className={button + ' mt-3 border border-white/15'}>Cancel request</button></section>}
          {error && <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100">{error}</p>}
        </aside>
      </div>
      <p className="mt-5 text-xs leading-5 text-slate-500">View-only screen sharing: full Windows mouse/keyboard control needs a separately installed host app. Keep this page open on both devices; screen sharing requires HTTPS and internet access. Only share your code with someone you trust.</p>
    </main>
  </div>;
}
