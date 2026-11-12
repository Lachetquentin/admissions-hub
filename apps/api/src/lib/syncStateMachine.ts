import { SYNC_STATUSES, type SyncStatus } from '@admissions-hub/shared';
import { HttpError } from './httpErrors';

/**
 * Salesforce sync state machine (docs/STATE_MACHINES.md).
 *
 *   NOT_SYNCED ──► PENDING ──► SYNCED
 *                    ▲  │         │
 *                    │  └──► FAILED
 *                    └────────────┘  (re-sync or retry)
 *
 * Every write of `sync_status` goes through these transitions.
 */
export const SYNC_TRANSITIONS: Readonly<Record<SyncStatus, readonly SyncStatus[]>> = {
  NOT_SYNCED: ['PENDING'],
  PENDING: ['SYNCED', 'FAILED'],
  SYNCED: ['PENDING'],
  FAILED: ['PENDING'],
};

export const canTransition = (from: SyncStatus, to: SyncStatus): boolean =>
  SYNC_TRANSITIONS[from].includes(to);

/** States allowed to move to `to`, used as the SQL guard of an atomic transition. */
export const sourcesOf = (to: SyncStatus): SyncStatus[] =>
  SYNC_STATUSES.filter((from) => canTransition(from, to));

/**
 * A sync still PENDING after this long is considered dead (process crash mid-request) and may be
 * restarted: the only allowed PENDING → PENDING move.
 */
export const STALE_PENDING_MS = 5 * 60_000;

export class InvalidSyncTransition extends HttpError {
  constructor(from: SyncStatus, to: SyncStatus) {
    const message =
      from === 'PENDING' && to === 'PENDING'
        ? 'A synchronisation is already in progress for this application'
        : `Cannot move sync status from ${from} to ${to}`;
    super(409, 'INVALID_SYNC_TRANSITION', message, { from, to });
  }
}
