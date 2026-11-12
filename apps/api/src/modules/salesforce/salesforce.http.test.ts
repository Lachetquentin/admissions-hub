import { afterEach, describe, expect, it, vi } from 'vitest';
import { salesforceConfig } from './salesforce.oauth';
import { SalesforceError, type LeadFields } from './salesforce.client';
import type { SalesforceTokens, TokenStore } from './salesforce.connection';
import { createHttpSalesforceClient } from './salesforce.http';

const lead: LeadFields = {
  FirstName: 'Ada',
  LastName: 'Lovelace',
  Email: 'ada@example.com',
  Phone: '+33 6 00 00 00 00',
  Company: 'ESC',
  LeadSource: 'Web',
  Status: 'Open - Not Contacted',
  Description: '',
};
const tokens: SalesforceTokens = {
  instanceUrl: 'https://acme.my.salesforce.com',
  accessToken: 'old-access',
  refreshToken: 'refresh',
};

const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });

function setup(responses: Response[], stored: SalesforceTokens | null = tokens) {
  const fetchMock = vi.fn();
  for (const r of responses) fetchMock.mockResolvedValueOnce(r);
  vi.stubGlobal('fetch', fetchMock);
  const store: TokenStore = { get: vi.fn().mockResolvedValue(stored), saveAccessToken: vi.fn() };
  return { fetchMock, store, client: createHttpSalesforceClient(salesforceConfig(), store) };
}
const call = (fetchMock: ReturnType<typeof vi.fn>, i: number) => {
  const [url, init] = fetchMock.mock.calls[i]!;
  return {
    url: String(url),
    method: init.method,
    auth: init.headers?.Authorization,
    body: init.body,
  };
};

afterEach(() => vi.unstubAllGlobals());

describe('HTTP Salesforce client', () => {
  it('creates a Lead when there is no Salesforce id yet', async () => {
    const { client, fetchMock } = setup([json(201, { id: '00Q000000000001AAA', success: true })]);
    await expect(client.upsertLead(lead, null)).resolves.toBe('00Q000000000001AAA');
    expect(call(fetchMock, 0)).toMatchObject({
      url: 'https://acme.my.salesforce.com/services/data/v62.0/sobjects/Lead',
      method: 'POST',
      auth: 'Bearer old-access',
      body: JSON.stringify(lead),
    });
  });

  it('updates the existing Lead instead of creating a duplicate', async () => {
    const { client, fetchMock } = setup([json(204)]);
    await expect(client.upsertLead(lead, '00Q000000000001AAA')).resolves.toBe('00Q000000000001AAA');
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(call(fetchMock, 0)).toMatchObject({
      method: 'PATCH',
      url: expect.stringMatching(/\/sobjects\/Lead\/00Q000000000001AAA$/),
    });
  });

  it('creates a new Lead when the stored one was deleted in Salesforce', async () => {
    const { client } = setup([
      json(404, [{ message: 'entity is deleted', errorCode: 'ENTITY_IS_DELETED' }]),
      json(201, { id: '00Q000000000002AAA' }),
    ]);
    await expect(client.upsertLead(lead, '00Q000000000001AAA')).resolves.toBe('00Q000000000002AAA');
  });

  it('refreshes an expired access token once, stores it and retries', async () => {
    const { client, fetchMock, store } = setup([
      json(401, [{ message: 'Session expired or invalid', errorCode: 'INVALID_SESSION_ID' }]),
      json(200, { access_token: 'new-access', instance_url: 'https://acme.my.salesforce.com' }),
      json(201, { id: '00Q000000000003AAA' }),
    ]);
    await expect(client.upsertLead(lead, null)).resolves.toBe('00Q000000000003AAA');
    expect(call(fetchMock, 1).url).toBe('https://login.salesforce.test/services/oauth2/token');
    expect(String(call(fetchMock, 1).body)).toContain('grant_type=refresh_token');
    expect(store.saveAccessToken).toHaveBeenCalledWith(
      'new-access',
      'https://acme.my.salesforce.com',
    );
    expect(call(fetchMock, 2).auth).toBe('Bearer new-access');
  });

  it('surfaces the Salesforce error message and code', async () => {
    const { client } = setup([
      json(400, [
        { message: 'Required fields are missing: [Company]', errorCode: 'REQUIRED_FIELD_MISSING' },
      ]),
    ]);
    const error = await client.upsertLead(lead, null).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(SalesforceError);
    expect(error).toMatchObject({
      message: 'Required fields are missing: [Company]',
      code: 'REQUIRED_FIELD_MISSING',
    });
  });

  it('fails clearly when Salesforce is not connected or unreachable', async () => {
    await expect(setup([], null).client.upsertLead(lead, null)).rejects.toMatchObject({
      code: 'NOT_CONNECTED',
    });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    const store: TokenStore = { get: vi.fn().mockResolvedValue(tokens), saveAccessToken: vi.fn() };
    await expect(
      createHttpSalesforceClient(salesforceConfig(), store).upsertLead(lead, null),
    ).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });
});
