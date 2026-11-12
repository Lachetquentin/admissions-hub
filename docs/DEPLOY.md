# Public demo on Render

The demo runs on [Render](https://render.com) free tier, described in [`render.yaml`](../render.yaml):

| Service              | Render type         | What it runs                                                |
| -------------------- | ------------------- | ----------------------------------------------------------- |
| `admissions-hub`     | Static site (free)  | The Vite build; `/api/*` and `/docs/*` rewritten to the API |
| `admissions-hub-api` | Web service, Docker | `apps/api/Dockerfile`: migrations + seed, then the API      |
| `admissions-hub-db`  | PostgreSQL (free)   | The demo database                                           |

Salesforce is **disabled** (`SALESFORCE_ENABLED=false`): the header shows _Salesforce désactivé_
and sync answers 503. No Salesforce secret ever goes to the demo.

## Deploy

1. Render dashboard → **New → Blueprint** → pick `Lachetquentin/admissions-hub` → **Apply**.
2. Wait for the three resources (the API waits for the database; the seed runs on the first start).
3. If Render gave the services other URLs than `admissions-hub.onrender.com` /
   `admissions-hub-api.onrender.com` (name already taken), update:
   - `APP_URL` on the API service (Environment tab),
   - the two `destination` URLs of the static site rewrites (Redirects/Rewrites tab, or `render.yaml`).
4. Open the static site URL and log in with a demo account (`groupe@admissions.test` / `admissions-demo`).

Every push to `main` redeploys both services.

## Free tier limits

- The API sleeps after 15 minutes without traffic: the first request then takes ~30–60 s.
- A free Render PostgreSQL expires after 30 days. To keep the demo longer, create a free database
  on [Neon](https://neon.tech) and set its connection string as `DATABASE_URL` on the API
  (append `?sslmode=require`).
- Visitors can edit the demo data. To reset it, run `node dist/db/seed.js --reset` from the API
  service shell.

## Why Render

Free Docker web services, free PostgreSQL and free static hosting with rewrites in one Blueprint
file, deployed from GitHub on every push, so the demo uses the same Dockerfile as `docker compose`.
