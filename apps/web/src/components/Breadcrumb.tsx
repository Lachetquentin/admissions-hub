import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

type Item = { label: string; to?: string };

export function Breadcrumb({ items }: { items: Item[] }) {
  const { t } = useTranslation();
  return (
    <nav aria-label={t('common.breadcrumb')} className="text-[13px] text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true">/</span>}
            {item.to ? (
              <Link
                to={item.to}
                className="rounded-sm text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
