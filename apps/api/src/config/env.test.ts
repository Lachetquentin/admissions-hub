import { describe, expect, it } from 'vitest';
import { envSchema } from './env';

const base = {
  DATABASE_URL: 'postgres://u:p@localhost:5432/db',
  JWT_SECRET: 'x'.repeat(32),
};
const salesforce = {
  SALESFORCE_CLIENT_ID: 'id',
  SALESFORCE_CLIENT_SECRET: 'secret',
  SALESFORCE_REDIRECT_URI: 'http://localhost:3000/api/integrations/salesforce/callback',
  TOKEN_ENCRYPTION_KEY: Buffer.alloc(32, 1).toString('base64'),
};

describe('envSchema', () => {
  it('keeps Salesforce off by default (demo mode)', () => {
    expect(envSchema.parse(base).salesforce).toBeNull();
    expect(envSchema.parse({ ...base, SALESFORCE_ENABLED: 'false' }).salesforce).toBeNull();
  });

  it('treats empty Salesforce variables as not set (copied .env.example, Compose defaults)', () => {
    const empty = {
      SALESFORCE_CLIENT_ID: '',
      SALESFORCE_CLIENT_SECRET: '',
      SALESFORCE_REDIRECT_URI: '',
      TOKEN_ENCRYPTION_KEY: '',
    };
    expect(envSchema.parse({ ...base, ...empty }).salesforce).toBeNull();
    const enabled = envSchema.safeParse({ ...base, ...empty, SALESFORCE_ENABLED: 'true' });
    expect(enabled.error?.issues.map((i) => i.message)).toContain(
      'required when SALESFORCE_ENABLED=true',
    );
  });

  it('builds the Salesforce config when enabled', () => {
    const env = envSchema.parse({ ...base, ...salesforce, SALESFORCE_ENABLED: 'true' });
    expect(env.salesforce).toMatchObject({
      clientId: 'id',
      loginUrl: 'https://login.salesforce.com',
      apiVersion: 'v62.0',
    });
    expect(env.salesforce?.encryptionKey).toHaveLength(32);
  });

  it('refuses to start with Salesforce enabled but incomplete', () => {
    const result = envSchema.safeParse({
      ...base,
      SALESFORCE_ENABLED: 'true',
      SALESFORCE_CLIENT_ID: 'id',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.path.join('.')).sort()).toEqual([
      'SALESFORCE_CLIENT_SECRET',
      'SALESFORCE_REDIRECT_URI',
      'TOKEN_ENCRYPTION_KEY',
    ]);
  });

  it('rejects an encryption key that is not 32 bytes', () => {
    const result = envSchema.safeParse({
      ...base,
      ...salesforce,
      TOKEN_ENCRYPTION_KEY: 'c2hvcnQ=',
    });
    expect(result.error?.issues[0]?.path).toEqual(['TOKEN_ENCRYPTION_KEY']);
  });
});
