import { useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, Button } from '@headlessui/react';
import { useOptions } from '/src/utils/optionsContext';

export const PATCH_LOGS_KEY = 'showPatchLogs';

export const isPatchLogsEnabled = () => {
  try {
    return localStorage.getItem(PATCH_LOGS_KEY) !== 'false';
  } catch {
    return true;
  }
};

const PATCH_DATE = '2026-10-09';

const PATCH_LOGS = [
  'Added homescreen widgets: weather and clock (merged in PR #4).',
  'Quick links updated: Discord, GitHub, YouTube, and Gemini AI (PR #5).',
  'Fixed production crash on startup caused by an EACCES error during npm install; start command changed to "node server.js".',
  'Site domain moved to studylive.up.railway.app.',
  'Added a search engine picker to the home search bar: click the engine icon to switch between Bing, DuckDuckGo, Brave, Yahoo, Startpage, Ecosia, and Kagi (PR #12).',
  'Added a Windows-style taskbar across DogeUB with Start menu, app shortcuts, search, clock/date, and quick-settings panel.',
  'Fixed taskbar search so URL-like input is opened as a website instead of treated as a search query.',
  'Improved floating browser windows so their controls stay above the taskbar.',
  'Made homepage quick-link icons draggable and reorderable.',
  'Added custom site-wide wallpaper uploads from the Start menu; uploaded backgrounds persist after refresh.',
  'Improved wallpaper uploads by resizing and compressing large images before saving, with support for images up to 12 MB.',
  'Applied custom wallpapers directly to the page background for more consistent display across DogeUB.',
  'Changed floating-window creation so opening a new floating browser closes/replaces the previous floating browser window.',
  'Changed the Start menu power button to show a confirmation and then switch DogeUB into a shutdown screen; websites cannot reliably close tabs opened normally by a user.',
  'Added a taskbar device-specs panel showing browser-reported CPU core count, approximate memory when exposed, screen resolution, browser, and platform.',
  'Replaced the volume control in Quick Settings with live battery percentage/charging information and browser-reported network status, connection type, estimated downlink, and latency. Availability depends on browser support.',
  'Added snap layouts for floating windows: left/right halves, four corners, and maximize.',
  'Added save and restore controls for floating browser windows; window details are stored in browser local storage and restored on request.',
  'Added Study Sprint to the homepage: a focus/break timer, saved homework checklist, task progress bar, and completed-session counter.',
  'Added a required DogeUB password screen: first-time password creation, sign-in after reload, Ctrl+L page locking, and password-required shutdown/unlock.',
  'Fixed the Study Sprint production build by simplifying its dynamic theme class expression, which was causing a Vite/esbuild syntax error.',
  'Improved password locking: added Alt+L and Ctrl+Shift+L shortcuts plus a dedicated Lock button in the Start menu, since browsers often reserve Ctrl+L for the address bar.',
  'Fixed password input focus and pointer interaction so the password and confirmation fields can receive typing reliably.',
  'Added an on-screen password-box tip: press Esc to focus the password field.',
  'Added a reminder popup after patch logs explaining how to lock DogeUB with Ctrl+L, plus fallback lock options.',
  'Added a live date/time panel and optional location-based current weather beside the password screen.',
  'Resized the Patch Logs window into a compact square with its own scrollable update list.',
  'Added Doge Hub with a control center, local text-file manager and recycle bin, widgets board, multitasking workspace, sticky notes, and theme customization.'
];

const PatchLogs = () => {
  const { options } = useOptions();
  // Wait until the password screen unlocks before opening modal dialogs.
  // Headless UI's modal focus trap can otherwise make the password inputs inert.
  const [open, setOpen] = useState(false);
  const [showLockWarning, setShowLockWarning] = useState(false);

  useEffect(() => {
    const onUnlocked = () => {
      if (isPatchLogsEnabled()) setOpen(true);
    };
    window.addEventListener('dogeub-unlocked', onUnlocked);
    return () => window.removeEventListener('dogeub-unlocked', onUnlocked);
  }, []);
  const closePatchLogs = () => {
    setOpen(false);
    setShowLockWarning(true);
  };

  return (
    <>
    <Dialog open={open} onClose={closePatchLogs} className="fixed inset-0 bg-black/40 z-50">
      <div className="flex justify-center items-center h-full p-4">
        <DialogPanel
          className="flex aspect-square w-[min(88vw,28rem)] max-h-[85vh] flex-col gap-3 overflow-hidden rounded-xl p-5 shadow-2xl"
          style={{ backgroundColor: options.quickModalBgColor || '#252f3e' }}
        >
          <DialogTitle className="shrink-0 text-[1.1rem] font-medium">Patch Logs</DialogTitle>
          <p className="shrink-0 text-[0.7rem] opacity-70">{PATCH_DATE}</p>
          <ul className="min-h-0 flex-1 list-disc space-y-2 overflow-y-auto pl-5 text-[0.85rem]">
            {PATCH_LOGS.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
          <div className="flex shrink-0 justify-end border-t border-white/10 pt-3">
            <Button
              onClick={closePatchLogs}
              className="cursor-pointer duration-150 hover:opacity-80"
            >
              Close
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
    <Dialog open={showLockWarning} onClose={() => setShowLockWarning(false)} className="fixed inset-0 z-[60] bg-black/50">
      <div className="flex h-full items-center justify-center p-4">
        <DialogPanel
          className="w-full max-w-sm rounded-2xl border border-sky-400/30 p-6 shadow-2xl"
          style={{ backgroundColor: options.quickModalBgColor || '#252f3e' }}
        >
          <DialogTitle className="text-lg font-semibold">Quick tip: Lock DogeUB</DialogTitle>
          <p className="mt-3 text-sm leading-6 opacity-90">
            Press <kbd className="rounded border border-white/30 px-1.5 py-0.5 font-semibold">Ctrl + L</kbd> to lock DogeUB and require your password again.
          </p>
          <p className="mt-2 text-xs leading-5 opacity-70">
            Some browsers reserve Ctrl + L for the address bar. If it doesn't work, use Alt + L, Ctrl + Shift + L, or the Lock button in the Start menu.
          </p>
          <div className="mt-5 flex justify-end">
            <Button
              onClick={() => setShowLockWarning(false)}
              className="cursor-pointer rounded-lg bg-sky-500 px-4 py-2 font-medium text-white hover:bg-sky-400"
            >
              Got it
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
    </>
  );
};

export default PatchLogs;
