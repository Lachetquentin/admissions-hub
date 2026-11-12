import { pathToFileURL } from 'node:url';
import { sql } from 'drizzle-orm';
import type { ApplicationStatus } from '@admissions-hub/shared';
import { APPLICATION_STATUSES } from '@admissions-hub/shared';
import { hashPassword } from '../lib/password';
import { db, pool, type Db } from './client';
import { applications, schools, users } from './schema';

/** Demo password for every seeded account (documented in the README; demo data only). */
export const SEED_PASSWORD = 'admissions-demo';

const SCHOOLS = [
  {
    name: 'École Supérieure de Commerce',
    slug: 'esc',
    programs: ['Bachelor Business', 'MSc Marketing', 'MBA'],
  },
  {
    name: "Institut d'Ingénierie Numérique",
    slug: 'iin',
    programs: ['Cycle Ingénieur', 'MSc Data', 'MSc Cybersécurité'],
  },
  {
    name: 'École de Design Appliqué',
    slug: 'eda',
    programs: ['Bachelor Design', 'Mastère UX', 'Mastère Motion'],
  },
];
const FIRST_NAMES = [
  'Camille',
  'Lucas',
  'Inès',
  'Hugo',
  'Léa',
  'Nathan',
  'Chloé',
  'Yanis',
  'Manon',
  'Adam',
  'Sarah',
  'Louis',
];
const LAST_NAMES = [
  'Martin',
  'Bernard',
  'Dubois',
  'Thomas',
  'Robert',
  'Richard',
  'Petit',
  'Durand',
  'Leroy',
  'Moreau',
  'Simon',
  'Laurent',
];

/** "Léa" → "lea": e-mail local parts stay plain ASCII. */
const asciiSlug = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/** Inserts demo data. Deterministic, so screenshots and demos stay stable. */
export async function seed(database: Db = db): Promise<void> {
  const passwordHash = await hashPassword(SEED_PASSWORD);
  const insertedSchools = await database
    .insert(schools)
    .values(SCHOOLS.map(({ name, slug }) => ({ name, slug })))
    .returning();

  await database.insert(users).values([
    { email: 'groupe@admissions.test', name: 'Admin Groupe', role: 'GROUP_ADMIN', passwordHash },
    ...insertedSchools.map((school) => ({
      email: `${school.slug}@admissions.test`,
      name: `Admin ${school.slug.toUpperCase()}`,
      role: 'SCHOOL_ADMIN' as const,
      schoolId: school.id,
      passwordHash,
    })),
  ]);

  const rows = insertedSchools.flatMap((school, s) =>
    Array.from({ length: 12 }, (_, i) => {
      const firstName = FIRST_NAMES[(i + s * 5) % FIRST_NAMES.length]!;
      const lastName = LAST_NAMES[(i * 7 + s) % LAST_NAMES.length]!;
      const programs = SCHOOLS[s]!.programs;
      return {
        schoolId: school.id,
        firstName,
        lastName,
        email: `${asciiSlug(firstName)}.${asciiSlug(lastName)}${i}@example.com`,
        phone: `+33 6 ${String(10 + s).padStart(2, '0')} ${String(20 + i).padStart(2, '0')} 00 ${String(i).padStart(2, '0')}`,
        program: programs[i % programs.length]!,
        status: APPLICATION_STATUSES[i % APPLICATION_STATUSES.length] as ApplicationStatus,
        createdAt: new Date(Date.UTC(2026, 9, 1 + i, 9 + s)),
      };
    }),
  );
  await database.insert(applications).values(rows);
}

async function main(): Promise<void> {
  const reset = process.argv.includes('--reset');
  const [{ count }] = (
    await db.execute<{ count: number }>(sql`select count(*)::int as count from schools`)
  ).rows as [{ count: number }];
  if (count > 0 && !reset) {
    console.log('Database already seeded, skipping (use --reset to wipe and reseed).');
  } else {
    if (reset)
      await db.execute(sql`truncate applications, users, schools restart identity cascade`);
    await seed();
    console.log('Seed done.');
  }
  await pool.end();
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main();
