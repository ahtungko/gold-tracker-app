/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_AUTH?: string;
  readonly VITE_APP_ID?: string;
  readonly VITE_OAUTH_PORTAL_URL?: string;
  readonly VITE_APP_TITLE?: string;
  readonly VITE_APP_LOGO?: string;
  readonly VITE_ANALYTICS_ENDPOINT?: string;
  readonly VITE_ANALYTICS_WEBSITE_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
