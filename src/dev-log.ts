// Dev-only log forwarding. The plugin runs inside the Even app's WebView on
// a phone, where nobody can read the console. Under the Vite dev server we
// POST structured events back to it; vite.config.ts appends them as JSONL to
// dev-log.local (gitignored) on the dev machine. No-op in tests and in
// production builds.
//
// The log contains conversation transcripts. It never leaves the dev machine.

export function devLog(kind: string, data: unknown): void {
  if (import.meta.env.MODE !== 'development') return
  try {
    void fetch('/__cue-devlog', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ t: new Date().toISOString(), kind, data }),
      keepalive: true,
    }).catch(() => { /* dev server gone — nothing useful to do */ })
  } catch { /* ignore */ }
}
