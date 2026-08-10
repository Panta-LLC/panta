/**
 * Re-export of drizzle's Postgres column builders, plus the one type it does
 * not ship: `bytea`.
 *
 * schema.ts imports everything from here rather than from two places, so the
 * custom type is indistinguishable from a built-in at the call site.
 */
export {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  smallint,
  timestamp,
  jsonb,
  inet,
  index,
  uniqueIndex,
  customType,
} from 'drizzle-orm/pg-core';

export { sql } from 'drizzle-orm';

import { customType } from 'drizzle-orm/pg-core';

/**
 * Raw bytes. Used for the AES-256-GCM ciphertext, IV and auth tag of Google
 * refresh tokens — storing those base64'd in a text column would work, but
 * `bytea` makes it obvious at a glance that the value is not readable and not
 * meant to be selected casually.
 */
export const bytea = customType<{ data: Buffer; notNull: false; default: false }>({
  dataType() {
    return 'bytea';
  },
});
