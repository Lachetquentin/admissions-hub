import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { errorMessage } from '@/lib/messages';

/** Readable error block: a short title, an explanation, an optional technical line. */
export function ErrorAlert({
  title,
  children,
  meta,
}: {
  title: string;
  children?: ReactNode;
  meta?: string;
}) {
  return (
    <Alert variant="destructive" className="border-danger-line bg-danger-soft">
      <CircleAlert strokeWidth={1.5} />
      <AlertTitle>{title}</AlertTitle>
      {(children || meta) && (
        <AlertDescription>
          {children}
          {meta && <p className="mt-2 font-mono text-xs">{meta}</p>}
        </AlertDescription>
      )}
    </Alert>
  );
}

export function LoadError({ error }: { error: unknown }) {
  const { t } = useTranslation();
  return <ErrorAlert title={t('common.loadError')}>{errorMessage(error)}</ErrorAlert>;
}

/** Placeholder rows that keep the layout from jumping while data loads. */
export function LoadingRows({ rows = 6 }: { rows?: number }) {
  const { t } = useTranslation();
  return (
    <div role="status" aria-label={t('common.loading')} className="flex flex-col gap-3 p-4">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
