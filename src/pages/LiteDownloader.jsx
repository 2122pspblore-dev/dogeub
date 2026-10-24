import { useEffect, useState } from 'react';
import { Download, FileCode2, ShieldCheck, ExternalLink, AlertCircle } from 'lucide-react';
import { DOGEUB_LITE_HTML_GZIP_BASE64 } from '../data/dogeubLitePayload';

export default function LiteDownloader() {
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let objectUrl = '';

    const prepareFile = async () => {
      try {
        if (typeof window.DecompressionStream !== 'function') {
          throw new Error('This browser does not support the built-in file unpacker. Please use an up-to-date Chrome browser.');
        }

        const binary = window.atob(DOGEUB_LITE_HTML_GZIP_BASE64);
        const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
        const compressed = new Blob([bytes], { type: 'application/gzip' });
        const unpackedStream = compressed.stream().pipeThrough(new window.DecompressionStream('gzip'));
        const htmlBlob = await new Response(unpackedStream).blob();

        if (htmlBlob.size < 10000 || htmlBlob.type && htmlBlob.type !== 'text/html') {
          throw new Error('The bundled HTML did not pass its file-size check. Reload DOGEUB and try again.');
        }

        objectUrl = URL.createObjectURL(new Blob([htmlBlob], { type: 'text/html;charset=utf-8' }));
        setDownloadUrl(objectUrl);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Could not prepare the download.');
      }
    };

    prepareFile();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  const preventUntilReady = (event) => {
    if (!downloadUrl) event.preventDefault();
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-16 pt-8 text-white sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-sky-300/20 bg-sky-400/10 text-sky-200">
            <Download size={28} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.25em] text-sky-300">DOGEUB OS</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">DOGEUB Lite Downloader</h1>
            <p className="mt-1 text-sm text-white/55">A portable HTML file for your Chromebook or computer.</p>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/[.035] p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/5 text-sky-200">
              <FileCode2 size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold">DOGEUB_Lite.html</h2>
              <p className="mt-1 text-sm leading-6 text-white/55">Standalone HTML · No installer · One file</p>
              <p className="mt-3 text-sm leading-6 text-white/70">Click the filename or the download button. Your browser will save the HTML file to Downloads.</p>
              <a
                href={downloadUrl || undefined}
                download="DOGEUB_Lite.html"
                onClick={preventUntilReady}
                aria-disabled={!downloadUrl}
                className={`mt-4 inline-flex break-all items-center gap-2 underline decoration-sky-300/60 underline-offset-4 ${downloadUrl ? 'text-sky-200 hover:text-sky-100' : 'cursor-wait text-white/40'}`}
              >
                <FileCode2 size={16} />
                {downloadUrl ? 'DOGEUB_Lite.html — download file' : 'Preparing DOGEUB_Lite.html…'}
              </a>
              <div className="mt-4">
                <a
                  href={downloadUrl || undefined}
                  download="DOGEUB_Lite.html"
                  onClick={preventUntilReady}
                  aria-disabled={!downloadUrl}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${downloadUrl ? 'bg-sky-400 text-slate-950 hover:bg-sky-300' : 'cursor-wait bg-white/10 text-white/45'}`}
                >
                  <Download size={16} />
                  {downloadUrl ? 'Download HTML' : 'Preparing download…'}
                </a>
              </div>
            </div>
          </div>

          {error && (
            <div role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <ShieldCheck size={18} className="mb-2 text-emerald-300" />
              <p className="text-sm font-semibold">What you're downloading</p>
              <p className="mt-1 text-xs leading-5 text-white/50">The portable DOGEUB Lite HTML bundled with this version of the app.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <ExternalLink size={18} className="mb-2 text-sky-200" />
              <p className="text-sm font-semibold">How to open it</p>
              <p className="mt-1 text-xs leading-5 text-white/50">Open Files → Downloads, then open DOGEUB_Lite.html with Chrome.</p>
            </div>
          </div>
        </section>

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-white/40">
          <span>Downloads directly from this page; no external link required.</span>
          <a href="/" className="underline decoration-white/25 underline-offset-4 hover:text-white">Back to DOGEUB OS</a>
        </footer>
      </div>
    </main>
  );
}
