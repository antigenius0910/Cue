// Dev-only settings seed. Typing two API keys and a long system prompt on
// a phone keyboard is miserable, so when running under the Vite dev server
// (QR sideload) we copy them from files on the dev machine into the same
// storage the settings page writes to:
//
//   .env.development.local      VITE_SEED_DEEPGRAM_KEY, VITE_SEED_LLM_KEY,
//                               VITE_SEED_LLM_PROVIDER (anthropic | openai)
//   prompts/conflict-coach.txt  the Custom-mode system prompt, plain text
//
// The env file is gitignored (*.local) and only read by `vite dev`, so
// `npm run build` / `npm run pack` never bake keys into the bundle. The
// prompt is tracked: it is the product, and its history is worth keeping.
// A seed that is present overwrites what's on the phone every load, which
// makes "edit the prompt on the Mac, let the phone reload" the iteration loop.

import { setCustomPrompt, setDirectKeys, setMode } from './storage'

const promptFiles = import.meta.glob<string>('../prompts/conflict-coach.txt', {
  query: '?raw',
  import: 'default',
  eager: true,
})

export async function applyDevSeed(): Promise<void> {
  // MODE rather than DEV: vitest also sets DEV, and tests must not pick up
  // whatever happens to be in the developer's local seed files.
  if (import.meta.env.MODE !== 'development') return

  const deepgramKey = (import.meta.env.VITE_SEED_DEEPGRAM_KEY ?? '').trim()
  const llmKey = (import.meta.env.VITE_SEED_LLM_KEY ?? '').trim()
  if (deepgramKey && llmKey) {
    const llmProvider = import.meta.env.VITE_SEED_LLM_PROVIDER === 'openai' ? 'openai' : 'anthropic'
    await setDirectKeys({ deepgramKey, llmProvider, llmKey })
    // eslint-disable-next-line no-console
    console.log('[cue:dev-seed] provider keys seeded from .env.development.local')
  }

  const prompt = (Object.values(promptFiles)[0] ?? '').trim()
  if (prompt) {
    await setCustomPrompt(prompt)
    await setMode('custom')
    // eslint-disable-next-line no-console
    console.log('[cue:dev-seed] custom prompt seeded from prompts/conflict-coach.txt')
  }
}
