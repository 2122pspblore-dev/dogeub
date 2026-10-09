import { useState } from 'react';
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
];

const PatchLogs = () => {
  const { options } = useOptions();
  // Read once per page load; closing only hides the panel for this session.
  const [open, setOpen] = useState(isPatchLogsEnabled);

  return (
    <Dialog open={open} onClose={() => setOpen(false)} className="fixed inset-0 bg-black/40 z-50">
      <div className="flex justify-center items-center h-full p-4">
        <DialogPanel
          className="w-[30rem] max-w-full max-h-full overflow-y-auto p-5 rounded-xl flex flex-col gap-3 shadow-2xl"
          style={{ backgroundColor: options.quickModalBgColor || '#252f3e' }}
        >
          <DialogTitle className="text-[1.1rem] font-medium">Patch Logs</DialogTitle>
          <p className="text-[0.7rem] opacity-70">{PATCH_DATE}</p>
          <ul className="list-disc pl-5 flex flex-col gap-2 text-[0.85rem]">
            {PATCH_LOGS.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
          <div className="flex justify-end mt-2">
            <Button
              onClick={() => setOpen(false)}
              className="cursor-pointer duration-150 hover:opacity-80"
            >
              Close
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default PatchLogs;
