import type { ApplicationStatus, SyncStatus } from '@admissions-hub/shared';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { STATUS_STYLE, SYNC_STYLE } from '@/lib/labels';
import { cn } from '@/lib/utils';

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const { t } = useTranslation();
  return (
    <Badge className={cn('border-transparent font-medium', STATUS_STYLE[status])}>
      {t(`status.${status}.one`)}
    </Badge>
  );
}

/** Signature of the app: a status dot next to the Salesforce sync state. */
export function SyncIndicator({ status }: { status: SyncStatus }) {
  const { t } = useTranslation();
  const style = SYNC_STYLE[status];
  return (
    <span className={cn('inline-flex items-center gap-2 text-[13px]', style.text)}>
      <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-full', style.dot)} />
      {t(`sync.${status}`)}
    </span>
  );
}

/** School code, set in mono like a file reference. */
export function SchoolTag({ slug }: { slug: string }) {
  return (
    <span className="rounded-sm border border-input px-1.5 py-0.5 font-mono text-xs uppercase text-status-new-foreground">
      {slug}
    </span>
  );
}
