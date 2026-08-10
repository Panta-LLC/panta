/**
 * One database handle, two drivers, chosen by hostname.
 *
 * Production is Neon, over its serverless HTTP driver. That matters more than
 * it sounds: a Vercel function is short-lived and there can be many at once,
 * so a normal TCP pool exhausts Postgres' connection limit under exactly the
 * conditions you least want it to. Neon's HTTP driver has no pool to exhaust.
 *
 * Local development is Homebrew postgres@16 over plain TCP, because requiring
 * a network round-trip to Neon to run the app on a plane is silly, and because
 * a local database is the only way to exercise a destructive migration without
 * consequences.
 *
 * The two are selected automatically so DATABASE_URL is the only thing that
 * ever needs to change between environments.
 */
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzleNode, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { neon } from '@neondatabase/serverless';
import pg from 'pg';

import * as schema from './schema.ts';

/**
 * Astro exposes env through import.meta.env; plain Node scripts (drizzle-kit,
 * the seed script) only have process.env. Read both so the same module works
 * in either context.
 */
function env(key: string): string | undefined {
  const fromVite = (import.meta as { env?: Record<string, string | undefined> }).env?.[key];
  return fromVite ?? process.env[key];
}

const url = env('DATABASE_URL');
if (!url) {
  throw new Error(
    'DATABASE_URL is not set. Copy crm/.env.example to crm/.env.local and fill it in.',
  );
}

const isNeon = url.includes('neon.tech');

/**
 * Reuse the handle across invocations. On Vercel a warm function reuses the
 * module scope, so this avoids building a new pool per request; locally it
 * avoids leaking a pool per HMR reload, which otherwise exhausts Postgres'
 * 100-connection default within a few minutes of editing.
 */
/**
 * One declared type for both drivers.
 *
 * `drizzle-orm/neon-http` and `drizzle-orm/node-postgres` expose the same
 * query builder, but leaving `db` as a *union* of the two makes TypeScript
 * resolve every method against the intersection of their signatures — which
 * turns `.returning({ id })` into "Expected 0 arguments, but got 1" at every
 * call site. Naming a single type keeps the builder usable; the runtime
 * difference is only which transport carries the SQL.
 */
type Db = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __pantaCrmDb?: Db };

function build(): Db {
  if (isNeon) {
    return drizzleNeon(neon(url!), { schema }) as unknown as Db;
  }
  return drizzleNode(new pg.Pool({ connectionString: url, max: 5 }), { schema });
}

export const db: Db = (globalForDb.__pantaCrmDb ??= build());

export { schema };
