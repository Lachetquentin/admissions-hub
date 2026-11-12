import { SYNC_STATUSES, type SyncStatus } from '@admissions-hub/shared';
import { describe, expect, it } from 'vitest';
import { InvalidSyncTransition, canTransition, sourcesOf } from './syncStateMachine';

const VALID: [SyncStatus, SyncStatus][] = [
  ['NOT_SYNCED', 'PENDING'],
  ['PENDING', 'SYNCED'],
  ['PENDING', 'FAILED'],
  ['SYNCED', 'PENDING'],
  ['FAILED', 'PENDING'],
];
const isValid = (from: SyncStatus, to: SyncStatus) =>
  VALID.some(([f, t]) => f === from && t === to);
const ALL_PAIRS = SYNC_STATUSES.flatMap((from) =>
  SYNC_STATUSES.map((to) => [from, to] as [SyncStatus, SyncStatus]),
);

describe('sync state machine', () => {
  it.each(VALID)('allows %s → %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });

  it.each(ALL_PAIRS.filter(([from, to]) => !isValid(from, to)))(
    'rejects %s → %s with a 409',
    (from, to) => {
      expect(canTransition(from, to)).toBe(false);
      expect(new InvalidSyncTransition(from, to)).toMatchObject({
        status: 409,
        code: 'INVALID_SYNC_TRANSITION',
        details: { from, to },
      });
    },
  );

  it('never reaches SYNCED or FAILED without going through PENDING', () => {
    expect(sourcesOf('SYNCED')).toEqual(['PENDING']);
    expect(sourcesOf('FAILED')).toEqual(['PENDING']);
  });

  it('starts a sync from any settled state, never from PENDING', () => {
    expect(sourcesOf('PENDING')).toEqual(['NOT_SYNCED', 'SYNCED', 'FAILED']);
  });

  it('never goes back to NOT_SYNCED', () => {
    expect(sourcesOf('NOT_SYNCED')).toEqual([]);
  });
});
