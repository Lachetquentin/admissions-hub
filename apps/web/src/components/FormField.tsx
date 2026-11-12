import { CircleAlert } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { Label } from '@/components/ui/label';

type ControlProps = { id: string; 'aria-invalid'?: true; 'aria-describedby'?: string };

type Props = {
  label: string;
  error?: string;
  hint?: string;
  /** Receives the ARIA wiring so the error is announced with the field. */
  children: (control: ControlProps) => ReactNode;
};

/** Visible label, control, then the error (or a hint) right under it. */
export function FormField({ label, error, hint, children }: Props) {
  const id = useId();
  const messageId = `${id}-message`;
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error || hint ? messageId : undefined,
      })}
      {error ? (
        <p id={messageId} className="flex items-center gap-1.5 text-[13px] text-destructive">
          <CircleAlert aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
          {error}
        </p>
      ) : (
        hint && (
          <p id={messageId} className="text-[13px] text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
