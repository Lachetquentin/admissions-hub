# State machines

## Salesforce sync status (per application)

Column `applications.sync_status`, enum `SyncStatus` in `packages/shared/src/enums.ts`.
Transitions are defined once in `apps/api/src/lib/syncStateMachine.ts` and covered by
`syncStateMachine.test.ts` (every valid pair accepted, every other pair rejected).

```mermaid
stateDiagram-v2
    [*] --> NOT_SYNCED
    NOT_SYNCED --> PENDING: POST /applications/:id/sync
    PENDING --> SYNCED: Lead created or updated
    PENDING --> FAILED: Salesforce error / not reachable
    SYNCED --> PENDING: re-sync after an edit
    FAILED --> PENDING: retry
    PENDING --> PENDING: restart, only if stale (> 5 min)
```

| From \ To  | NOT_SYNCED | PENDING | SYNCED | FAILED |
| ---------- | :--------: | :-----: | :----: | :----: |
| NOT_SYNCED |     –      |   ✅    |   ❌   |   ❌   |
| PENDING    |     ❌     | ⏱ stale |   ✅   |   ✅   |
| SYNCED     |     ❌     |   ✅    |   ❌   |   ❌   |
| FAILED     |     ❌     |   ✅    |   ❌   |   ❌   |

Invalid transitions answer **409 `INVALID_SYNC_TRANSITION`** with `details: { from, to }`.

### Guarantees

- **Atomic start.** Moving to `PENDING` is a single `UPDATE … WHERE sync_status IN (sources of PENDING)`.
  Two concurrent syncs of the same application cannot both start: the second gets 409.
- **Settled fields.**
  - `SYNCED`: `salesforce_id` is set, `last_sync_error` is null, `last_sync_at` is the success time.
  - `FAILED`: `last_sync_error` holds a readable message, `last_sync_at` is the attempt time,
    `salesforce_id` keeps the previous Lead id if there was one.
- **Idempotent upsert.** A sync reuses `salesforce_id` (PATCH the Lead). If Salesforce no longer
  has that Lead (deleted), a new Lead is created and its id replaces the old one.

### Stale PENDING

Everything after the move to `PENDING` runs inside one `try`, so a Salesforce or mapping error always
settles the row as `FAILED`. If the process itself dies mid-sync, the row stays `PENDING`; once it is
older than `STALE_PENDING_MS` (5 minutes, `updated_at`), a new sync may restart it. A fresh `PENDING`
still answers 409.

### Known limit

If the process dies after Salesforce created the Lead but before `SYNCED` is written, the restart does
not know the Lead id and creates a second Lead. The robust fix is an External ID field on Lead
(`PATCH /sobjects/Lead/AdmissionsHubId__c/<id>` upserts natively); it needs a custom field in the org,
so it is listed in `docs/IDEAS.md`.

## Application business status

`applications.status`: `NEW`, `REVIEWING`, `ACCEPTED`, `REJECTED`. Admins may set any status
(the form is a free choice, corrections included), so there is no transition guard on it.
