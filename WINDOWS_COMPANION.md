# DogeUB Windows companion (experimental)

This optional local helper lets DogeUB request a small set of Windows actions. It does **not** run arbitrary commands or provide unrestricted computer access.

## Run it
1. Install Node.js 20 or newer from the official Node.js website.
2. Download `windows-companion.js` from this repository.
3. Open a terminal in that folder and run `node windows-companion.js`.
4. Keep the terminal open while using DogeUB.

The helper binds only to `127.0.0.1` (your own computer), checks the browser Origin, and allows only Explorer, Notepad, Calculator, Paint, Task Manager, shutdown, restart, and cancel-shutdown. Shutdown/restart should always be confirmed in the DogeUB interface and schedule the action 30 seconds ahead so it can be cancelled.

## Security boundaries
- Do not expose port 32145 to your network or the internet.
- This is not a general-purpose remote-control server. Arbitrary shell commands, file deletion, passwords, and account access are intentionally unsupported.
- Browser security policies may block requests to localhost from the hosted website; if so, the UI must report that the companion is unavailable rather than claiming success.
- The website must still be updated and the companion must be running locally. This file alone does not enable Windows control on the live site.
