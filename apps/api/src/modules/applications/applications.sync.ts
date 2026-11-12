import { and, eq, inArray, lt, or } from 'drizzle-orm';
import type { Application, SyncStatus } from '@admissions-hub/shared';
import { db } from '../../db/client';
import { applications, type ApplicationRow } from '../../db/schema';
import type { SchoolScope } from '../../lib/auth';
import { HttpError } from '../../lib/httpErrors';
import { InvalidSyncTransition, STALE_PENDING_MS, sourcesOf } from '../../lib/syncStateMachine';
import { SalesforceError, type SalesforceClient } from '../salesforce/salesforce.client';
import { getConnection } from '../salesforce/salesforce.connection';
import { toLead } from '../salesforce/salesforce.mapping';
import { salesforceConfig } from '../salesforce/salesforce.oauth';
import { getSchool } from '../schools/schools.service';
import { getApplication, toApplication } from './applications.service';

type SyncFields = Partial<Pick<ApplicationRow, 'salesforceId' | 'lastSyncError'>>;

/**
 * Moves sync_status to `to` in one guarded UPDATE: it only matches when the current status may
 * move there (state machine), so concurrent requests cannot both win. Returns null otherwise.
 */
async function transition(id: string, to: SyncStatus, fields: SyncFields = {}) {
  const allowed = inArray(applications.syncStatus, sourcesOf(to));
  // A sync left PENDING by a crash may be restarted once it is stale (see STALE_PENDING_MS).
  const stalePending = and(
    eq(applications.syncStatus, 'PENDING'),
    lt(applications.updatedAt, new Date(Date.now() - STALE_PENDING_MS)),
  );
  const [row] = await db
    .update(applications)
    .set({ syncStatus: to, ...fields, ...(to === 'PENDING' ? {} : { lastSyncAt: new Date() }) })
    .where(and(eq(applications.id, id), to === 'PENDING' ? or(allowed, stalePending) : allowed))
    .returning();
  return row ?? null;
}

const readableError = (error: unknown): string =>
  error instanceof SalesforceError
    ? `${error.message} (${error.code})`
    : 'Internal error during the synchronisation, please retry later';

/**
 * POST /applications/:id/sync — creates or updates the candidate's Lead.
 * The outcome (SYNCED or FAILED with a readable error) is stored and returned on the application.
 */
export async function syncApplication(
  scope: SchoolScope,
  id: string,
  client: SalesforceClient | null,
): Promise<Application> {
  const current = await getApplication(scope, id); // 404 outside the scope
  salesforceConfig(); // 503 when disabled
  if (!client || !(await getConnection())) {
    throw new HttpError(409, 'SALESFORCE_NOT_CONNECTED', 'Salesforce is not connected yet');
  }

  const started = await transition(id, 'PENDING');
  if (!started) throw new InvalidSyncTransition(current.syncStatus, 'PENDING');

  // Everything after PENDING is inside the try, so the row always settles (SYNCED or FAILED).
  let finished: ApplicationRow | null;
  try {
    const school = await getSchool(scope, started.schoolId);
    const salesforceId = await client.upsertLead(
      toLead(started, school.name),
      started.salesforceId,
    );
    finished = await transition(id, 'SYNCED', { salesforceId, lastSyncError: null });
  } catch (error) {
    if (!(error instanceof SalesforceError)) console.error(error);
    finished = await transition(id, 'FAILED', { lastSyncError: readableError(error) });
  }
  if (!finished) throw new Error(`Application ${id} left PENDING during its sync`);
  return toApplication(finished);
}
