import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { decryptSecret, encryptSecret } from './crypto';

const key = randomBytes(32);

describe('encryptSecret / decryptSecret', () => {
  it('round-trips and never stores the plain value', () => {
    const stored = encryptSecret('5Aep861refresh-token', key);
    expect(stored).not.toContain('refresh-token');
    expect(stored.startsWith('v1.')).toBe(true);
    expect(decryptSecret(stored, key)).toBe('5Aep861refresh-token');
  });

  it('uses a fresh IV for every encryption', () => {
    expect(encryptSecret('same', key)).not.toBe(encryptSecret('same', key));
  });

  it('rejects a wrong key or a tampered value', () => {
    const stored = encryptSecret('secret', key);
    expect(() => decryptSecret(stored, randomBytes(32))).toThrow();
    const parts = stored.split('.');
    parts[3] = Buffer.from('forged').toString('base64url');
    expect(() => decryptSecret(parts.join('.'), key)).toThrow();
    expect(() => decryptSecret('plain-text', key)).toThrow('Unsupported encrypted value');
  });
});
