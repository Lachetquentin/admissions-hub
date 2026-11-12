import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import type { ApiError } from '@admissions-hub/shared';
import { HttpError, notFound } from '../lib/httpErrors';

const body = (code: string, message: string, details?: unknown): ApiError => ({
  error: details === undefined ? { code, message } : { code, message, details },
});

/** Unknown routes. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(notFound(`Route ${req.method} ${req.path}`));
};

/** The only place where errors become HTTP responses: every error has the same shape. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json(body(err.code, err.message, err.details));
    return;
  }
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    res.status(400).json(body('VALIDATION_ERROR', 'Invalid request', details));
    return;
  }
  // Malformed JSON body (thrown by express.json()).
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json(body('INVALID_JSON', 'Malformed JSON body'));
    return;
  }
  console.error(err);
  res.status(500).json(body('INTERNAL_ERROR', 'Something went wrong'));
};
