/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "1" when building the static website (no server, so no written feedback). */
  readonly VITE_STATIC_SITE?: string;
}
