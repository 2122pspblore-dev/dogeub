import { useEffect, useRef, useState } from 'react';
import { LockKeyhole, ShieldCheck, Eye, EyeOff } from 'lucide-react';

const PASSWORD_KEY = 'dogeub-password-credential-v1';

function toBase64(bytes) {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return window.btoa(binary);
}

async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const key = await window.crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await window.crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 180000, hash: 'SHA-256' },
    key,
    256,
  );
  return toBase64(new Uint8Array(bits));
}

function readCredential() {
  try {
    const value = window.localStorage.getItem(PASSWORD_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export default function LockScreen() {
  const [credential, setCredential] = useState(readCredential);
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const passwordInputRef = useRef(null);

  useEffect(() => {
    const timer = window.setTimeout(() => passwordInputRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [unlocked, credential]);

  useEffect(() => {
    const lock = () => {
      setUnlocked(false);
      setPassword('');
      setConfirmPassword('');
      setError('');
    };
    const onKeyDown = (event) => {
      const key = event.key.toLowerCase();
      // Escape gives users a keyboard shortcut to return focus to the password box.
      if (key === 'escape') {
        event.preventDefault();
        event.stopPropagation();
        window.setTimeout(() => passwordInputRef.current?.focus(), 0);
        return;
      }
      // Ctrl+L is reserved by many browsers for the address bar, so provide
      // Alt+L and Ctrl+Shift+L as reliable in-page alternatives too.
      const lockShortcut =
        ((event.ctrlKey || event.metaKey) && key === 'l') ||
        (event.altKey && !event.ctrlKey && !event.metaKey && key === 'l') ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && key === 'l');
      if (lockShortcut) {
        event.preventDefault();
        event.stopPropagation();
        lock();
      }
    };
    window.addEventListener('dogeub-lock', lock);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('dogeub-lock', lock);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!password) {
      setError('Enter a password to continue.');
      return;
    }
    if (!credential) {
      if (password.length < 8) {
        setError('Use at least 8 characters for your password.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Those passwords do not match.');
        return;
      }
    }

    setBusy(true);
    try {
      if (!window.crypto?.subtle) {
        setError('Secure password setup is unavailable in this browser. Open DogeUB over HTTPS and try again.');
        return;
      }
      if (!credential) {
        const saltBytes = window.crypto.getRandomValues(new Uint8Array(16));
        const salt = toBase64(saltBytes);
        const hash = await hashPassword(password, salt);
        const saved = { salt, hash, version: 1 };
        window.localStorage.setItem(PASSWORD_KEY, JSON.stringify(saved));
        setCredential(saved);
        setUnlocked(true);
        setPassword('');
        setConfirmPassword('');
      } else {
        const hash = await hashPassword(password, credential.salt);
        if (hash !== credential.hash) {
          setError('Incorrect password. Try again.');
          return;
        }
        setUnlocked(true);
        setPassword('');
        setConfirmPassword('');
      }
    } catch {
      setError('Could not save or verify your password. Check that browser storage is enabled.');
    } finally {
      setBusy(false);
    }
  };

  if (unlocked) return null;

  return (
    <div className="fixed inset-0 z-[20000] flex min-h-screen items-center justify-center overflow-y-auto bg-[#070b14] px-4 py-8 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: 'radial-gradient(circle at 50% 15%, #164e63 0, transparent 42%), radial-gradient(circle at 90% 85%, #312e81 0, transparent 35%)' }} />
      <section role="dialog" aria-modal="true" aria-labelledby="dogeub-lock-title" className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-[#111827]/95 p-7 shadow-2xl backdrop-blur-xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-400/15 text-sky-300">
          {credential ? <LockKeyhole size={27} /> : <ShieldCheck size={27} />}
        </div>
        <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">DogeUB Security</p>
        <h1 id="dogeub-lock-title" className="mt-2 text-center text-2xl font-bold tracking-tight">
          {credential ? 'Welcome back' : 'Create your password'}
        </h1>
        <p className="mt-2 text-center text-sm leading-6 text-white/60">
          {credential
            ? 'DogeUB is locked. Sign in with your password to continue.'
            : 'Set a password for this browser before using DogeUB. You will need it whenever DogeUB locks.'}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <p className="rounded-lg border border-sky-400/20 bg-sky-400/10 px-3 py-2 text-xs leading-5 text-sky-100/80">
            Can't select the password box? Press <kbd className="rounded border border-white/20 px-1.5 py-0.5 font-semibold text-white">Esc</kbd> to focus it, then type.
          </p>
          <label className="block text-xs font-medium text-white/70" htmlFor="dogeub-password">Password</label>
          <div className="flex items-center rounded-xl border border-white/15 bg-black/25 px-3 focus-within:border-sky-400">
            <input
              id="dogeub-password"
              ref={passwordInputRef}
              autoFocus
              tabIndex={0}
              style={{ pointerEvents: "auto", userSelect: "text", WebkitUserSelect: "text" }}
              autoComplete={credential ? 'current-password' : 'new-password'}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={credential ? 'Enter your password' : 'At least 8 characters'}
              className="relative z-10 min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-white/30"
            />
            <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)} className="rounded-lg p-1.5 text-white/50 hover:text-white">
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {!credential && (
            <>
              <label className="block pt-1 text-xs font-medium text-white/70" htmlFor="dogeub-confirm-password">Confirm password</label>
              <input
                id="dogeub-confirm-password"
                tabIndex={0}
                style={{ pointerEvents: "auto", userSelect: "text", WebkitUserSelect: "text" }}
                autoComplete="new-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Type it again"
                className="relative z-10 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-3 text-sm outline-none placeholder:text-white/30 focus:border-sky-400"
              />
            </>
          )}
          {error && <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-xs leading-5 text-red-200">{error}</p>}
          <button disabled={busy} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-wait disabled:opacity-60">
            <LockKeyhole size={16} /> {busy ? 'Please wait…' : credential ? 'Sign in to DogeUB' : 'Create password & continue'}
          </button>
        </form>
        <p className="mt-5 text-center text-[11px] leading-5 text-white/35">This locks the DogeUB page in this browser. It is not a replacement for server-side account security.</p>
      </section>
    </div>
  );
}
