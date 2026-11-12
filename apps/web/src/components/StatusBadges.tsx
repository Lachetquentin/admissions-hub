import type { ApplicationStatus, SyncStatus } from '@admissions-hub/shared';
import { Badge } from '@/components/ui/badge';
import { STATUS_META, SYNC_META } from '@/lib/labels';
import { cn } from '@/lib/utils';

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const meta = STATUS_META[status];
  return (
    <Badge className={cn('border-transparent font-medium', meta.className)}>{meta.label}</Badge>
  );
}

/** Signature of the app: a status dot next to the Salesforce sync state. */
export function SyncIndicator({ status, label }: { status: SyncStatus; label?: string }) {
  const meta = SYNC_META[status];
  return (
    <span className={cn('inline-flex items-center gap-2 text-[13px]', meta.text)}>
      <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-full', meta.dot)} />
      {label ?? meta.label}
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
