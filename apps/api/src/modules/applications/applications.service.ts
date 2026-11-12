import { and, count, desc, eq } from 'drizzle-orm';
import type {
  Application,
  ApplicationCreate,
  ApplicationListFilters,
  ApplicationUpdate,
  Paginated,
} from '@admissions-hub/shared';
import { db } from '../../db/client';
import { applications, type ApplicationRow } from '../../db/schema';
import type { SchoolScope } from '../../lib/auth';
import { notFound } from '../../lib/httpErrors';
import { inScope } from '../../lib/scope';
import { getSchool } from '../schools/schools.service';

const toApplication = (row: ApplicationRow): Application => ({
  ...row,
  lastSyncAt: row.lastSyncAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const byIdInScope = (scope: SchoolScope, id: string) =>
  and(eq(applications.id, id), inScope(applications.schoolId, scope));

export async function listApplications(
  scope: SchoolScope,
  { page, pageSize, schoolId, status }: ApplicationListFilters,
): Promise<Paginated<Application>> {
  const where = and(
    inScope(applications.schoolId, scope),
    schoolId ? eq(applications.schoolId, schoolId) : undefined,
    status ? eq(applications.status, status) : undefined,
  );
  const [rows, [totalRow]] = await Promise.all([
    db
      .select()
      .from(applications)
      .where(where)
      .orderBy(desc(applications.createdAt), desc(applications.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(applications).where(where),
  ]);
  return { items: rows.map(toApplication), page, pageSize, total: totalRow?.total ?? 0 };
}

export async function getApplication(scope: SchoolScope, id: string): Promise<Application> {
  const [row] = await db.select().from(applications).where(byIdInScope(scope, id));
  if (!row) throw notFound('Application');
  return toApplication(row);
}

export async function createApplication(
  scope: SchoolScope,
  input: ApplicationCreate,
): Promise<Application> {
  await getSchool(scope, input.schoolId); // 404 when the school is outside the scope
  const [row] = await db.insert(applications).values(input).returning();
  if (!row) throw new Error('Insert returned no row');
  return toApplication(row);
}

export async function updateApplication(
  scope: SchoolScope,
  id: string,
  patch: ApplicationUpdate,
): Promise<Application> {
  const [row] = await db
    .update(applications)
    .set(patch)
    .where(byIdInScope(scope, id))
    .returning();
  if (!row) throw notFound('Application');
  return toApplication(row);
}

export async function deleteApplication(scope: SchoolScope, id: string): Promise<void> {
  const deleted = await db
    .delete(applications)
    .where(byIdInScope(scope, id))
    .returning({ id: applications.id });
  if (deleted.length === 0) throw notFound('Application');
}
