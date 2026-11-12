import type { School } from '@admissions-hub/shared';
import { beforeAll, describe, expect, it } from 'vitest';
import { GROUP_ADMIN, as, login, resetDb, schoolAdmin } from './helpers';

let schools: School[];
let esc: School;
let iin: School;

beforeAll(async () => {
  schools = await resetDb();
  esc = schools.find((s) => s.slug === 'esc')!;
  iin = schools.find((s) => s.slug === 'iin')!;
});

describe('/api/schools', () => {
  it('GROUP_ADMIN sees every school', async () => {
    const res = await as(await login(GROUP_ADMIN)).get('/api/schools');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(schools.length);
  });

  it('SCHOOL_ADMIN only sees their own school', async () => {
    const res = await as(await login(schoolAdmin('esc'))).get('/api/schools');
    expect(res.body).toEqual([esc]);
  });

  it('SCHOOL_ADMIN gets 404 for another school', async () => {
    const token = await login(schoolAdmin('esc'));
    expect((await as(token).get(`/api/schools/${esc.id}`)).status).toBe(200);
    expect((await as(token).get(`/api/schools/${iin.id}`)).status).toBe(404);
  });
});
