/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ID?: string;
  readonly VITE_ENABLE_AUTH?: string;
  readonly VITE_VAPID_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __APP_VERSION__: string;

