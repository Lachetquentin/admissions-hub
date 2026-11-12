import { describe, expect, it } from 'vitest';
import {
  applicationInputSchema,
  applicationListQuerySchema,
  applicationUpdateSchema,
} from './application';

const valid = {
  schoolId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  firstName: ' Ada ',
  lastName: 'Lovelace',
  email: 'ADA@Example.com',
  phone: '+33 6 12 34 56 78',
  program: 'MSc Data',
};

describe('applicationInputSchema', () => {
  it('normalises input and defaults status to NEW', () => {
    const parsed = applicationInputSchema.parse(valid);
    expect(parsed).toMatchObject({ firstName: 'Ada', email: 'ada@example.com', status: 'NEW' });
  });

  it.each([
    ['email', 'not-an-email'],
    ['phone', 'abc'],
    ['firstName', '   '],
    ['schoolId', 'not-a-uuid'],
    ['status', 'ARCHIVED'],
  ])('rejects an invalid %s', (field, value) => {
    const result = applicationInputSchema.safeParse({ ...valid, [field]: value });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual([field]);
  });
});

describe('applicationUpdateSchema', () => {
  it('rejects an empty patch', () => {
    expect(applicationUpdateSchema.safeParse({}).success).toBe(false);
  });

  it('ignores schoolId so an application cannot change school', () => {
    expect(applicationUpdateSchema.parse({ schoolId: valid.schoolId, status: 'ACCEPTED' })).toEqual(
      {
        status: 'ACCEPTED',
      },
    );
  });
});

describe('applicationListQuerySchema', () => {
  it('coerces pagination from query strings', () => {
    expect(applicationListQuerySchema.parse({ page: '2', pageSize: '5' })).toEqual({
      page: 2,
      pageSize: 5,
    });
  });

  it('caps pageSize', () => {
    expect(applicationListQuerySchema.safeParse({ pageSize: '1000' }).success).toBe(false);
  });
});
