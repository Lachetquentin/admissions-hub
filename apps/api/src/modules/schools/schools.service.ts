import { and, asc, eq } from 'drizzle-orm';
import type { School } from '@admissions-hub/shared';
import { db } from '../../db/client';
import { schools } from '../../db/schema';
import type { SchoolScope } from '../../lib/auth';
import { notFound } from '../../lib/httpErrors';
import { inScope } from '../../lib/scope';

const columns = { id: schools.id, name: schools.name, slug: schools.slug };

export const listSchools = (scope: SchoolScope): Promise<School[]> =>
  db.select(columns).from(schools).where(inScope(schools.id, scope)).orderBy(asc(schools.name));

/** Throws 404 when the school does not exist or is outside the scope. */
export async function getSchool(scope: SchoolScope, id: string): Promise<School> {
  const [school] = await db
    .select(columns)
    .from(schools)
    .where(and(eq(schools.id, id), inScope(schools.id, scope)));
  if (!school) throw notFound('School');
  return school;
}
