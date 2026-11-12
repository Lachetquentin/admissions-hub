import { loadEnv } from '../src/config/loadEnv';

/**
 * Swaps DATABASE_URL for DATABASE_URL_TEST so tests never touch the dev database, and turns
 * Salesforce on with fake credentials: tests inject a mocked client and stub `fetch`, so no
 * network call ever leaves the test run.
 */
export function useTestDatabase(): void {
  loadEnv();
  const url = process.env.DATABASE_URL_TEST;
  if (!url) throw new Error('DATABASE_URL_TEST is required to run the API tests');
  process.env.DATABASE_URL = url;
  process.env.NODE_ENV = 'test';
  Object.assign(process.env, {
    SALESFORCE_ENABLED: 'true',
    SALESFORCE_LOGIN_URL: 'https://login.salesforce.test',
    SALESFORCE_CLIENT_ID: 'test-client-id',
    SALESFORCE_CLIENT_SECRET: 'test-client-secret',
    SALESFORCE_REDIRECT_URI: 'http://localhost:3000/api/integrations/salesforce/callback',
    TOKEN_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64'),
  });
}
