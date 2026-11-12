import { z } from 'zod';
import type { SalesforceConfig } from '../../config/env';
import { SalesforceError, type LeadFields, type SalesforceClient } from './salesforce.client';
import type { TokenStore } from './salesforce.connection';
import { refreshAccessToken } from './salesforce.oauth';

/** Salesforce REST errors are an array of `{ message, errorCode }`. */
const restErrors = z.array(z.object({ message: z.string(), errorCode: z.string() })).min(1);

/** Lead ids that no longer exist: a re-sync then creates a fresh Lead. */
const GONE = new Set(['NOT_FOUND', 'ENTITY_IS_DELETED']);

type Method = 'POST' | 'PATCH';

/** REST client for the Lead object, refreshing the access token once on 401. */
export function createHttpSalesforceClient(
  config: SalesforceConfig,
  store: TokenStore,
): SalesforceClient {
  async function send(
    method: Method,
    path: string,
    body: unknown,
    accessToken: string,
    instanceUrl: string,
  ) {
    try {
      return await fetch(`${instanceUrl}/services/data/${config.apiVersion}${path}`, {
        method,
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {
      throw new SalesforceError('Salesforce is unreachable', 'NETWORK_ERROR');
    }
  }

  async function request(method: Method, path: string, body: unknown): Promise<unknown> {
    const tokens = await store.get();
    if (!tokens) throw new SalesforceError('Salesforce is not connected', 'NOT_CONNECTED');

    let res = await send(method, path, body, tokens.accessToken, tokens.instanceUrl);
    if (res.status === 401) {
      // Access tokens expire with the Salesforce session: refresh once, then retry.
      const fresh = await refreshAccessToken(config, tokens.refreshToken);
      await store.saveAccessToken(fresh.access_token, fresh.instance_url);
      res = await send(method, path, body, fresh.access_token, fresh.instance_url);
    }

    if (res.status === 204) return null;
    const payload: unknown = await res.json().catch(() => null);
    if (res.ok) return payload;
    const errors = restErrors.safeParse(payload);
    const first = errors.success ? errors.data[0] : undefined;
    if (first) throw new SalesforceError(first.message, first.errorCode);
    throw new SalesforceError(`Salesforce answered ${res.status}`, `HTTP_${res.status}`);
  }

  return {
    async upsertLead(fields: LeadFields, existingId: string | null): Promise<string> {
      if (existingId) {
        try {
          await request('PATCH', `/sobjects/Lead/${encodeURIComponent(existingId)}`, fields);
          return existingId;
        } catch (error) {
          if (!(error instanceof SalesforceError && GONE.has(error.code))) throw error;
        }
      }
      const created = z
        .object({ id: z.string() })
        .parse(await request('POST', '/sobjects/Lead', fields));
      return created.id;
    },
  };
}
