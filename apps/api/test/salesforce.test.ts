import { eq, sql } from 'drizzle-orm';
import request from 'supertest';
import type { Application, School } from '@admissions-hub/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';
import { env } from '../src/config/env';
import { db } from '../src/db/client';
import { applications, salesforceConnections } from '../src/db/schema';
import {
  SalesforceError,
  type SalesforceClient,
} from '../src/modules/salesforce/salesforce.client';
import { saveConnection } from '../src/modules/salesforce/salesforce.connection';
import { GROUP_ADMIN, app, as, login, resetDb, schoolAdmin } from './helpers';

const LEAD_ID = '00Q5j00000Ab3XYEAZ';

let esc: School;
let iin: School;
let group: ReturnType<typeof as>;
let escAdmin: ReturnType<typeof as>;
let upsertLead: ReturnType<typeof vi.fn<SalesforceClient['upsertLead']>>;
let mocked: ReturnType<typeof createApp>;

async function connect() {
  const [user] = await db
    .execute<{ id: string }>(sql`select id from users where role = 'GROUP_ADMIN' limit 1`)
    .then((r) => r.rows);
  await saveConnection(
    env.salesforce!,
    { instanceUrl: 'https://acme.my.salesforce.com', accessToken: 'a', refreshToken: 'r' },
    user!.id,
  );
}

async function firstOf(school: School): Promise<Application> {
  return (await group.get(`/api/applications?schoolId=${school.id}&pageSize=1`)).body.items[0];
}

beforeEach(async () => {
  const schools = await resetDb();
  esc = schools.find((s) => s.slug === 'esc')!;
  iin = schools.find((s) => s.slug === 'iin')!;
  upsertLead = vi.fn<SalesforceClient['upsertLead']>().mockResolvedValue(LEAD_ID);
  mocked = createApp({ salesforce: { upsertLead } });
  group = as(await login(GROUP_ADMIN), mocked);
  escAdmin = as(await login(schoolAdmin('esc')), mocked);
});

afterEach(() => vi.unstubAllGlobals());

describe('POST /api/applications/:id/sync', () => {
  beforeEach(connect);

  it('creates the Lead and marks the application SYNCED', async () => {
    const target = await firstOf(esc);
    const res = await escAdmin.post(`/api/applications/${target.id}/sync`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      syncStatus: 'SYNCED',
      salesforceId: LEAD_ID,
      lastSyncError: null,
    });
    expect(res.body.lastSyncAt).toEqual(expect.any(String));
    expect(upsertLead).toHaveBeenCalledWith(
      expect.objectContaining({
        LastName: target.lastName,
        Email: target.email,
        Company: esc.name,
      }),
      null,
    );
  });

  it('is idempotent: a re-sync updates the same Lead', async () => {
    const target = await firstOf(esc);
    await escAdmin.post(`/api/applications/${target.id}/sync`);
    const res = await escAdmin.post(`/api/applications/${target.id}/sync`);
    expect(res.body).toMatchObject({ syncStatus: 'SYNCED', salesforceId: LEAD_ID });
    expect(upsertLead).toHaveBeenLastCalledWith(expect.any(Object), LEAD_ID);
  });

  it('stores a readable error on FAILED, then succeeds on retry', async () => {
    upsertLead.mockRejectedValueOnce(
      new SalesforceError('Required fields are missing: [Company]', 'REQUIRED_FIELD_MISSING'),
    );
    const target = await firstOf(esc);
    const failed = await escAdmin.post(`/api/applications/${target.id}/sync`);
    expect(failed.status).toBe(200);
    expect(failed.body).toMatchObject({
      syncStatus: 'FAILED',
      salesforceId: null,
      lastSyncError: 'Required fields are missing: [Company] (REQUIRED_FIELD_MISSING)',
    });
    const retried = await escAdmin.post(`/api/applications/${target.id}/sync`);
    expect(retried.body).toMatchObject({ syncStatus: 'SYNCED', lastSyncError: null });
  });

  it('hides unexpected errors behind a generic message', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    upsertLead.mockRejectedValueOnce(new Error('socket hang up'));
    const res = await escAdmin.post(`/api/applications/${(await firstOf(esc)).id}/sync`);
    expect(res.body.syncStatus).toBe('FAILED');
    expect(res.body.lastSyncError).not.toContain('socket');
  });

  it('rejects a second sync while one is PENDING (409)', async () => {
    const target = await firstOf(esc);
    await db
      .update(applications)
      .set({ syncStatus: 'PENDING' })
      .where(eq(applications.id, target.id));
    const res = await escAdmin.post(`/api/applications/${target.id}/sync`);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({
      code: 'INVALID_SYNC_TRANSITION',
      details: { from: 'PENDING', to: 'PENDING' },
    });
    expect(upsertLead).not.toHaveBeenCalled();
  });

  it('restarts a sync left PENDING for too long (crashed process)', async () => {
    const target = await firstOf(esc);
    const longAgo = new Date(Date.now() - 10 * 60_000);
    await db
      .update(applications)
      .set({ syncStatus: 'PENDING', updatedAt: longAgo })
      .where(eq(applications.id, target.id));
    const res = await escAdmin.post(`/api/applications/${target.id}/sync`);
    expect(res.status).toBe(200);
    expect(res.body.syncStatus).toBe('SYNCED');
  });

  it("answers 404 for another school's application", async () => {
    const res = await escAdmin.post(`/api/applications/${(await firstOf(iin)).id}/sync`);
    expect(res.status).toBe(404);
    expect(upsertLead).not.toHaveBeenCalled();
  });
});

describe('sync without a Salesforce connection', () => {
  it('answers 409 SALESFORCE_NOT_CONNECTED and leaves the status untouched', async () => {
    const target = await firstOf(esc);
    const res = await escAdmin.post(`/api/applications/${target.id}/sync`);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('SALESFORCE_NOT_CONNECTED');
    expect((await group.get(`/api/applications/${target.id}`)).body.syncStatus).toBe('NOT_SYNCED');
  });
});

describe('/api/integrations/salesforce', () => {
  it('reports the connection status', async () => {
    expect((await escAdmin.get('/api/integrations/salesforce/status')).body).toEqual({
      enabled: true,
      connected: false,
      instanceUrl: null,
      connectedAt: null,
    });
    await connect();
    expect((await escAdmin.get('/api/integrations/salesforce/status')).body).toMatchObject({
      connected: true,
      instanceUrl: 'https://acme.my.salesforce.com',
    });
  });

  it('only lets a GROUP_ADMIN start the OAuth flow', async () => {
    expect((await escAdmin.get('/api/integrations/salesforce/connect')).status).toBe(403);
    const res = await group.get('/api/integrations/salesforce/connect');
    expect(res.status).toBe(200);
    const url = new URL(res.body.url);
    expect(url.origin + url.pathname).toBe(
      'https://login.salesforce.test/services/oauth2/authorize',
    );
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      response_type: 'code',
      client_id: 'test-client-id',
      redirect_uri: 'http://localhost:3000/api/integrations/salesforce/callback',
      code_challenge_method: 'S256',
      state: expect.any(String),
      code_challenge: expect.any(String),
    });
  });

  it('callback exchanges the code (with the PKCE verifier) and stores encrypted tokens', async () => {
    const authorize = new URL((await group.get('/api/integrations/salesforce/connect')).body.url);
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            access_token: 'access-123',
            refresh_token: 'refresh-456',
            instance_url: 'https://acme.my.salesforce.com',
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    const res = await request(app).get(
      `/api/integrations/salesforce/callback?code=auth-code&state=${authorize.searchParams.get('state')}`,
    );
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('http://localhost:5173/applications?salesforce=connected');

    const body = new URLSearchParams(String(fetchMock.mock.calls[0]![1].body));
    expect(body.get('grant_type')).toBe('authorization_code');
    expect(body.get('code')).toBe('auth-code');
    expect(body.get('code_verifier')).toEqual(expect.any(String));

    const [row] = await db.select().from(salesforceConnections);
    expect(row).toMatchObject({ instanceUrl: 'https://acme.my.salesforce.com' });
    expect(row!.encryptedRefreshToken).not.toContain('refresh-456');
    expect(row!.encryptedAccessToken).not.toContain('access-123');
  });

  it('refuses tokens whose instance_url is not a Salesforce https host', async () => {
    const authorize = new URL((await group.get('/api/integrations/salesforce/connect')).body.url);
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({
              access_token: 'a',
              refresh_token: 'r',
              instance_url: 'https://evil.example.com',
            }),
            { status: 200 },
          ),
        ),
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(app).get(
      `/api/integrations/salesforce/callback?code=c&state=${authorize.searchParams.get('state')}`,
    );
    expect(res.headers.location).toBe(
      'http://localhost:5173/applications?salesforce=error&reason=INTERNAL_ERROR',
    );
    expect(await db.select().from(salesforceConnections)).toEqual([]);
  });

  it('never accepts an OAuth state as a session token', async () => {
    const state = new URL(
      (await group.get('/api/integrations/salesforce/connect')).body.url,
    ).searchParams.get('state')!;
    expect((await as(state).get('/api/applications')).status).toBe(401);
  });

  it.each([
    ['a forged state', 'code=x&state=forged', 'INVALID_STATE'],
    ['a denied consent', 'error=access_denied&error_description=end-user+denied', 'access_denied'],
    ['a missing code', 'state=x', 'INVALID_CALLBACK'],
    ['an unexpected error value', 'error=%3Cscript%3E', 'OAUTH_ERROR'],
  ])('callback sends the user back with an error on %s', async (_case, query, reason) => {
    const res = await request(app).get(`/api/integrations/salesforce/callback?${query}`);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(
      `http://localhost:5173/applications?salesforce=error&reason=${reason}`,
    );
    expect(await db.select().from(salesforceConnections)).toEqual([]);
  });
});
