import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ImagePlus, Upload, Trash2 } from 'lucide-react';
import { useOptions } from '../utils/optionsContext';

const KEY = 'customBackground';
// The button is hidden while browsing a site; the saved background still applies everywhere.
const HIDE_ON = ['/search', '/docs/r'];
// Images are shrunk and compressed before saving, so they fit in localStorage.
const ATTEMPTS = [
  { max: 1920, quality: 0.8 },
  { max: 1280, quality: 0.65 },
  { max: 960, quality: 0.5 },
];
const DATA_URL = /^data:image\/[a-z+.-]+;base64,[A-Za-z0-9+/=]+$/;

const readSaved = () => {
  try {
    const v = localStorage.getItem(KEY) || '';
    return DATA_URL.test(v) ? v : '';
  } catch {
    return '';
  }
};

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file couldn't be read as an image."));
    };
    img.src = url;
  });

const encode = (img, { max, quality }) => {
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
};

const BackgroundPicker = () => {
  const { options } = useOptions();
  const { pathname } = useLocation();
  const [bg, setBg] = useState(readSaved);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [open]);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const { img, url } = await loadImage(file);
      let saved = '';
      try {
        for (const attempt of ATTEMPTS) {
          const dataUrl = encode(img, attempt);
          try {
            localStorage.setItem(KEY, dataUrl);
            saved = dataUrl;
            break;
          } catch {
            // Too big for storage; try a smaller version.
          }
        }
      } finally {
        URL.revokeObjectURL(url);
      }
      if (!saved) throw new Error('That image is too large to save. Try a smaller one.');
      setBg(saved);
      setOpen(false);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
    setBg('');
    setError('');
    setOpen(false);
  };

  const showButton = !HIDE_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const panelBg = options.quickModalBgColor || '#252f3e';
  const textColor = options.siteTextColor || '#a0b0c8';

  return (
    <>
      {bg && (
        <style>{`
          body {
            background-image: url("${bg}") !important;
            background-size: cover !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
            background-attachment: fixed !important;
          }
        `}</style>
      )}

      {showButton && (
        <div ref={wrapRef} className="fixed bottom-4 right-4 z-40">
          {open && (
            <div
              className="absolute bottom-14 right-0 w-56 p-2 rounded-xl shadow-2xl flex flex-col gap-1 text-[0.85rem]"
              style={{ backgroundColor: panelBg, color: textColor }}
            >
              <button
                type="button"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
                className="flex items-center gap-2 px-3 h-9 rounded-lg cursor-pointer hover:bg-[#d4d4d418] disabled:opacity-60"
              >
                <Upload size={16} />
                {busy ? 'Saving...' : 'Choose image'}
              </button>
              {bg && (
                <button
                  type="button"
                  onClick={remove}
                  className="flex items-center gap-2 px-3 h-9 rounded-lg cursor-pointer hover:bg-[#d4d4d418]"
                >
                  <Trash2 size={16} />
                  Remove background
                </button>
              )}
              {error && <p className="px-3 pb-1 text-[0.75rem] text-red-400">{error}</p>}
            </div>
          )}

          <button
            type="button"
            title="Custom background"
            aria-label="Custom background"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="w-11 h-11 rounded-full flex items-center justify-center shadow-xl cursor-pointer duration-150 hover:opacity-80"
            style={{ backgroundColor: panelBg, color: textColor }}
          >
            <ImagePlus size={20} />
          </button>

          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        </div>
      )}
    </>
  );
};

export default BackgroundPicker;
