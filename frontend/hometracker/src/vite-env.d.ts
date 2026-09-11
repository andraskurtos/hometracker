/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend origin override. Empty/undefined = same origin (default). */
  readonly VITE_API_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
