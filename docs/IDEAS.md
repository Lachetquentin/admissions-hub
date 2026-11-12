# Ideas (out of scope)

Ideas noted while building, deliberately **not** implemented.

- School management (create/rename schools) from the UI for GROUP_ADMIN — schools are seeded for now.
- Upsert Leads on an External ID field (`AdmissionsHubId__c`) so a crash between the Lead creation and `SYNCED` can never create a duplicate.
- "Disconnect Salesforce" button for GROUP_ADMIN (revoke the token, delete the connection row).
- Show "modified since last sync" when an application is edited after a successful sync.
