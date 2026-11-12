import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { ApiRequestError } from '@/api/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

/** Readable error block: a short title, an explanation, an optional technical line. */
export function ErrorAlert({ title, children, meta }: { title: string; children?: ReactNode; meta?: string }) {
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

export const errorMessage = (error: unknown) =>
  error instanceof ApiRequestError ? error.message : 'Une erreur inattendue est survenue.';

export function LoadError({ error }: { error: unknown }) {
  return <ErrorAlert title="Impossible de charger les données">{errorMessage(error)}</ErrorAlert>;
}

/** Placeholder rows that keep the layout from jumping while data loads. */
export function LoadingRows({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Chargement" className="flex flex-col gap-3 p-4">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
