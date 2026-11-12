import type { ApplicationStatus, SyncStatus } from '@admissions-hub/shared';

/** French copy and badge colours for each business status. */
export const STATUS_META: Record<ApplicationStatus, { label: string; plural: string; className: string }> = {
  NEW: { label: 'Nouvelle', plural: 'Nouvelles', className: 'bg-status-new text-status-new-foreground' },
  REVIEWING: {
    label: 'En revue',
    plural: 'En revue',
    className: 'bg-status-reviewing text-status-reviewing-foreground',
  },
  ACCEPTED: {
    label: 'Acceptée',
    plural: 'Acceptées',
    className: 'bg-status-accepted text-status-accepted-foreground',
  },
  REJECTED: {
    label: 'Refusée',
    plural: 'Refusées',
    className: 'bg-status-rejected text-status-rejected-foreground',
  },
};

export const SYNC_META: Record<SyncStatus, { label: string; text: string; dot: string }> = {
  NOT_SYNCED: { label: 'Non synchronisée', text: 'text-muted-foreground', dot: 'border-[1.5px] border-faint' },
  PENDING: { label: 'En cours', text: 'text-sync-pending', dot: 'bg-sync-pending-dot' },
  SYNCED: { label: 'Synchronisée', text: 'text-primary', dot: 'bg-sync-done-dot' },
  FAILED: { label: 'Échec', text: 'text-destructive font-medium', dot: 'bg-sync-failed-dot' },
};

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const dateTimeFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

export const formatDate = (iso: string) => dateFormat.format(new Date(iso));
export const formatDateTime = (iso: string) => dateTimeFormat.format(new Date(iso));
