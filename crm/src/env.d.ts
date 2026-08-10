/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /**
     * Set once per request by src/middleware.ts. Null only on the routes the
     * middleware allowlists (login, the OAuth endpoints, cron) — everywhere
     * else the middleware has already redirected, so a page can treat this as
     * non-null after calling requireUser().
     */
    user: import('./lib/auth/session.ts').SessionUser | null;
  }
}

interface ImportMetaEnv {
  readonly DATABASE_URL: string;
  readonly ALLOWED_EMAIL: string;
  readonly GOOGLE_CLIENT_ID: string;
  readonly GOOGLE_CLIENT_SECRET: string;
  readonly PUBLIC_APP_ORIGIN: string;
  readonly TOKEN_ENCRYPTION_KEY: string;
  readonly CRON_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
