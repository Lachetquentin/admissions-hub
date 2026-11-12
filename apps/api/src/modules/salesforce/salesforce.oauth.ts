import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env, type SalesforceConfig } from '../../config/env';
import { decryptSecret, encryptSecret } from '../../lib/crypto';
import { HttpError } from '../../lib/httpErrors';
import { SalesforceError } from './salesforce.client';

/**
 * OAuth 2.0 Web Server Flow with PKCE against Salesforce.
 * https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_web_server_flow.htm
 */

/** Every Salesforce route answers 503 when the server runs with SALESFORCE_ENABLED=false. */
export function salesforceConfig(): SalesforceConfig {
  if (!env.salesforce)
    throw new HttpError(
      503,
      'SALESFORCE_DISABLED',
      'Salesforce integration is disabled on this server',
    );
  return env.salesforce;
}

export const SCOPES = 'api refresh_token';
const STATE_AUDIENCE = 'salesforce-oauth';

export function createPkce() {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

/**
 * `state` is a short-lived JWT: it ties the callback to the admin who started the flow (CSRF)
 * and carries the PKCE verifier encrypted, so the server stays stateless.
 */
export function signState(config: SalesforceConfig, userId: string, verifier: string): string {
  return jwt.sign({ v: encryptSecret(verifier, config.encryptionKey) }, env.JWT_SECRET, {
    subject: userId,
    audience: STATE_AUDIENCE,
    expiresIn: '10m',
  });
}

const statePayload = z.object({ sub: z.uuid(), v: z.string() });

export function verifyState(
  config: SalesforceConfig,
  state: string,
): { userId: string; verifier: string } {
  try {
    const payload = statePayload.parse(
      jwt.verify(state, env.JWT_SECRET, { audience: STATE_AUDIENCE }),
    );
    return { userId: payload.sub, verifier: decryptSecret(payload.v, config.encryptionKey) };
  } catch {
    throw new SalesforceError('Invalid or expired OAuth state', 'INVALID_STATE');
  }
}

export function authorizeUrl(
  config: SalesforceConfig,
  state: string,
  codeChallenge: string,
): string {
  const url = new URL('/services/oauth2/authorize', config.loginUrl);
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  }).toString();
  return url.toString();
}

const tokenResponse = z.object({
  access_token: z.string(),
  instance_url: z.url(),
  refresh_token: z.string().optional(),
});
export type TokenResponse = z.infer<typeof tokenResponse>;

async function tokenRequest(
  config: SalesforceConfig,
  params: Record<string, string>,
): Promise<TokenResponse> {
  let res: Response;
  try {
    res = await fetch(new URL('/services/oauth2/token', config.loginUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        ...params,
      }),
    });
  } catch {
    throw new SalesforceError('Salesforce is unreachable', 'NETWORK_ERROR');
  }
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const error = z
      .object({ error: z.string(), error_description: z.string().optional() })
      .safeParse(body);
    throw new SalesforceError(
      error.success
        ? (error.data.error_description ?? error.data.error)
        : `Token endpoint answered ${res.status}`,
      error.success ? error.data.error : 'TOKEN_ERROR',
    );
  }
  return tokenResponse.parse(body);
}

export const exchangeCode = (config: SalesforceConfig, code: string, codeVerifier: string) =>
  tokenRequest(config, {
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier,
  });

export const refreshAccessToken = (config: SalesforceConfig, refreshToken: string) =>
  tokenRequest(config, { grant_type: 'refresh_token', refresh_token: refreshToken });
