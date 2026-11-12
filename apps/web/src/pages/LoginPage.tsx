import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router';
import { loginSchema } from '@admissions-hub/shared';
import { FormField } from '@/components/FormField';
import { Logo } from '@/components/Logo';
import { ErrorAlert, errorMessage } from '@/components/PageState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { zodFieldErrors, type FieldErrors } from '@/lib/formErrors';

/** Seeded demo accounts (README); every one uses the same demo password. */
const DEMO_ACCOUNTS = [
  { email: 'groupe@admissions.test', scope: 'toutes les écoles' },
  { email: 'esc@admissions.test', scope: 'École Supérieure de Commerce' },
  { email: 'iin@admissions.test', scope: "Institut d'Ingénierie Numérique" },
];

export function LoginPage() {
  const { status, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/applications';
  if (status === 'authenticated') return <Navigate to={from} replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setPending(true);
    try {
      await login(parsed.data);
    } catch (error) {
      setSubmitError(error);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Logo />
        <Card>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-medium tracking-tight">Connexion</h1>
              <p className="text-muted-foreground">Accès réservé aux équipes admissions</p>
            </div>
            {submitError !== null && (
              <ErrorAlert title="Connexion impossible">{errorMessage(submitError)}</ErrorAlert>
            )}
            <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
              <FormField label="E-mail" error={errors.email}>
                {(control) => (
                  <Input
                    {...control}
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                )}
              </FormField>
              <FormField label="Mot de passe" error={errors.password}>
                {(control) => (
                  <Input
                    {...control}
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                )}
              </FormField>
              <Button type="submit" size="lg" disabled={pending} className="mt-2">
                {pending ? 'Connexion…' : 'Se connecter'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <section
          aria-labelledby="demo-title"
          className="flex flex-col gap-2 text-[13px] text-muted-foreground"
        >
          <h2 id="demo-title" className="font-medium text-foreground">
            Comptes de démonstration
          </h2>
          <ul className="flex flex-col gap-1">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.email}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword('admissions-demo');
                  }}
                  className="rounded-sm font-mono text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {account.email}
                </button>{' '}
                · {account.scope}
              </li>
            ))}
          </ul>
          <p>
            Mot de passe : <span className="font-mono text-foreground">admissions-demo</span>
          </p>
        </section>
      </div>
    </main>
  );
}
