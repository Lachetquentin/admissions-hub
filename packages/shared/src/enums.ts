import { z } from 'zod';

export const ROLES = ['GROUP_ADMIN', 'SCHOOL_ADMIN'] as const;
export const roleSchema = z.enum(ROLES);
export type Role = z.infer<typeof roleSchema>;

export const APPLICATION_STATUSES = ['NEW', 'REVIEWING', 'ACCEPTED', 'REJECTED'] as const;
export const applicationStatusSchema = z.enum(APPLICATION_STATUSES);
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;

export const SYNC_STATUSES = ['NOT_SYNCED', 'PENDING', 'SYNCED', 'FAILED'] as const;
export const syncStatusSchema = z.enum(SYNC_STATUSES);
export type SyncStatus = z.infer<typeof syncStatusSchema>;
