import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Application,
  ApplicationInput,
  ApplicationList,
  ApplicationListFilters,
  ApplicationUpdate,
  School,
} from '@admissions-hub/shared';
import { apiFetch, toQuery } from '../api/client';

const keys = {
  lists: ['applications', 'list'] as const,
  list: (query: ApplicationListFilters) => ['applications', 'list', query] as const,
  detail: (id: string) => ['applications', 'detail', id] as const,
};

export const useApplicationList = (query: ApplicationListFilters) =>
  useQuery({
    queryKey: keys.list(query),
    queryFn: () => apiFetch<ApplicationList>(`/applications${toQuery(query)}`),
    placeholderData: keepPreviousData,
  });

/** `enabled: false` stops fetching, e.g. once the record has just been deleted. */
export const useApplication = (id: string | undefined, enabled = true) =>
  useQuery({
    queryKey: keys.detail(id ?? ''),
    queryFn: () => apiFetch<Application>(`/applications/${id}`),
    enabled: enabled && Boolean(id),
  });

/** After a create/update, the saved detail is primed from the response and lists are refetched. */
function useSaveApplication<TInput>(request: (input: TInput) => Promise<Application>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: (application) => {
      queryClient.setQueryData(keys.detail(application.id), application);
      return queryClient.invalidateQueries({ queryKey: keys.lists });
    },
  });
}

export const useCreateApplication = () =>
  useSaveApplication((input: ApplicationInput) =>
    apiFetch<Application>('/applications', { method: 'POST', body: input }),
  );

export const useUpdateApplication = (id: string) =>
  useSaveApplication((patch: ApplicationUpdate) =>
    apiFetch<Application>(`/applications/${id}`, { method: 'PATCH', body: patch }),
  );

/**
 * `onDeleted` runs first (typically: leave the detail page), then the deleted detail
 * leaves the cache. The page should also disable its detail query once `isSuccess`.
 */
export function useDeleteApplication(onDeleted: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/applications/${id}`, { method: 'DELETE' }),
    onSuccess: (_, id) => {
      onDeleted();
      queryClient.removeQueries({ queryKey: keys.detail(id) });
      return queryClient.invalidateQueries({ queryKey: keys.lists });
    },
  });
}

export const useSchools = () =>
  useQuery({
    queryKey: ['schools'],
    queryFn: () => apiFetch<School[]>('/schools'),
    staleTime: 5 * 60_000,
  });
