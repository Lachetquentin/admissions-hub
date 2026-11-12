import { z } from 'zod';
import { idSchema } from './common';
import { roleSchema } from '../enums';

export const loginSchema = z.object({
  email: z.email('Adresse e-mail invalide').trim().toLowerCase(),
  password: z.string().min(1, 'Mot de passe requis'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const authUserSchema = z.object({
  id: idSchema,
  email: z.email(),
  name: z.string(),
  role: roleSchema,
  schoolId: idSchema.nullable(),
});
export type AuthUser = z.infer<typeof authUserSchema>;

export const loginResponseSchema = z.object({ token: z.string(), user: authUserSchema });
export type LoginResponse = z.infer<typeof loginResponseSchema>;
