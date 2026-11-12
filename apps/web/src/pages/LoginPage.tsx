import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router';
import { loginSchema } from '@admissions-hub/shared';
import { ApiRequestError } from '@/api/client';
import { FormField } from '@/components/FormField';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Logo } from '@/components/Logo';
import { ErrorAlert } from '@/components/PageState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { zodFieldErrors, type FieldErrors } from '@/lib/formErrors';
import { errorMessage } from '@/lib/messages';

/** Seeded demo accounts (README); every one uses the same demo password. School names are data. */
const DEMO_ACCOUNTS = [
  { email: 'groupe@admissions.test', scope: null },
  { email: 'esc@admissions.test', scope: 'École Supérieure de Commerce' },
  { email: 'iin@admissions.test', scope: "Institut d'Ingénierie Numérique" },
];
const DEMO_PASSWORD = 'admissions-demo';

export function LoginPage() {
  const { t } = useTranslation();
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

  // A 401 on the login form means wrong credentials, not an expired session.
  const submitMessage =
    submitError instanceof ApiRequestError && submitError.status === 401
      ? t('login.invalidCredentials')
      : errorMessage(submitError);

  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-between">
          <Logo />
          <LanguageSwitcher />
        </div>
        <Card>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-medium tracking-tight">{t('login.title')}</h1>
              <p className="text-muted-foreground">{t('login.subtitle')}</p>
            </div>
            {submitError !== null && (
              <ErrorAlert title={t('login.failed')}>{submitMessage}</ErrorAlert>
            )}
            <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
              <FormField label={t('login.email')} error={errors.email}>
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
              <FormField label={t('login.password')} error={errors.password}>
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
                {pending ? t('login.submitting') : t('login.submit')}
              </Button>
            </form>
          </CardContent>
        </Card>
        <section
          aria-labelledby="demo-title"
          className="flex flex-col gap-2 text-[13px] text-muted-foreground"
        >
          <h2 id="demo-title" className="font-medium text-foreground">
            {t('login.demoTitle')}
          </h2>
          <ul className="flex flex-col gap-1">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.email}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword(DEMO_PASSWORD);
                  }}
                  className="rounded-sm font-mono text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {account.email}
                </button>{' '}
                · {account.scope ?? t('common.allSchools')}
              </li>
            ))}
          </ul>
          <p>
            {t('login.demoPassword')}{' '}
            <span className="font-mono text-foreground">{DEMO_PASSWORD}</span>
          </p>
        </section>
      </div>
    </main>
  );
}
