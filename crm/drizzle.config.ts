import { defineConfig } from 'drizzle-kit';

// drizzle-kit runs as a plain Node process, so it does not get Astro's
// import.meta.env loading. Read .env by hand the way site/scripts/lib/
// apply-edits.mjs does for SANITY_WRITE_TOKEN.
import { config } from './scripts/env.ts';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: config.DATABASE_URL },
  strict: true,
  verbose: true,
});
