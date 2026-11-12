import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { idSchema, roleSchema, type AuthUser } from '@admissions-hub/shared';
import { env } from '../config/env';
import { forbidden, unauthorized } from './httpErrors';

const tokenUserSchema = z.object({
  sub: idSchema,
  role: roleSchema,
  schoolId: idSchema.nullable(),
});
export type TokenUser = z.infer<typeof tokenUserSchema>;

/**
 * What a request may see: `schoolId: null` means every school (GROUP_ADMIN),
 * otherwise only that school (SCHOOL_ADMIN).
 */
export type SchoolScope = { schoolId: string | null };

export function signToken(user: Pick<AuthUser, 'id' | 'role' | 'schoolId'>): string {
  const payload: Omit<TokenUser, 'sub'> = { role: user.role, schoolId: user.schoolId };
  return jwt.sign(payload, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): TokenUser {
  try {
    return tokenUserSchema.parse(jwt.verify(token, env.JWT_SECRET));
  } catch {
    throw unauthorized('Invalid or expired token');
  }
}

export function scopeFor(user: TokenUser): SchoolScope {
  if (user.role === 'GROUP_ADMIN') return { schoolId: null };
  // A SCHOOL_ADMIN without a school must never fall back to "all schools".
  if (!user.schoolId) throw forbidden('No school assigned to this account');
  return { schoolId: user.schoolId };
}
