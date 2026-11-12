import { eq, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import type { SchoolScope } from './auth';

/** SQL condition restricting `column` (a school id) to the scope; undefined = no restriction. */
export const inScope = (column: PgColumn, scope: SchoolScope): SQL | undefined =>
  scope.schoolId === null ? undefined : eq(column, scope.schoolId);

/** Parses a path id; anything that is not a uuid is simply "not found". */
export { idSchema } from '@admissions-hub/shared';
