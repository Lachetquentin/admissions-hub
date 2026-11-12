import { useSearchParams } from 'react-router';
import {
  PAGE_SIZE_DEFAULT,
  applicationListQuerySchema,
  type ApplicationListFilters,
} from '@admissions-hub/shared';

export type ListFilters = ApplicationListFilters;

/**
 * List filters live in the URL (?page=2&status=NEW&schoolId=…) so they survive reloads,
 * back/forward and can be shared. Invalid values fall back to the defaults.
 */
export function useListFilters() {
  const [params, setParams] = useSearchParams();
  const parsed = applicationListQuerySchema.safeParse(Object.fromEntries(params));
  const filters: ListFilters = parsed.success ? parsed.data : applicationListQuerySchema.parse({});

  const update = (patch: Partial<ListFilters>) => {
    // Changing a filter goes back to page 1; changing the page keeps the filters.
    const next: Partial<ListFilters> = { ...filters, page: 1, ...patch };
    const search = new URLSearchParams();
    if (next.schoolId) search.set('schoolId', next.schoolId);
    if (next.status) search.set('status', next.status);
    if (next.page && next.page > 1) search.set('page', String(next.page));
    if (next.pageSize && next.pageSize !== PAGE_SIZE_DEFAULT)
      search.set('pageSize', String(next.pageSize));
    setParams(search);
  };

  return { filters, update };
}
