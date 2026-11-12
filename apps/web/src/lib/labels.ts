import type { ApplicationStatus, SyncStatus } from '@admissions-hub/shared';
import { currentLanguage } from '@/i18n';

/** Badge colours per business status (copy lives in the i18n dictionaries: `status.*`). */
export const STATUS_STYLE: Record<ApplicationStatus, string> = {
  NEW: 'bg-status-new text-status-new-foreground',
  REVIEWING: 'bg-status-reviewing text-status-reviewing-foreground',
  ACCEPTED: 'bg-status-accepted text-status-accepted-foreground',
  REJECTED: 'bg-status-rejected text-status-rejected-foreground',
};

/** Text and dot colours per sync status (copy: `sync.*`). */
export const SYNC_STYLE: Record<SyncStatus, { text: string; dot: string }> = {
  NOT_SYNCED: { text: 'text-muted-foreground', dot: 'border-[1.5px] border-faint' },
  PENDING: { text: 'text-sync-pending', dot: 'bg-sync-pending-dot' },
  SYNCED: { text: 'text-primary', dot: 'bg-sync-done-dot' },
  FAILED: { text: 'text-destructive font-medium', dot: 'bg-sync-failed-dot' },
};

const LOCALE = { en: 'en-GB', fr: 'fr-FR' } as const;

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat(LOCALE[currentLanguage()], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));

export const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat(LOCALE[currentLanguage()], {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
