import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './client';

// Works from src/ (tsx) and from dist/ (bundled; the Dockerfile copies migrations next to it).
const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), 'migrations');

await migrate(db, { migrationsFolder });
console.log('Migrations applied');
await pool.end();
