# Ideas (out of scope)

Ideas noted while building, deliberately **not** implemented.

- School management (create/rename schools) from the UI for GROUP_ADMIN — schools are seeded for now.
- Recover applications stuck in `PENDING` after a crash (e.g. a sweep that moves `PENDING` older than a few minutes to `FAILED`).
- "Disconnect Salesforce" button for GROUP_ADMIN (revoke the token, delete the connection row).
- Show "modified since last sync" when an application is edited after a successful sync.
