/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly _placeholder?: string
  // Dev-only settings seed, see src/dev-seed.ts.
  readonly VITE_SEED_DEEPGRAM_KEY?: string
  readonly VITE_SEED_LLM_KEY?: string
  readonly VITE_SEED_LLM_PROVIDER?: string
  // Deepgram speech model and language, see .env.
  readonly VITE_STT_MODEL?: string
  readonly VITE_STT_LANGUAGE?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
declare const __APP_VERSION__: string
