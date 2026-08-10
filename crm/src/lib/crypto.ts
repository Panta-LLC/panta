/**
 * AES-256-GCM for the one secret this app stores on behalf of another system:
 * the Google refresh token.
 *
 * A refresh token is long-lived and, on its own, grants read access to the
 * mailbox until revoked. It is the only value in the database that is more
 * dangerous than the data around it, so it does not sit in a text column.
 *
 * Ciphertext, IV and auth tag are stored in three separate `bytea` columns.
 * That is partly defensive — none of them is usable alone — and partly so it
 * is obvious at a glance that the value is not meant to be selected casually.
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12; // 96 bits, the size GCM is defined for

function env(key: string): string | undefined {
  const fromVite = (import.meta as { env?: Record<string, string | undefined> }).env?.[key];
  return fromVite ?? process.env[key];
}

function key(): Buffer {
  const raw = env('TOKEN_ENCRYPTION_KEY');
  if (!raw) {
    throw new Error(
      'TOKEN_ENCRYPTION_KEY is not set. Generate one with:\n' +
        `  node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"`,
    );
  }

  const buf = Buffer.from(raw, 'base64');
  if (buf.length !== 32) {
    throw new Error(
      `TOKEN_ENCRYPTION_KEY must decode to 32 bytes, got ${buf.length}. It should be base64 of 32 random bytes.`,
    );
  }
  return buf;
}

export type Sealed = { ct: Buffer; iv: Buffer; tag: Buffer };

export function seal(plaintext: string): Sealed {
  // A fresh IV per encryption. Reusing one under the same key is the single
  // way to break GCM outright, so it is generated here rather than passed in.
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return { ct, iv, tag: cipher.getAuthTag() };
}

export function open(sealed: Sealed): string {
  const decipher = createDecipheriv(ALGORITHM, key(), sealed.iv);
  decipher.setAuthTag(sealed.tag);
  // Throws if the tag does not match, which is what makes this authenticated
  // rather than merely encrypted — a tampered ciphertext fails loudly.
  return Buffer.concat([decipher.update(sealed.ct), decipher.final()]).toString('utf8');
}

/** True when a key is configured and valid, for the settings page to report. */
export function encryptionConfigured(): boolean {
  try {
    key();
    return true;
  } catch {
    return false;
  }
}
