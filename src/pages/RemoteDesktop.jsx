import { useEffect, useRef, useState } from 'react';
import { Monitor, MonitorUp, ShieldCheck, Square, Wifi, CircleHelp, Copy, Check, AlertTriangle, Link2, PhoneCall, PhoneOff, UserRoundCheck } from 'lucide-react';
import Nav from '../layouts/Nav';

export default function RemoteDesktop() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const callRef = useRef(null);
  const streamRef = useRef(null);
  const [mode, setMode] = useState('idle');
  const [peerId, setPeerId] = useState('');
  const [connectCode, setConnectCode] = useState('');
  const [incomingCall, setIncomingCall] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Not connected');
  const [copied, setCopied] = useState(false);

  useEffect(() => () => {
    callRef.current?.close();
    peerRef.current?.destroy();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const stopSession = () => {
    callRef.current?.close();
    callRef.current = null;
    peerRef.current?.destroy();
    peerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setIncomingCall(null);
    setConnected(false);
    setPeerId('');
    setMode('idle');
    setStatus('Not connected');
  };

  const wireCall = (call, localStream, incoming = false) => {
    callRef.current = call;
    call.on('stream', (remoteStream) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      setConnected(true);
      setStatus('Connected — screen stream is live');
    });
    call.on('close', () => {
      setConnected(false);
      setStatus('Peer disconnected');
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    });
    call.on('error', () => {
      setError('The peer connection failed. Check the code and try again.');
      setConnected(false);
    });
    if (incoming) call.answer(localStream);
  };

  const startHosting = async () => {
    setError('');
    const Peer = window.Peer;
    if (!Peer) { setError('Remote Desktop connection library did not load. Refresh and try again.'); return; }
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setError('Screen sharing requires a supported browser over HTTPS.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      stream.getVideoTracks()[0]?.addEventListener('ended', stopSession, { once: true });
      const peer = new Peer();
      peerRef.current = peer;
      setMode('host');
      setStatus('Starting peer connection…');
      peer.on('open', (id) => {
        setPeerId(id);
        setStatus('Ready — waiting for someone to connect');
      });
      peer.on('call', (call) => {
        setIncomingCall(call);
        setStatus('Incoming connection — approval required');
      });
      peer.on('error', (err) => {
        setError(err?.type === 'unavailable-id' ? 'That connection ID is already in use. Start again.' : 'Could not establish the peer connection. Try again on both devices.');
      });
    } catch (err) {
      if (err?.name !== 'NotAllowedError' && err?.name !== 'AbortError') {
        setError('Could not start hosting. Check screen-sharing permissions and try again.');
      }
    }
  };

  const approveConnection = () => {
    if (!incomingCall || !streamRef.current) return;
    const call = incomingCall;
    setIncomingCall(null);
    wireCall(call, streamRef.current, true);
    setConnected(true);
    setStatus('Connection approved — sending your selected screen');
  };

  const rejectConnection = () => {
    incomingCall?.close();
    setIncomingCall(null);
    setStatus('Connection declined');
  };

  const joinSession = () => {
    setError('');
    const Peer = window.Peer;
    if (!Peer) { setError('Remote Desktop connection library did not load. Refresh and try again.'); return; }
    const id = connectCode.trim();
    if (!id) {
      setError('Enter the host connection code first.');
      return;
    }
    const peer = new Peer();
    peerRef.current = peer;
    setMode('viewer');
    setStatus('Connecting to host…');
    peer.on('open', () => {
      const call = peer.call(id);
      if (!call) {
        setError('Could not start the call. Check the code and try again.');
        return;
      }
      wireCall(call, null, false);
    });
    peer.on('error', (err) => {
      setError(err?.type === 'peer-unavailable' ? 'That host code is offline or incorrect.' : 'Could not connect. Check the code and try again.');
    });
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(peerId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError('Clipboard access was blocked. Select and copy the code manually.');
    }
  };

  return <div className="min-h-screen text-white"><Nav /><main className="mx-auto max-w-7xl px-4 pb-28 pt-7 sm:px-7">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.25em] text-cyan-300">DOGEUB CONNECT</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Remote Desktop</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Share a screen between two browsers using a connection code. The host must approve every incoming connection before the screen is sent.</p></div><span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[.07] px-3 py-2 text-xs text-emerald-100"><ShieldCheck size={15}/> Host approval required</span></div>
    <div className="mt-7 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,.8fr)]">
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/65 shadow-2xl">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-200/15 bg-cyan-200/[.08] text-cyan-100"><MonitorUp size={19}/></span><div><h2 className="font-semibold">{mode === 'viewer' ? 'Remote screen' : 'Your shared screen'}</h2><p className="mt-0.5 text-xs text-slate-500">{status}</p></div></div>{mode !== 'idle' && <button onClick={stopSession} className="inline-flex items-center gap-2 rounded-xl bg-rose-300 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-rose-200"><Square size={14}/> Disconnect</button>}</header>
        <div className="relative grid min-h-[260px] place-items-center bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,.10),transparent_55%),#050914] p-4 sm:min-h-[420px]">
          <video ref={mode === 'viewer' ? remoteVideoRef : localVideoRef} autoPlay playsInline muted={mode !== 'viewer'} className={(connected || (mode === 'host' && !!streamRef.current) ? 'block' : 'hidden') + ' max-h-[65vh] w-full rounded-xl bg-black object-contain'} />
          {!connected && !(mode === 'host' && streamRef.current) && <div className="max-w-sm text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/[.04] text-slate-500"><Monitor size={28}/></div><h3 className="mt-4 text-sm font-semibold">Ready to connect</h3><p className="mt-2 text-xs leading-5 text-slate-500">Start hosting on the computer being shared, or enter its code from the other computer.</p></div>}
          {connected && <span className="absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-slate-950/90 px-3 py-1.5 text-[10px] font-semibold text-emerald-100"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300"/> LIVE CONNECTION</span>}
        </div>
      </section>
      <aside className="space-y-4">
        {mode === 'idle' && <><section className="rounded-3xl border border-white/10 bg-slate-950/65 p-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200"><MonitorUp size={19}/></span><div><h2 className="font-semibold">Share this computer</h2><p className="mt-0.5 text-xs text-slate-500">Host · the computer being viewed</p></div></div><p className="mt-3 text-xs leading-5 text-slate-400">Choose the screen to share. Dogeub will show you a connection code; a viewer can request access, but you must approve them first.</p><button onClick={startHosting} className="mt-4 w-full rounded-xl bg-cyan-200 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-white"><MonitorUp size={15} className="mr-2 inline"/>Start hosting</button></section>
        <section className="rounded-3xl border border-white/10 bg-slate-950/65 p-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-300/10 text-violet-200"><Link2 size={19}/></span><div><h2 className="font-semibold">Connect to a computer</h2><p className="mt-0.5 text-xs text-slate-500">Viewer · enter host code</p></div></div><label className="mt-4 block text-xs text-slate-400">Host connection code<input value={connectCode} onChange={(event) => setConnectCode(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && joinSession()} placeholder="Paste the host's code" className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm text-white outline-none focus:border-cyan-200/40"/></label><button onClick={joinSession} className="mt-3 w-full rounded-xl border border-white/10 bg-white/[.06] px-4 py-3 text-sm font-semibold hover:bg-white/10"><PhoneCall size={15} className="mr-2 inline"/>Request connection</button></section></>}
        {mode === 'host' && <section className="rounded-3xl border border-white/10 bg-slate-950/65 p-5"><h2 className="font-semibold">Share this connection code</h2><p className="mt-1 text-xs leading-5 text-slate-400">Send this code to the person you want to let view your screen.</p><div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Host code</p><div className="mt-2 flex items-center justify-between gap-2"><span className="break-all font-mono text-sm font-bold text-cyan-100">{peerId || 'Creating code…'}</span><button onClick={copyCode} disabled={!peerId} aria-label="Copy connection code" className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10 disabled:opacity-40">{copied ? <Check size={15}/> : <Copy size={15}/>}</button></div></div>{incomingCall && <div className="mt-4 rounded-2xl border border-amber-200/25 bg-amber-100/[.06] p-4"><div className="flex items-center gap-2 text-amber-100"><ShieldCheck size={18}/><h3 className="text-sm font-semibold">Someone wants to connect</h3></div><p className="mt-2 text-xs leading-5 text-slate-400">Only approve if you recognize and trust the person. Your selected screen will be visible to them.</p><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={approveConnection} className="rounded-xl bg-emerald-200 px-3 py-2.5 text-xs font-bold text-slate-950"><UserRoundCheck size={14} className="mr-1 inline"/>Approve</button><button onClick={rejectConnection} className="rounded-xl border border-white/10 px-3 py-2.5 text-xs font-semibold hover:bg-white/10"><PhoneOff size={14} className="mr-1 inline"/>Decline</button></div></div>}</section>}
        {mode === 'viewer' && <section className="rounded-3xl border border-white/10 bg-slate-950/65 p-5"><h2 className="font-semibold">Connection request sent</h2><p className="mt-2 text-xs leading-5 text-slate-400">The host must approve your request. If they decline or don't respond, disconnect and try again later.</p><button onClick={stopSession} className="mt-4 w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/10"><PhoneOff size={15} className="mr-2 inline"/>Cancel request</button></section>}
        {error && <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/[.06] p-3 text-xs leading-5 text-rose-100">{error}</p>}
      </aside>
    </div>
    <section className="mt-5 grid gap-3 sm:grid-cols-3">{[{title:'Approval first',body:'Incoming calls are never answered automatically.'},{title:'Encrypted peer link',body:'WebRTC encrypts media in transit; the signaling provider helps peers connect.'},{title:'View-only for now',body:'This version streams the selected screen but does not send mouse or keyboard input.'}].map((item) => <article key={item.title} className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><h3 className="text-sm font-semibold">{item.title}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{item.body}</p></article>)}</section>
    <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-500"><AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-200"/>This is view-only remote screen sharing, not full mouse/keyboard control. Connection setup uses PeerJS's public signaling service, so availability depends on that third-party service. Only share the code with someone you trust.</div>
    <p className="mt-3 text-xs text-slate-600"><CircleHelp size={13} className="mr-1 inline"/>Both computers need internet access and Dogeub open in a supported browser over HTTPS. The host must keep this page open while sharing.</p>
  </main></div>;
}
