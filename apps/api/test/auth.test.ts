import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { GROUP_ADMIN, app, as, login, resetDb, schoolAdmin } from './helpers';

beforeAll(async () => {
  await resetDb();
});

describe('POST /api/auth/login', () => {
  it('returns a token and the user for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ESC@admissions.test', password: 'admissions-demo' });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ email: 'esc@admissions.test', role: 'SCHOOL_ADMIN' });
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it.each([
    ['wrong password', { email: GROUP_ADMIN, password: 'nope' }],
    ['unknown email', { email: 'ghost@admissions.test', password: 'admissions-demo' }],
  ])('answers 401 with the same message for a %s', async (_case, body) => {
    const res = await request(app).post('/api/auth/login').send(body);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' },
    });
  });

  it('answers 400 VALIDATION_ERROR for a malformed body', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: 'email' })]),
    );
  });
});

describe('protected routes', () => {
  it('reject requests without a token', async () => {
    const res = await request(app).get('/api/applications');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('reject an invalid token', async () => {
    const res = await as('not-a-jwt').get('/api/applications');
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid or expired token');
  });

  it('GET /api/auth/me returns the logged-in user', async () => {
    const res = await as(await login(schoolAdmin('iin'))).get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email: 'iin@admissions.test', role: 'SCHOOL_ADMIN' });
  });
});

describe('error format', () => {
  it('answers 404 NOT_FOUND for unknown routes', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Route GET /api/nope not found' },
    });
  });

  it('answers 400 INVALID_JSON for a malformed JSON body', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('serves the OpenAPI document', async () => {
    const res = await request(app).get('/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.paths).toHaveProperty('/applications/{id}');
  });
});
