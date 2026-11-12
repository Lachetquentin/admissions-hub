import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';
import {
  SALESFORCE_CALLBACK_PARAM,
  type Application,
  type SalesforceConnect,
  type SalesforceStatus,
} from '@admissions-hub/shared';
import { apiFetch } from '@/api/client';
import { i18n } from '@/i18n';
import { callbackErrorMessage } from '@/lib/messages';
import { useSaveApplication } from './useApplications';

const statusKey = ['salesforce', 'status'] as const;

export const useSalesforceStatus = () =>
  useQuery({
    queryKey: statusKey,
    queryFn: () => apiFetch<SalesforceStatus>('/integrations/salesforce/status'),
    staleTime: 60_000,
  });

/** Opens the Salesforce authorization page (OAuth Web Server Flow); Salesforce sends the user back. */
export const useConnectSalesforce = () =>
  useMutation({
    mutationFn: () => apiFetch<SalesforceConnect>('/integrations/salesforce/connect'),
    onSuccess: ({ url }) => window.location.assign(url),
  });

/** Creates or updates the Lead; the returned application carries the outcome (SYNCED or FAILED). */
export const useSyncApplication = (id: string) =>
  useSaveApplication(() => apiFetch<Application>(`/applications/${id}/sync`, { method: 'POST' }));

/** Turns the ?salesforce=connected|error flag left by the OAuth callback into a toast, once. */
export function useSalesforceCallbackToast() {
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const result = params.get(SALESFORCE_CALLBACK_PARAM);
  const reason = params.get('reason');

  useEffect(() => {
    if (!result) return;
    if (result === 'connected') toast.success(i18n.t('salesforce.connected'));
    else toast.error(callbackErrorMessage(reason));
    void queryClient.invalidateQueries({ queryKey: statusKey });
    setParams(
      (current) => {
        current.delete(SALESFORCE_CALLBACK_PARAM);
        current.delete('reason');
        return current;
      },
      { replace: true },
    );
  }, [result, reason, queryClient, setParams]);
}
