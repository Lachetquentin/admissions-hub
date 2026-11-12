import { Router } from 'express';
import { z } from 'zod';
import {
  SALESFORCE_CALLBACK_PARAM,
  type SalesforceCallbackResult,
  type SalesforceConnect,
  type SalesforceStatus,
} from '@admissions-hub/shared';
import { env } from '../../config/env';
import { requireAuth, requireRole } from '../../middleware/auth';
import { SalesforceError } from './salesforce.client';
import { getConnection, saveConnection } from './salesforce.connection';
import {
  authorizeUrl,
  createPkce,
  exchangeCode,
  salesforceConfig,
  signState,
  verifyState,
} from './salesforce.oauth';

/** Where the browser lands after the callback, e.g. /applications?salesforce=connected */
function backToApp(result: SalesforceCallbackResult, reason?: string): string {
  const url = new URL('/applications', env.APP_URL);
  url.searchParams.set(SALESFORCE_CALLBACK_PARAM, result);
  if (reason) url.searchParams.set('reason', reason);
  return url.toString();
}

const callbackQuery = z.union([
  z.object({ code: z.string().min(1), state: z.string().min(1) }),
  z.object({ error: z.string(), error_description: z.string().optional() }),
]);

export const salesforceRouter = Router();

salesforceRouter.get('/status', requireAuth, async (_req, res) => {
  const connection = env.salesforce ? await getConnection() : null;
  const status: SalesforceStatus = {
    enabled: env.salesforce !== null,
    connected: connection !== null,
    instanceUrl: connection?.instanceUrl ?? null,
    connectedAt: connection?.createdAt.toISOString() ?? null,
  };
  res.json(status);
});

/** Step 1: a GROUP_ADMIN asks for the Salesforce authorization page, then opens it. */
salesforceRouter.get('/connect', requireAuth, requireRole('GROUP_ADMIN'), (req, res) => {
  const config = salesforceConfig();
  const { verifier, challenge } = createPkce();
  const body: SalesforceConnect = {
    url: authorizeUrl(config, signState(config, req.user!.sub, verifier), challenge),
  };
  res.json(body);
});

/**
 * Step 2: Salesforce redirects the browser here. A browser redirect carries no bearer token,
 * so the signed `state` is what proves which admin started the flow.
 */
salesforceRouter.get('/callback', async (req, res) => {
  const query = callbackQuery.safeParse(req.query);
  if (!env.salesforce) return res.redirect(backToApp('error', 'SALESFORCE_DISABLED'));
  if (!query.success) return res.redirect(backToApp('error', 'INVALID_CALLBACK'));
  if ('error' in query.data) return res.redirect(backToApp('error', query.data.error));

  const config = env.salesforce;
  try {
    const { userId, verifier } = verifyState(config, query.data.state);
    const tokens = await exchangeCode(config, query.data.code, verifier);
    if (!tokens.refresh_token)
      throw new SalesforceError('No refresh token granted', 'NO_REFRESH_TOKEN');
    await saveConnection(
      config,
      {
        instanceUrl: tokens.instance_url,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      },
      userId,
    );
    res.redirect(backToApp('connected'));
  } catch (error) {
    if (!(error instanceof SalesforceError)) console.error(error);
    res.redirect(
      backToApp('error', error instanceof SalesforceError ? error.code : 'INTERNAL_ERROR'),
    );
  }
});
