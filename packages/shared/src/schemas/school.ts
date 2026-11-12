import { z } from 'zod';
import { idSchema } from './common';

export const schoolSchema = z.object({
  id: idSchema,
  name: z.string(),
  slug: z.string(),
});
export type School = z.infer<typeof schoolSchema>;
