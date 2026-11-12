import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
  useConnectSalesforce,
  useSalesforceCallbackToast,
  useSalesforceStatus,
} from '@/hooks/useSalesforce';
import { errorMessage } from '@/components/PageState';
import { cn } from '@/lib/utils';

/** Header pill: is the group's Salesforce org connected? A GROUP_ADMIN can connect it from here. */
export function SalesforceConnection() {
  useSalesforceCallbackToast();
  const { user } = useAuth();
  const { data: status } = useSalesforceStatus();
  const connect = useConnectSalesforce();
  if (!status) return null;

  const pill =
    'inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[13px] font-medium';

  if (!status.enabled) {
    return (
      <span
        className={cn(pill, 'border-border bg-muted text-muted-foreground')}
        title="Mode démo : la synchronisation est coupée"
      >
        <span aria-hidden="true" className="size-2 rounded-full border-[1.5px] border-faint" />
        Salesforce désactivé
      </span>
    );
  }

  if (status.connected) {
    return (
      <span
        className={cn(pill, 'border-accent bg-accent text-accent-foreground')}
        title={status.instanceUrl ?? undefined}
      >
        <span aria-hidden="true" className="size-2 rounded-full bg-sync-done-dot" />
        Salesforce connecté
      </span>
    );
  }

  return (
    <span className={cn(pill, 'border-border bg-muted pr-1 text-muted-foreground')}>
      <span aria-hidden="true" className="size-2 rounded-full border-[1.5px] border-faint" />
      Salesforce non connecté
      {user?.role === 'GROUP_ADMIN' && (
        <Button
          size="xs"
          variant="link"
          disabled={connect.isPending}
          onClick={() =>
            connect.mutate(undefined, { onError: (error) => toast.error(errorMessage(error)) })
          }
        >
          {connect.isPending ? 'Redirection…' : 'Connecter'}
        </Button>
      )}
    </span>
  );
}
