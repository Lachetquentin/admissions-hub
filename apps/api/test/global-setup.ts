import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { useTestDatabase } from './test-env';

/** Applies migrations to the test database once per run. */
export default async function setup(): Promise<void> {
  useTestDatabase();
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  await migrate(drizzle(pool), {
    migrationsFolder: fileURLToPath(new URL('../src/db/migrations', import.meta.url)),
  });
  await pool.end();
}
