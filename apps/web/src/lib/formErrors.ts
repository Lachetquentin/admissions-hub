import type { z } from 'zod';
import { ApiRequestError } from '../api/client';

export type FieldErrors = Partial<Record<string, string>>;

/** First message per field, from a client-side Zod error. */
export function zodFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.');
    errors[key] ??= issue.message;
  }
  return errors;
}

/** Same shape, from a 400 VALIDATION_ERROR answered by the API. */
export function apiFieldErrors(error: unknown): FieldErrors {
  if (!(error instanceof ApiRequestError) || !Array.isArray(error.details)) return {};
  const errors: FieldErrors = {};
  for (const detail of error.details as { path?: string; message?: string }[]) {
    if (detail.path && detail.message) errors[detail.path] ??= detail.message;
  }
  return errors;
}
