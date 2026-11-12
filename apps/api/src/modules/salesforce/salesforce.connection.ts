import { eq } from 'drizzle-orm';
import type { SalesforceConfig } from '../../config/env';
import { db } from '../../db/client';
import { salesforceConnections } from '../../db/schema';
import { decryptSecret, encryptSecret } from '../../lib/crypto';

const ID = 'default';

export type SalesforceTokens = { instanceUrl: string; accessToken: string; refreshToken: string };

/** Where the HTTP client reads and refreshes tokens; an interface so the client is unit-testable. */
export interface TokenStore {
  get(): Promise<SalesforceTokens | null>;
  saveAccessToken(accessToken: string, instanceUrl: string): Promise<void>;
}

export const getConnection = async () =>
  (await db.select().from(salesforceConnections).where(eq(salesforceConnections.id, ID)))[0] ??
  null;

/** Stores (or replaces) the org connection after the OAuth callback. Tokens are encrypted. */
export async function saveConnection(
  config: SalesforceConfig,
  tokens: SalesforceTokens,
  connectedById: string,
): Promise<void> {
  const values = {
    instanceUrl: tokens.instanceUrl,
    encryptedAccessToken: encryptSecret(tokens.accessToken, config.encryptionKey),
    encryptedRefreshToken: encryptSecret(tokens.refreshToken, config.encryptionKey),
    connectedById,
  };
  await db
    .insert(salesforceConnections)
    .values({ id: ID, ...values })
    .onConflictDoUpdate({
      target: salesforceConnections.id,
      set: { ...values, createdAt: new Date() },
    });
}

export function databaseTokenStore(config: SalesforceConfig): TokenStore {
  return {
    async get() {
      const row = await getConnection();
      if (!row) return null;
      return {
        instanceUrl: row.instanceUrl,
        accessToken: decryptSecret(row.encryptedAccessToken, config.encryptionKey),
        refreshToken: decryptSecret(row.encryptedRefreshToken, config.encryptionKey),
      };
    },
    async saveAccessToken(accessToken, instanceUrl) {
      await db
        .update(salesforceConnections)
        .set({
          encryptedAccessToken: encryptSecret(accessToken, config.encryptionKey),
          instanceUrl,
        })
        .where(eq(salesforceConnections.id, ID));
    },
  };
}
