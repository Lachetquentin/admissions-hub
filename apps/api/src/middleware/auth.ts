import type { Request, RequestHandler } from 'express';
import { scopeFor, verifyToken, type SchoolScope } from '../lib/auth';
import { unauthorized } from '../lib/httpErrors';

/** Rejects requests without a valid `Authorization: Bearer <jwt>` header. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
  if (scheme !== 'Bearer' || !token) throw unauthorized();
  req.user = verifyToken(token);
  next();
};

/**
 * Multi-school isolation: derives which school(s) the user may touch from their role.
 * Every data access in the API filters with this scope, so the front is never trusted.
 */
export const schoolScope: RequestHandler = (req, _res, next) => {
  if (!req.user) throw unauthorized();
  req.scope = scopeFor(req.user);
  next();
};

export function scopeOf(req: Request): SchoolScope {
  if (!req.scope) throw unauthorized();
  return req.scope;
}
