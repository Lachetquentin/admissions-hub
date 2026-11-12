import type { Application, ApplicationInput, School } from '@admissions-hub/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { GROUP_ADMIN, as, login, resetDb, schoolAdmin } from './helpers';

const PER_SCHOOL = 12;
const MISSING_ID = '00000000-0000-4000-8000-000000000000';

let esc: School;
let iin: School;
let group: ReturnType<typeof as>;
let escAdmin: ReturnType<typeof as>;

const newApplication = (schoolId: string): ApplicationInput => ({
  schoolId,
  firstName: 'Grace',
  lastName: 'Hopper',
  email: 'grace@example.com',
  phone: '+33 6 00 00 00 00',
  program: 'MSc Data',
});

/** First application of a school, read as GROUP_ADMIN. */
async function firstOf(school: School): Promise<Application> {
  const res = await group.get(`/api/applications?schoolId=${school.id}&pageSize=1`);
  return res.body.items[0];
}

// Fresh data for every test; tokens are re-issued since the reseed changes every id.
beforeEach(async () => {
  const schools = await resetDb();
  esc = schools.find((s) => s.slug === 'esc')!;
  iin = schools.find((s) => s.slug === 'iin')!;
  group = as(await login(GROUP_ADMIN));
  escAdmin = as(await login(schoolAdmin('esc')));
});

describe('GET /api/applications', () => {
  it('GROUP_ADMIN lists every school, paginated, newest first', async () => {
    const res = await group.get('/api/applications?page=2&pageSize=5');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ page: 2, pageSize: 5, total: PER_SCHOOL * 3 });
    expect(res.body.items).toHaveLength(5);
    const dates = res.body.items.map((a: Application) => a.createdAt);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it('filters by school and status', async () => {
    const res = await group.get(`/api/applications?schoolId=${iin.id}&status=ACCEPTED&pageSize=100`);
    expect(res.body.total).toBeGreaterThan(0);
    for (const a of res.body.items as Application[]) {
      expect(a).toMatchObject({ schoolId: iin.id, status: 'ACCEPTED' });
    }
  });

  it('SCHOOL_ADMIN only gets their own school', async () => {
    const res = await escAdmin.get('/api/applications?pageSize=100');
    expect(res.body.total).toBe(PER_SCHOOL);
    expect(new Set(res.body.items.map((a: Application) => a.schoolId))).toEqual(new Set([esc.id]));
  });

  it('SCHOOL_ADMIN filtering on another school gets nothing', async () => {
    const res = await escAdmin.get(`/api/applications?schoolId=${iin.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ items: [], total: 0 });
  });

  it('rejects invalid filters', async () => {
    const res = await group.get('/api/applications?status=ARCHIVED');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/applications/:id', () => {
  it('returns an application of the own school', async () => {
    const target = await firstOf(esc);
    const res = await escAdmin.get(`/api/applications/${target.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(target);
    expect(res.body.syncStatus).toBe('NOT_SYNCED');
  });

  it("answers 404 to a SCHOOL_ADMIN asking for another school's application", async () => {
    const other = await firstOf(iin);
    const res = await escAdmin.get(`/api/applications/${other.id}`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Application not found' } });
  });

  it.each([MISSING_ID, 'not-a-uuid'])('answers 404 for unknown id %s', async (id) => {
    expect((await group.get(`/api/applications/${id}`)).status).toBe(404);
  });
});

describe('POST /api/applications', () => {
  it('creates an application with status NEW by default', async () => {
    const res = await escAdmin.post('/api/applications').send(newApplication(esc.id));
    expect(res.status).toBe(201);
    expect(res.headers.location).toBe(`/api/applications/${res.body.id}`);
    expect(res.body).toMatchObject({ schoolId: esc.id, status: 'NEW', syncStatus: 'NOT_SYNCED' });
  });

  it('GROUP_ADMIN can create in any school', async () => {
    const res = await group.post('/api/applications').send(newApplication(iin.id));
    expect(res.status).toBe(201);
  });

  it('SCHOOL_ADMIN cannot create in another school (404)', async () => {
    const res = await escAdmin.post('/api/applications').send(newApplication(iin.id));
    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('School not found');
  });

  it('rejects invalid input with field details', async () => {
    const res = await escAdmin
      .post('/api/applications')
      .send({ ...newApplication(esc.id), email: 'nope', firstName: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d: { path: string }) => d.path).sort()).toEqual([
      'email',
      'firstName',
    ]);
  });
});

describe('PATCH /api/applications/:id', () => {
  it('updates fields of an own application, never its school', async () => {
    const target = await firstOf(esc);
    const res = await escAdmin
      .patch(`/api/applications/${target.id}`)
      .send({ status: 'REVIEWING', program: 'MBA', schoolId: iin.id });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'REVIEWING', program: 'MBA', schoolId: esc.id });
    expect(new Date(res.body.updatedAt) > new Date(target.updatedAt)).toBe(true);
  });

  it("answers 404 on another school's application and leaves it untouched", async () => {
    const other = await firstOf(iin);
    const res = await escAdmin.patch(`/api/applications/${other.id}`).send({ status: 'REJECTED' });
    expect(res.status).toBe(404);
    expect((await group.get(`/api/applications/${other.id}`)).body.status).toBe(other.status);
  });

  it('rejects an empty patch', async () => {
    const target = await firstOf(esc);
    expect((await escAdmin.patch(`/api/applications/${target.id}`).send({})).status).toBe(400);
  });
});

describe('DELETE /api/applications/:id', () => {
  it('deletes an own application', async () => {
    const target = await firstOf(esc);
    expect((await escAdmin.delete(`/api/applications/${target.id}`)).status).toBe(204);
    expect((await escAdmin.get(`/api/applications/${target.id}`)).status).toBe(404);
  });

  it("answers 404 on another school's application and keeps it", async () => {
    const other = await firstOf(iin);
    expect((await escAdmin.delete(`/api/applications/${other.id}`)).status).toBe(404);
    expect((await group.get(`/api/applications/${other.id}`)).status).toBe(200);
  });
});
