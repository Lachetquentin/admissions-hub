import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { pageItems, totalPages } from '@/lib/pagination';

type Props = { page: number; pageSize: number; total: number; onChange: (page: number) => void };

export function Pagination({ page, pageSize, total, onChange }: Props) {
  const { t } = useTranslation();
  const pages = totalPages(total, pageSize);
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-[13px] text-muted-foreground">
      <span className="tabular-nums">
        {t('pagination.range', { first, last, total, page, pages })}
      </span>
      <nav aria-label={t('pagination.label')} className="flex gap-1">
        <Button
          variant="outline"
          size="icon"
          aria-label={t('pagination.previous')}
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft strokeWidth={1.5} />
        </Button>
        {pageItems(page, pages).map((item, i) =>
          item === 'gap' ? (
            <span key={`gap-${i}`} aria-hidden="true" className="grid w-6 place-items-center">
              …
            </span>
          ) : (
            <Button
              key={item}
              variant={item === page ? 'default' : 'outline'}
              size="icon"
              aria-label={t('pagination.page', { page: item })}
              aria-current={item === page ? 'page' : undefined}
              onClick={() => onChange(item)}
              className="tabular-nums"
            >
              {item}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="icon"
          aria-label={t('pagination.next')}
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight strokeWidth={1.5} />
        </Button>
      </nav>
    </div>
  );
}
