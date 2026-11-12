import { loadEnv } from '../src/config/loadEnv';

/** Swaps DATABASE_URL for DATABASE_URL_TEST so tests never touch the dev database. */
export function useTestDatabase(): void {
  loadEnv();
  const url = process.env.DATABASE_URL_TEST;
  if (!url) throw new Error('DATABASE_URL_TEST is required to run the API tests');
  process.env.DATABASE_URL = url;
  process.env.NODE_ENV = 'test';
}
