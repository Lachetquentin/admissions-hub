# Salesforce configuration

Admissions Hub pushes each application to Salesforce as a **Lead**, through the REST API and
the **OAuth 2.0 Web Server Flow** (with PKCE). One Salesforce org is connected for the whole group,
by a `GROUP_ADMIN`, from the app header.

## 1. Get a Developer Edition org

Sign up at <https://developer.salesforce.com/signup> (free). You receive a username and a
"My Domain" such as `https://<your-domain>.develop.my.salesforce.com`.

## 2. Create an External Client App

New orgs create OAuth clients as **External Client Apps** (the successor of Connected Apps).

1. Setup → search **External Client App Manager** → **New External Client App**.
2. Basic information: name `Admissions Hub`, contact e-mail, distribution state **Local**.
3. **API (Enable OAuth Settings)**: tick **Enable OAuth**.
   - **Callback URL**: `http://localhost:3000/api/integrations/salesforce/callback`
     (add the deployed URL later, one per line).
   - **OAuth scopes**: `Manage user data via APIs (api)` and
     `Perform requests at any time (refresh_token, offline_access)`.
   - Flow enablement: keep **Enable Authorization Code and Credentials Flow** on.
   - Security: keep **Require secret for Web Server Flow** and **Require PKCE** on
     (Admissions Hub sends a PKCE challenge and its secret).
4. Save, then open the app → **Settings** → **OAuth Settings** → **Consumer Key and Secret**
   (Salesforce asks for a verification code by e-mail).
5. Policies → **OAuth Policies**: _Permitted users_ **All users may self-authorize**,
   _Refresh token policy_ **Refresh token is valid until revoked**.

Changes to an External Client App can take a few minutes to apply.

## 3. Configure the API

In `.env` (never committed):

```dotenv
SALESFORCE_ENABLED=true
SALESFORCE_LOGIN_URL=https://login.salesforce.com
SALESFORCE_CLIENT_ID=<consumer key>
SALESFORCE_CLIENT_SECRET=<consumer secret>
SALESFORCE_REDIRECT_URI=http://localhost:3000/api/integrations/salesforce/callback
TOKEN_ENCRYPTION_KEY=<node -e "console.log(require('crypto').randomBytes(32).toString('base64'))">
```

The API refuses to start if `SALESFORCE_ENABLED=true` and a value is missing.
`SALESFORCE_ENABLED=false` (the public demo) switches the integration off: the header says
_Salesforce désactivé_, sync and connect answer `503 SALESFORCE_DISABLED`.

## 4. Connect and sync

1. `npm run dev`, log in as `groupe@admissions.test` / `admissions-demo`.
2. Header → **Salesforce non connecté · Connecter** → log in to Salesforce → **Allow**.
   You come back with _Salesforce est connecté_.
3. Open an application → **Synchroniser**. The card shows the Lead id; in Salesforce,
   **Leads** → the candidate is there (Company = school).

## What is sent

| Lead field  | From the application                                                                                      |
| ----------- | --------------------------------------------------------------------------------------------------------- |
| FirstName   | first name                                                                                                |
| LastName    | last name                                                                                                 |
| Email       | e-mail                                                                                                    |
| Phone       | phone                                                                                                     |
| Company     | school name (Company is required on Lead)                                                                 |
| LeadSource  | `Web`                                                                                                     |
| Status      | NEW → Open - Not Contacted, REVIEWING / ACCEPTED → Working - Contacted, REJECTED → Closed - Not Converted |
| Description | target programme, Admissions Hub status, Admissions Hub id                                                |

Re-syncing updates the same Lead (`salesforceId`). If the Lead was deleted in Salesforce, a new
one is created. The mapping lives in `apps/api/src/modules/salesforce/salesforce.mapping.ts`.

## Security

- The refresh token and the access token are stored encrypted (AES-256-GCM, `TOKEN_ENCRYPTION_KEY`).
- The access token is refreshed automatically when Salesforce answers 401.
- The OAuth `state` is a signed, 10-minute JWT bound to the admin who started the flow; it also
  carries the PKCE verifier, encrypted.

## Troubleshooting

| Message after the callback         | Cause                                                           |
| ---------------------------------- | --------------------------------------------------------------- |
| `redirect_uri_mismatch`            | Callback URL in Salesforce ≠ `SALESFORCE_REDIRECT_URI`, exactly |
| `invalid_client_id`                | Wrong consumer key, or the app is not propagated yet (wait)     |
| `OAUTH_APP_ACCESS_DENIED` / denied | Permitted users policy, or consent refused                      |
| `NO_REFRESH_TOKEN`                 | `refresh_token, offline_access` scope missing                   |
| Sync FAILED `INVALID_SESSION_ID`   | Refresh token revoked: reconnect from the header                |
