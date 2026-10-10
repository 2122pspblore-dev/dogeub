import { useEffect, useMemo, useRef, useState } from 'react';
import { FolderOpen, Image as ImageIcon, Power, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, File, Folder, HardDrive, AlertTriangle } from 'lucide-react';

const shell = 'fixed inset-0 z-[13000] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm';
const button = 'inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.06] px-3 py-2 text-sm text-white/85 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40';

export default function DogeDesktopTools() {
  const [tool, setTool] = useState('');
  const [folderName, setFolderName] = useState('');
  const [entries, setEntries] = useState([]);
  const [folderHandle, setFolderHandle] = useState(null);
  const [images, setImages] = useState([]);
  const [imageIndex, setImageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [notice, setNotice] = useState('');
  const inputRef = useRef(null);
  const imageInputRef = useRef(null);
  const imageUrl = useMemo(() => images[imageIndex]?.url || '', [images, imageIndex]);

  useEffect(() => {
    const onOpen = (event) => {
      const next = event?.detail?.tool;
      if (['explorer', 'viewer', 'power'].includes(next)) {
        setNotice('');
        setTool(next);
      }
    };
    window.addEventListener('dogeub-open-desktop-tool', onOpen);
    return () => window.removeEventListener('dogeub-open-desktop-tool', onOpen);
  }, []);

  useEffect(() => () => images.forEach((item) => item.url && URL.revokeObjectURL(item.url)), [images]);

  const readDirectory = async (handle) => {
    const list = [];
    for await (const [name, child] of handle.entries()) {
      list.push({ name, kind: child.kind, handle: child });
    }
    list.sort((a, b) => a.kind !== b.kind ? (a.kind === 'directory' ? -1 : 1) : a.name.localeCompare(b.name));
    setEntries(list);
    setFolderHandle(handle);
    setFolderName(handle.name || 'Selected folder');
  };

  const chooseFolder = async () => {
    if (window.showDirectoryPicker) {
      try { await readDirectory(await window.showDirectoryPicker({ mode: 'read' })); }
      catch (error) { if (error?.name !== 'AbortError') setNotice('Could not open that folder. Try selecting files instead.'); }
    } else inputRef.current?.click();
  };

  const chooseImages = () => imageInputRef.current?.click();
  const loadImages = (files) => {
    const selected = Array.from(files || []).filter((file) => file.type.startsWith('image/'));
    if (!selected.length) { setNotice('Choose one or more image files to view.'); return; }
    setImages((old) => {
      old.forEach((item) => URL.revokeObjectURL(item.url));
      return selected.map((file) => ({ name: file.name, url: URL.createObjectURL(file) }));
    });
    setImageIndex(0);
    setZoom(1);
    setNotice('');
    setTool('viewer');
  };
  const openEntry = async (entry) => {
    if (entry.kind === 'directory') {
      try { await readDirectory(entry.handle); }
      catch { setNotice('This folder could not be read. Select it again to grant access.'); }
      return;
    }
    try {
      const file = await entry.handle.getFile();
      if (file.type.startsWith('image/')) loadImages([file]);
      else setNotice('DogeUB can preview image files here. Other file types can be selected and downloaded/opened with Windows itself.');
    } catch { setNotice('The browser could not read this file.'); }
  };
  const close = () => { setTool(''); setNotice(''); };
  const stepImage = (step) => setImageIndex((index) => (index + step + images.length) % images.length);

  if (!tool) return null;
  return <div className={shell} role="dialog" aria-modal="true" aria-label="DogeUB desktop tools">
    <section className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-cyan-200/20 bg-[#0b1020] text-white shadow-2xl">
      <header className="flex items-center gap-3 border-b border-white/10 bg-gradient-to-r from-cyan-400/10 to-violet-400/10 px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200">
          {tool === 'explorer' ? <FolderOpen/> : tool === 'viewer' ? <ImageIcon/> : <Power/>}
        </div>
        <div className="min-w-0 flex-1"><div className="font-semibold">{tool === 'explorer' ? 'Doge File Explorer' : tool === 'viewer' ? 'Doge Image Viewer' : 'Doge Power'}</div><div className="text-xs text-white/45">DogeUB desktop tools</div></div>
        <button className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white" onClick={close} aria-label="Close"><X size={19}/></button>
      </header>
      <div className="flex flex-wrap gap-2 border-b border-white/10 p-3">
        <button className={button} onClick={() => setTool('explorer')}><FolderOpen size={16}/> File Explorer</button>
        <button className={button} onClick={() => { setTool('viewer'); chooseImages(); }}><ImageIcon size={16}/> Image Viewer</button>
        <button className={button} onClick={() => setTool('power')}><Power size={16}/> Power</button>
      </div>
      {notice && <div className="mx-4 mt-3 rounded-xl border border-amber-300/20 bg-amber-300/[.08] p-3 text-sm text-amber-100/90">{notice}</div>}
      {tool === 'explorer' && <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="mb-4 flex flex-wrap items-center gap-3"><div className="flex-1 text-sm text-white/60"><HardDrive className="mr-2 inline" size={16}/>{folderName || 'No folder selected'}</div><button className={button} onClick={chooseFolder}><FolderOpen size={16}/> Choose folder</button><button className={button} onClick={() => inputRef.current?.click()}><File size={16}/> Choose files</button></div>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(event) => { const files = Array.from(event.target.files || []); setFolderName('Selected files'); setEntries(files.map((file) => ({ name: file.name, kind: 'file', file }))); event.target.value = ''; }} />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {entries.map((entry) => <button key={entry.name} onClick={() => entry.file ? (entry.file.type.startsWith('image/') ? loadImages([entry.file]) : setNotice('This file type is not previewable inside DogeUB.')) : openEntry(entry)} className="flex min-w-0 flex-col items-center gap-2 rounded-xl border border-white/[.08] bg-white/[.035] p-4 text-center hover:border-cyan-300/30 hover:bg-cyan-300/[.06]">
            {entry.kind === 'directory' ? <Folder size={28} className="text-cyan-200"/> : entry.file?.type?.startsWith('image/') ? <ImageIcon size={28} className="text-violet-200"/> : <File size={28} className="text-white/50"/>}
            <span className="w-full break-words text-xs text-white/80">{entry.name}</span>
          </button>)}
        </div>
        {!entries.length && <div className="mx-auto mt-10 max-w-md text-center"><FolderOpen className="mx-auto mb-3 text-cyan-200/70" size={42}/><p className="font-medium">Pick a folder to start browsing</p><p className="mt-2 text-sm text-white/45">DogeUB only sees the files or folders you explicitly select. Browser permissions may limit folder access.</p></div>}
      </div>}
      {tool === 'viewer' && <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2"><button className={button} onClick={chooseImages}><ImageIcon size={16}/> Choose images</button><div className="min-w-0 flex-1 truncate text-sm text-white/55">{images[imageIndex]?.name || 'No image selected'}</div><button className={button} disabled={!images.length} onClick={() => setZoom((value) => Math.max(.25, value - .25))}><ZoomOut size={16}/></button><span className="w-12 text-center text-xs text-white/60">{Math.round(zoom * 100)}%</span><button className={button} disabled={!images.length} onClick={() => setZoom((value) => Math.min(3, value + .25))}><ZoomIn size={16}/></button></div>
        <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => { loadImages(event.target.files); event.target.value = ''; }} />
        <div className="relative flex min-h-[260px] flex-1 items-center justify-center overflow-auto rounded-xl bg-black/35">
          {imageUrl ? <><img src={imageUrl} alt={images[imageIndex]?.name || 'Selected image'} className="max-h-[65vh] max-w-full object-contain transition-transform" style={{ transform: 'scale(' + zoom + ')' }}/>{images.length > 1 && <><button onClick={() => stepImage(-1)} className="absolute left-2 rounded-full bg-black/60 p-3 hover:bg-black/80" aria-label="Previous image"><ChevronLeft/></button><button onClick={() => stepImage(1)} className="absolute right-2 rounded-full bg-black/60 p-3 hover:bg-black/80" aria-label="Next image"><ChevronRight/></button></>}</> : <div className="p-8 text-center text-white/50"><ImageIcon size={44} className="mx-auto mb-3"/><p>Select images from your device to view them here.</p></div>}
        </div>
        <p className="mt-2 text-center text-xs text-white/40">Images are read locally in your browser and are not uploaded by this viewer.</p>
      </div>}
      {tool === 'power' && <div className="flex-1 p-5 sm:p-8">
        <div className="mx-auto max-w-xl rounded-2xl border border-amber-300/20 bg-amber-300/[.06] p-5">
          <AlertTriangle className="mb-3 text-amber-200" size={32}/>
          <h2 className="text-lg font-semibold">Windows power controls need permission outside the browser</h2>
          <p className="mt-2 text-sm leading-6 text-white/65">Because DogeUB runs as a website, it cannot directly shut down or restart your actual Windows PC. A website-only button pretending to do that would be fake. Real shutdown support needs an optional Windows companion app that you install and explicitly authorize.</p>
          <button className={button + ' mt-4'} onClick={() => { setNotice('DogeUB is still running. No Windows shutdown command was sent.'); }}><Power size={16}/> Check shutdown support</button>
        </div>
      </div>}
      <footer className="border-t border-white/10 px-4 py-3 text-xs text-white/35">Local-only file access · You choose what DogeUB can read</footer>
    </section>
  </div>;
}
