import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Circle, Download, FolderOpen, Monitor, Square, Video, X } from 'lucide-react';
import { addFile } from '../utils/fileStore';

const stamp = () => new Date().toISOString().replace(/[:.]/g, '-');

export default function Capture() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [stream, setStream] = useState(null);
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState('Choose a screen or window to begin.');
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  useEffect(() => () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const startCapture = async () => {
    setError('');
    setSaved('');
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setError('Screen capture is not supported here. Try the latest Chrome or Edge over HTTPS.');
      return;
    }
    try {
      const next = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true });
      streamRef.current = next;
      setStream(next);
      setStatus('Screen shared. Use Screenshot or Start recording below.');
      next.getVideoTracks()[0]?.addEventListener('ended', () => {
        setStream(null);
        setRecording(false);
        setStatus('Screen sharing stopped.');
      });
    } catch (e) {
      setError(e?.name === 'NotAllowedError' ? 'Screen sharing was cancelled.' : 'Could not start screen sharing. Check browser permissions.');
    }
  };

  const screenshot = async () => {
    const video = videoRef.current;
    if (!video || !stream || !video.videoWidth) {
      setError('Start screen sharing first.');
      return;
    }
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Could not create screenshot.');
      const name = `DogeUB-Screenshot-${stamp()}.png`;
      await addFile(new File([blob], name, { type: 'image/png', lastModified: Date.now() }), 'Screenshots');
      setSaved(`${name} saved to DogeFiler → Screenshots.`);
      setStatus('Screenshot saved.');
    } catch (e) {
      setError(e?.message || 'Could not save screenshot.');
    }
  };

  const startRecording = () => {
    if (!stream) {
      setError('Start screen sharing first.');
      return;
    }
    const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((type) => MediaRecorder.isTypeSupported(type));
    if (!window.MediaRecorder) {
      setError('Screen recording is not supported in this browser.');
      return;
    }
    chunksRef.current = [];
    try {
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data?.size) chunksRef.current.push(event.data); };
      recorder.onerror = () => setError('Recording failed. Try sharing the screen again.');
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' });
        if (!blob.size) {
          setError('No recording data was captured.');
          setRecording(false);
          return;
        }
        const name = `DogeUB-Recording-${stamp()}.webm`;
        try {
          await addFile(new File([blob], name, { type: blob.type, lastModified: Date.now() }), 'Videos');
          setSaved(`${name} saved to DogeFiler → Videos.`);
          setStatus('Recording saved.');
        } catch (e) {
          setError(e?.message || 'Could not save recording.');
        } finally {
          setRecording(false);
          chunksRef.current = [];
        }
      };
      recorder.start(1000);
      setRecording(true);
      setStatus('Recording screen…');
      setError('');
      setSaved('');
    } catch {
      setError('Could not start recording. Try sharing a different screen/window.');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  const stopCapture = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
    setStatus('Screen sharing stopped.');
  };

  return (
    <main className="min-h-screen px-4 pb-28 pt-8 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <button onClick={() => navigate(-1)} className="mb-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"><ArrowLeft size={16} /> Back</button>
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="rounded-2xl bg-sky-400/15 p-3 text-sky-300"><Camera size={28} /></div>
          <div><h1 className="text-3xl font-bold tracking-tight">Doge Capture</h1><p className="mt-1 text-sm text-white/60">Screenshots and screen recording, built into DogeUB</p></div>
        </div>
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-white/70"><Monitor size={17} /> {status}</div>
            {stream && <button onClick={stopCapture} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/10"><X size={15} /> Stop sharing</button>}
          </div>
          <div className="flex aspect-video items-center justify-center bg-black">
            {stream ? <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-contain" /> : <div className="px-6 text-center"><Monitor size={48} className="mx-auto mb-3 text-white/25" /><p className="font-medium text-white/75">Your screen preview appears here</p><p className="mt-1 max-w-md text-sm text-white/40">Your browser will ask which screen, window, or tab you want to share.</p></div>}
          </div>
          <div className="flex flex-wrap gap-3 border-t border-white/10 p-4">
            {!stream ? <button onClick={startCapture} className="inline-flex items-center gap-2 rounded-xl bg-sky-400 px-4 py-3 font-semibold text-slate-950 hover:bg-sky-300"><Monitor size={18} /> Choose screen</button> : <>
              <button onClick={screenshot} disabled={recording} className="inline-flex items-center gap-2 rounded-xl bg-sky-400 px-4 py-3 font-semibold text-slate-950 hover:bg-sky-300 disabled:opacity-40"><Camera size={18} /> Take screenshot</button>
              {!recording ? <button onClick={startRecording} className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-3 font-semibold text-white hover:bg-red-400"><Circle size={17} /> Start recording</button> : <button onClick={stopRecording} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 font-semibold text-red-600 hover:bg-white/90"><Square size={16} fill="currentColor" /> Stop & save recording</button>}
            </>}
            <button onClick={() => navigate('/files')} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-3 font-medium hover:bg-white/10"><FolderOpen size={18} /> Open DogeFiler</button>
          </div>
        </section>
        {error && <p role="alert" className="mt-4 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
        {saved && <p role="status" className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{saved}</p>}
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.035] p-4 text-sm text-white/55"><p className="font-semibold text-white/75">A quick note</p><p className="mt-1">Browser security requires you to choose what to share each time. This captures the screen/window/tab you select—not silently in the background. Audio recording depends on the source and browser. Saved captures stay in this browser’s local DogeFiler storage; export them from there to keep a separate copy.</p></div>
      </div>
    </main>
  );
}
