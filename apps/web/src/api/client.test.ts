import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError, apiFetch, setUnauthorizedHandler, toQuery, tokenStore } from './client';
import { apiFieldErrors } from '@/lib/formErrors';

const respond = (status: number, body?: unknown) =>
  vi.fn().mockResolvedValue(new Response(body === undefined ? null : JSON.stringify(body), { status }));

beforeEach(() => tokenStore.clear());
afterEach(() => vi.unstubAllGlobals());

describe('apiFetch', () => {
  it('sends the bearer token and JSON body', async () => {
    tokenStore.set('jwt');
    const fetchMock = respond(201, { id: '1' });
    vi.stubGlobal('fetch', fetchMock);
    await expect(apiFetch('/applications', { method: 'POST', body: { a: 1 } })).resolves.toEqual({ id: '1' });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/applications');
    expect(init.headers).toEqual({ Authorization: 'Bearer jwt', 'Content-Type': 'application/json' });
    expect(init.body).toBe('{"a":1}');
  });

  it('turns the API error format into an ApiRequestError with field details', async () => {
    const details = [{ path: 'email', message: 'Adresse e-mail invalide' }];
    vi.stubGlobal('fetch', respond(400, { error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details } }));
    const error = await apiFetch('/applications').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error).toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });
    expect(apiFieldErrors(error)).toEqual({ email: 'Adresse e-mail invalide' });
  });

  it('logs out on a 401 when a token was sent', async () => {
    tokenStore.set('expired');
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    vi.stubGlobal('fetch', respond(401, { error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } }));
    await expect(apiFetch('/auth/me')).rejects.toThrow('Invalid or expired token');
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('returns nothing for 204 and reports network failures in French', async () => {
    vi.stubGlobal('fetch', respond(204));
    await expect(apiFetch('/applications/1', { method: 'DELETE' })).resolves.toBeUndefined();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(apiFetch('/applications')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });
});

describe('toQuery', () => {
  it('skips empty values', () => {
    expect(toQuery({ page: 2, status: undefined, schoolId: '' })).toBe('?page=2');
    expect(toQuery({})).toBe('');
  });
});
