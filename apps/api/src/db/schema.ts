import { index, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { APPLICATION_STATUSES, ROLES, SYNC_STATUSES } from '@admissions-hub/shared';

export const roleEnum = pgEnum('role', ROLES);
export const applicationStatusEnum = pgEnum('application_status', APPLICATION_STATUSES);
export const syncStatusEnum = pgEnum('sync_status', SYNC_STATUSES);

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const schools = pgTable('schools', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 150 }).notNull(),
  slug: varchar('slug', { length: 80 }).notNull().unique(),
  ...timestamps,
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 254 }).notNull().unique(),
  name: varchar('name', { length: 150 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull(),
  // Null for GROUP_ADMIN, required for SCHOOL_ADMIN (enforced by the seed and auth layer).
  schoolId: uuid('school_id').references(() => schools.id, { onDelete: 'restrict' }),
  ...timestamps,
});

export const applications = pgTable(
  'applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'restrict' }),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    email: varchar('email', { length: 254 }).notNull(),
    phone: varchar('phone', { length: 30 }).notNull(),
    program: varchar('program', { length: 150 }).notNull(),
    status: applicationStatusEnum('status').notNull().default('NEW'),
    syncStatus: syncStatusEnum('sync_status').notNull().default('NOT_SYNCED'),
    salesforceId: varchar('salesforce_id', { length: 18 }),
    lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
    lastSyncError: text('last_sync_error'),
    ...timestamps,
  },
  (t) => [
    index('applications_school_status_idx').on(t.schoolId, t.status),
    index('applications_created_at_idx').on(t.createdAt),
  ],
);

export type SchoolRow = typeof schools.$inferSelect;
export type UserRow = typeof users.$inferSelect;
export type ApplicationRow = typeof applications.$inferSelect;
