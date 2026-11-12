import { sql } from 'drizzle-orm';
import type { Express } from 'express';
import request from 'supertest';
import { afterAll } from 'vitest';
import type { LoginResponse, School } from '@admissions-hub/shared';
import { createApp } from '../src/app';
import { db, pool } from '../src/db/client';
import { schools } from '../src/db/schema';
import { SEED_PASSWORD, seed } from '../src/db/seed';

export const app = createApp();

afterAll(async () => {
  await pool.end();
});

/** Wipes the test database and reloads the deterministic seed (3 schools × 12 applications). */
export async function resetDb(): Promise<School[]> {
  await db.execute(sql`truncate applications, users, schools restart identity cascade`);
  await seed(db);
  return db.select({ id: schools.id, name: schools.name, slug: schools.slug }).from(schools);
}

export async function login(email: string): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ email, password: SEED_PASSWORD });
  return (res.body as LoginResponse).token;
}

export const GROUP_ADMIN = 'groupe@admissions.test';
export const schoolAdmin = (slug: string) => `${slug}@admissions.test`;

/** Supertest agent sending the bearer token on every call (to `target`, the shared app by default). */
export const as = (token: string, target: Express = app) => ({
  get: (url: string) => request(target).get(url).set('Authorization', `Bearer ${token}`),
  post: (url: string) => request(target).post(url).set('Authorization', `Bearer ${token}`),
  patch: (url: string) => request(target).patch(url).set('Authorization', `Bearer ${token}`),
  delete: (url: string) => request(target).delete(url).set('Authorization', `Bearer ${token}`),
});
