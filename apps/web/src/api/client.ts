import type { ApiError } from '@admissions-hub/shared';

const TOKEN_KEY = 'admissions-hub.token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/** An error answered by the API, in its `{ error: { code, message, details } }` format. */
export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

let onUnauthorized: () => void = () => {};
/** Called when an authenticated request answers 401 (expired or revoked token). */
export const setUnauthorizedHandler = (handler: () => void) => {
  onUnauthorized = handler;
};

type Options = { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown };

export async function apiFetch<T>(
  path: string,
  { method = 'GET', body }: Options = {},
): Promise<T> {
  const token = tokenStore.get();
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiRequestError(
      0,
      'NETWORK_ERROR',
      'Le serveur est injoignable. Réessayez dans un instant.',
    );
  }

  if (res.status === 204) return undefined as T;
  const payload: unknown = await res.json().catch(() => null);
  if (res.ok) return payload as T;

  if (res.status === 401 && token) onUnauthorized();
  const error = (payload as ApiError | null)?.error;
  throw new ApiRequestError(
    res.status,
    error?.code ?? 'HTTP_ERROR',
    error?.message ?? `Erreur ${res.status}`,
    error?.details,
  );
}

/** Query string from an object, skipping empty values. */
export function toQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}
