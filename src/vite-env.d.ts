/// <reference types="vite/client" />

declare var pendo: any;

interface ImportMetaEnv {
  /** Anthropic API key for the Agent Chat feature (src/chat). Set in .env, never committed. */
  readonly VITE_ANTHROPIC_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
