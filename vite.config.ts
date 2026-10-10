import { appendFile } from 'node:fs/promises'
import { defineConfig, type Plugin } from 'vite'
import pkg from './package.json' with { type: 'json' }

// Cue dev server. Port 5176 to avoid colliding with Pulse (5174),
// Glance (5175), and any default Vite (5173) when running side by side.
// Receives src/dev-log.ts events from the phone and appends them as JSONL to
// dev-log.local, so a session on real glasses can be read on the dev machine.
function cueDevLog(): Plugin {
  return {
    name: 'cue-dev-log',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__cue-devlog', (req, res) => {
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          void appendFile('dev-log.local', body.replace(/\n/g, ' ') + '\n').catch(() => {})
          res.statusCode = 204
          res.end()
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [cueDevLog()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    host: '0.0.0.0',
    port: 5176,
  },
})
