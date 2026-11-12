import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { loginSchema, type AuthUser, type LoginResponse } from '@admissions-hub/shared';
import { db } from '../../db/client';
import { users, type UserRow } from '../../db/schema';
import { signToken } from '../../lib/auth';
import { unauthorized } from '../../lib/httpErrors';
import { verifyPassword } from '../../lib/password';
import { requireAuth } from '../../middleware/auth';

const toAuthUser = ({ id, email, name, role, schoolId }: UserRow): AuthUser => ({
  id,
  email,
  name,
  role,
  schoolId,
});

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const [user] = await db.select().from(users).where(eq(users.email, email));
  // Same error for unknown email and wrong password: no account enumeration.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw unauthorized('Invalid email or password');
  }
  const response: LoginResponse = { token: signToken(user), user: toAuthUser(user) };
  res.json(response);
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const [user] = await db.select().from(users).where(eq(users.id, req.user?.sub ?? ''));
  if (!user) throw unauthorized('Account no longer exists');
  res.json(toAuthUser(user));
});
