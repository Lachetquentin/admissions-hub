import type { Application } from '@admissions-hub/shared';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { DetailList } from '@/components/DetailList';
import { ErrorAlert } from '@/components/PageState';
import { SyncIndicator } from '@/components/StatusBadges';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSalesforceStatus, useSyncApplication } from '@/hooks/useSalesforce';
import { formatDateTime } from '@/lib/labels';
import { errorMessage, translateMessage } from '@/lib/messages';
import { cn } from '@/lib/utils';

/** Salesforce card of the detail page: Lead id, last sync, readable error, sync button. */
export function SalesforceSyncCard({ application: a }: { application: Application }) {
  const { t } = useTranslation();
  const { data: status } = useSalesforceStatus();
  const sync = useSyncApplication(a.id);
  const busy = sync.isPending || a.syncStatus === 'PENDING';
  const unavailable = !status?.enabled
    ? t('salesforce.unavailableDisabled')
    : !status.connected
      ? t('salesforce.unavailableNotConnected')
      : null;

  function onSync() {
    sync.mutate(undefined, {
      onSuccess: (updated) => {
        if (updated.syncStatus === 'SYNCED') toast.success(t('salesforce.synced'));
        else toast.error(t('salesforce.refused'));
      },
      onError: (error) => toast.error(errorMessage(error)),
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>{t('salesforce.card')}</CardTitle>
        <SyncIndicator status={sync.isPending ? 'PENDING' : a.syncStatus} />
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {a.syncStatus === 'FAILED' && a.lastSyncError && (
          <ErrorAlert
            title={t('salesforce.refused')}
            meta={a.lastSyncAt ? formatDateTime(a.lastSyncAt) : undefined}
          >
            {translateMessage(a.lastSyncError)}
          </ErrorAlert>
        )}
        <DetailList
          items={[
            {
              label: t('salesforce.lead'),
              value: a.salesforceId ? (
                <span className="font-mono text-[13px]">{a.salesforceId}</span>
              ) : (
                <span className="text-muted-foreground">{t('salesforce.noLead')}</span>
              ),
            },
            {
              label: t('salesforce.lastSync'),
              value: a.lastSyncAt ? (
                formatDateTime(a.lastSyncAt)
              ) : (
                <span className="text-muted-foreground">{t('common.never')}</span>
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
            {t(`salesforce.action.${busy ? 'PENDING' : a.syncStatus}`)}
          </Button>
          {unavailable && <span className="text-[13px] text-muted-foreground">{unavailable}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
