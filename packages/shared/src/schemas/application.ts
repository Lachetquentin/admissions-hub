import { z } from 'zod';
import { idSchema, isoDateSchema, paginatedSchema, paginationQuerySchema } from './common';
import { applicationStatusSchema, syncStatusSchema } from '../enums';

const requiredText = (max: number) => z.string().trim().min(1, 'Required').max(max);

/** Fields an admin can write. Shared by the create/edit form and the API. */
export const applicationInputSchema = z.object({
  schoolId: idSchema,
  firstName: requiredText(100),
  lastName: requiredText(100),
  email: z.email('Invalid email').trim().toLowerCase().max(254),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ().-]{6,20}$/, 'Invalid phone number'),
  program: requiredText(150),
  status: applicationStatusSchema.default('NEW'),
});
export type ApplicationInput = z.input<typeof applicationInputSchema>;
export type ApplicationCreate = z.output<typeof applicationInputSchema>;

/** An application cannot move to another school; every other field is optional. */
export const applicationUpdateSchema = applicationInputSchema
  .omit({ schoolId: true })
  .extend({ status: applicationStatusSchema })
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required');
export type ApplicationUpdate = z.infer<typeof applicationUpdateSchema>;

export const applicationSchema = z.object({
  id: idSchema,
  schoolId: idSchema,
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string(),
  program: z.string(),
  status: applicationStatusSchema,
  syncStatus: syncStatusSchema,
  salesforceId: z.string().nullable(),
  lastSyncAt: isoDateSchema.nullable(),
  lastSyncError: z.string().nullable(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});
export type Application = z.infer<typeof applicationSchema>;

export const applicationListQuerySchema = paginationQuerySchema.extend({
  schoolId: idSchema.optional(),
  status: applicationStatusSchema.optional(),
});
export type ApplicationListQuery = z.input<typeof applicationListQuerySchema>;
export type ApplicationListFilters = z.output<typeof applicationListQuerySchema>;

export const applicationListSchema = paginatedSchema(applicationSchema);
