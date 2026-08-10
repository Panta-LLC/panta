/**
 * Env loading for plain Node processes (drizzle-kit, seed scripts).
 *
 * Astro loads .env through Vite into import.meta.env, but drizzle-kit and the
 * seed scripts run as bare Node and get none of that. Rather than add dotenv
 * as a dependency for two call sites, parse the file directly — the same
 * approach site/scripts/lib/apply-edits.mjs takes for SANITY_WRITE_TOKEN.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Parse a .env file into a plain object. Missing file is not an error. */
function readEnvFile(name: string): Record<string, string> {
  let raw: string;
  try {
    raw = readFileSync(join(root, name), 'utf8');
  } catch {
    return {};
  }

  const out: Record<string, string> = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    // Strip one layer of matching quotes; leave inner quotes alone.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

// .env.local wins over .env, and a real process env wins over both — that is
// how the value gets supplied on Vercel, where neither file exists.
const fromFiles = { ...readEnvFile('.env'), ...readEnvFile('.env.local') };

/**
 * Populate process.env as a side effect of importing this module.
 *
 * src/lib/db/client.ts reads import.meta.env (Astro) falling back to
 * process.env (plain Node). Under tsx neither is populated from a file, so
 * scripts import this module FIRST — ESM evaluates sibling imports in source
 * order, so process.env is filled before the db client's module body runs and
 * throws. An already-set variable always wins, so a real environment is never
 * overridden by a stale file.
 */
for (const [key, value] of Object.entries(fromFiles)) {
  process.env[key] ??= value;
}

function required(key: string): string {
  const value = process.env[key] ?? fromFiles[key];
  if (!value) {
    throw new Error(
      `Missing ${key}. Copy crm/.env.example to crm/.env.local and fill it in.`,
    );
  }
  return value;
}

export const config = {
  get DATABASE_URL() {
    return required('DATABASE_URL');
  },
};
