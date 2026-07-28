/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GAME_CAPTURE_DOWNLOAD_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __SCRIMSTATS_RELEASE__: string;
