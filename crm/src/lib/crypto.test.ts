import { beforeAll, describe, expect, it } from 'vitest';
import { randomBytes } from 'node:crypto';

// The module reads the key at call time, so setting it before import is not
// required — but it must exist before the first seal().
beforeAll(() => {
  process.env.TOKEN_ENCRYPTION_KEY = randomBytes(32).toString('base64');
});

const { seal, open, encryptionConfigured } = await import('./crypto.ts');

describe('sealing a refresh token', () => {
  it('round-trips', () => {
    const secret = '1//0eXaMpLe-refresh-token_value';
    expect(open(seal(secret))).toBe(secret);
  });

  it('produces different ciphertext each time', () => {
    // A fresh IV per encryption. Identical ciphertext for identical input
    // would leak that two accounts share a token.
    const a = seal('same');
    const b = seal('same');
    expect(a.ct.equals(b.ct)).toBe(false);
    expect(a.iv.equals(b.iv)).toBe(false);
  });

  it('never stores the plaintext in the ciphertext', () => {
    const secret = 'sentinel-value-do-not-leak';
    const sealed = seal(secret);
    expect(sealed.ct.toString('utf8')).not.toContain(secret);
    expect(sealed.ct.toString('base64')).not.toContain(
      Buffer.from(secret).toString('base64').slice(0, 12),
    );
  });

  it('handles unicode', () => {
    const secret = 'tökén–✓–🔑';
    expect(open(seal(secret))).toBe(secret);
  });
});

describe('authentication', () => {
  it('refuses tampered ciphertext', () => {
    const sealed = seal('important');
    sealed.ct[0] ^= 0xff;
    expect(() => open(sealed)).toThrow();
  });

  it('refuses a tampered auth tag', () => {
    const sealed = seal('important');
    sealed.tag[0] ^= 0xff;
    expect(() => open(sealed)).toThrow();
  });

  it('refuses a swapped IV', () => {
    const a = seal('one');
    const b = seal('two');
    expect(() => open({ ct: a.ct, iv: b.iv, tag: a.tag })).toThrow();
  });

  it('refuses a different key', () => {
    const sealed = seal('important');
    process.env.TOKEN_ENCRYPTION_KEY = randomBytes(32).toString('base64');
    expect(() => open(sealed)).toThrow();
  });
});

describe('key validation', () => {
  it('rejects a key that is not 32 bytes', () => {
    process.env.TOKEN_ENCRYPTION_KEY = Buffer.from('too short').toString('base64');
    expect(encryptionConfigured()).toBe(false);
    expect(() => seal('x')).toThrow(/32 bytes/);
  });

  it('rejects a missing key', () => {
    delete process.env.TOKEN_ENCRYPTION_KEY;
    expect(encryptionConfigured()).toBe(false);
    expect(() => seal('x')).toThrow(/TOKEN_ENCRYPTION_KEY/);
  });
});
