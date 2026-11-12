import type { Application } from '@admissions-hub/shared';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { DetailList } from '@/components/DetailList';
import { ErrorAlert } from '@/components/PageState';
import { SyncIndicator } from '@/components/StatusBadges';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSalesforceStatus, useSyncApplication } from '@/hooks/useSalesforce';
import { formatDateTime } from '@/lib/labels';
import { syncErrorMessage } from '@/lib/salesforceMessages';
import { cn } from '@/lib/utils';

const ACTION_LABEL: Record<Application['syncStatus'], string> = {
  NOT_SYNCED: 'Synchroniser',
  PENDING: 'Synchronisation…',
  SYNCED: 'Resynchroniser',
  FAILED: 'Réessayer la synchronisation',
};

/** Salesforce card of the detail page: Lead id, last sync, readable error, sync button. */
export function SalesforceSyncCard({ application: a }: { application: Application }) {
  const { data: status } = useSalesforceStatus();
  const sync = useSyncApplication(a.id);
  const busy = sync.isPending || a.syncStatus === 'PENDING';
  const unavailable = !status?.enabled ? 'désactivé' : !status.connected ? 'non connecté' : null;

  function onSync() {
    sync.mutate(undefined, {
      onSuccess: (updated) => {
        if (updated.syncStatus === 'SYNCED') toast.success('Lead synchronisé dans Salesforce');
        else toast.error('Salesforce a refusé la synchronisation');
      },
      onError: (error) => toast.error(syncErrorMessage(error)),
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>Salesforce</CardTitle>
        <SyncIndicator status={sync.isPending ? 'PENDING' : a.syncStatus} />
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {a.syncStatus === 'FAILED' && a.lastSyncError && (
          <ErrorAlert
            title="Salesforce a refusé la synchronisation"
            meta={a.lastSyncAt ? formatDateTime(a.lastSyncAt) : undefined}
          >
            {a.lastSyncError}
          </ErrorAlert>
        )}
        <DetailList
          items={[
            {
              label: 'Lead Salesforce',
              value: a.salesforceId ? (
                <span className="font-mono text-[13px]">{a.salesforceId}</span>
              ) : (
                <span className="text-muted-foreground">Pas encore créé</span>
              ),
            },
            {
              label: 'Dernière synchro',
              value: a.lastSyncAt ? (
                formatDateTime(a.lastSyncAt)
              ) : (
                <span className="text-muted-foreground">Jamais</span>
              ),
            },
          ]}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg" onClick={onSync} disabled={busy || unavailable !== null}>
            <RefreshCw
              strokeWidth={1.5}
              className={cn(busy && 'animate-spin motion-reduce:animate-none')}
            />
            {busy ? ACTION_LABEL.PENDING : ACTION_LABEL[a.syncStatus]}
          </Button>
          {unavailable && (
            <span className="text-[13px] text-muted-foreground">Salesforce {unavailable}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
