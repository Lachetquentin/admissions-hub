import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
  type StatusCounts,
} from '@admissions-hub/shared';
import { STATUS_META } from '@/lib/labels';
import { cn } from '@/lib/utils';

type Props = {
  counts: StatusCounts | undefined;
  selected: ApplicationStatus | undefined;
  onSelect: (status: ApplicationStatus | undefined) => void;
};

/** Counters per status that double as the status filter. */
export function StatusTiles({ counts, selected, onSelect }: Props) {
  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : undefined;
  const tiles = [
    { key: undefined, label: 'Toutes', count: total },
    ...APPLICATION_STATUSES.map((s) => ({
      key: s,
      label: STATUS_META[s].plural,
      count: counts?.[s],
    })),
  ];

  return (
    <div
      role="group"
      aria-label="Filtrer par statut"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
    >
      {tiles.map(({ key, label, count }) => {
        const active = key === selected;
        return (
          <button
            key={label}
            type="button"
            aria-pressed={active}
            aria-label={count === undefined ? label : `${label} (${count})`}
            onClick={() => onSelect(key)}
            className={cn(
              'flex flex-col items-start gap-1 rounded-xl border bg-card px-4 py-3 text-left transition-colors outline-none',
              'hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
              key === undefined && 'col-span-2 sm:col-span-1',
              active ? 'border-primary shadow-[inset_0_0_0_1px_var(--primary)]' : 'border-border',
            )}
          >
            <span className="text-[13px] text-muted-foreground">{label}</span>
            <span className="text-2xl font-medium tracking-tight tabular-nums">{count ?? '–'}</span>
          </button>
        );
      })}
    </div>
  );
}
