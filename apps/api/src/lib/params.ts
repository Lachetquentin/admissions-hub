import { idSchema } from '@admissions-hub/shared';
import { notFound } from './httpErrors';

/** A path id that is not a uuid cannot exist: answer 404, like any unknown id. */
export function parseId(raw: unknown, what: string): string {
  const result = idSchema.safeParse(raw);
  if (!result.success) throw notFound(what);
  return result.data;
}
