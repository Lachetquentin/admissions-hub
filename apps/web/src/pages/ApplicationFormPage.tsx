import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import {
  APPLICATION_STATUSES,
  applicationInputSchema,
  applicationUpdateSchema,
  type Application,
  type ApplicationStatus,
} from '@admissions-hub/shared';
import { Breadcrumb } from '@/components/Breadcrumb';
import { FormField } from '@/components/FormField';
import { ErrorAlert, LoadError, LoadingRows } from '@/components/PageState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useApplication,
  useCreateApplication,
  useSchools,
  useUpdateApplication,
} from '@/hooks/useApplications';
import { useAuth } from '@/hooks/useAuth';
import { apiFieldErrors, zodFieldErrors, type FieldErrors } from '@/lib/formErrors';
import { errorMessage } from '@/lib/messages';
import { cn } from '@/lib/utils';

type Values = {
  schoolId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  program: string;
  status: ApplicationStatus;
};

const TEXT_FIELDS = [
  { name: 'firstName', autoComplete: 'off' },
  { name: 'lastName', autoComplete: 'off' },
  { name: 'email', type: 'email', autoComplete: 'off' },
  { name: 'phone', type: 'tel', autoComplete: 'off' },
] as const;

/** /applications/new and /applications/:id/edit */
export function ApplicationFormPage() {
  const { id } = useParams();
  const existing = useApplication(id);

  if (!id) return <ApplicationForm />;
  if (existing.isPending) return <LoadingRows />;
  if (existing.isError) return <LoadError error={existing.error} />;
  return <ApplicationForm key={existing.data.id} application={existing.data} />;
}

function ApplicationForm({ application }: { application?: Application }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: schools = [] } = useSchools();
  const create = useCreateApplication();
  const update = useUpdateApplication(application?.id ?? '');
  const isEdit = application !== undefined;

  const [values, setValues] = useState<Values>(() => ({
    schoolId: application?.schoolId ?? user?.schoolId ?? '',
    firstName: application?.firstName ?? '',
    lastName: application?.lastName ?? '',
    email: application?.email ?? '',
    phone: application?.phone ?? '',
    program: application?.program ?? '',
    status: application?.status ?? 'NEW',
  }));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  // After a failed submit, move focus to the first invalid field.
  useEffect(() => {
    if (attempt > 0) formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [attempt]);

  // A SCHOOL_ADMIN only sees their school: preselect it.
  useEffect(() => {
    if (!values.schoolId && schools.length === 1)
      setValues((v) => ({ ...v, schoolId: schools[0]!.id }));
  }, [schools, values.schoolId]);

  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setValues((v) => ({ ...v, [key]: value }));
  const pending = create.isPending || update.isPending;
  const title = isEdit ? t('form.editTitle') : t('form.createTitle');
  const fullName = application ? `${application.firstName} ${application.lastName}` : '';

  const showFieldErrors = (fieldErrors: FieldErrors) => {
    setErrors(fieldErrors);
    setAttempt((n) => n + 1);
  };

  /** Validates with the shared schema, then sends; the school is not editable. */
  function save(): Promise<Application> | FieldErrors {
    if (isEdit) {
      const { schoolId: _school, ...patch } = values;
      const parsed = applicationUpdateSchema.safeParse(patch);
      return parsed.success ? update.mutateAsync(parsed.data) : zodFieldErrors(parsed.error);
    }
    const parsed = applicationInputSchema.safeParse(values);
    return parsed.success ? create.mutateAsync(parsed.data) : zodFieldErrors(parsed.error);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    const request = save();
    if (!(request instanceof Promise)) return showFieldErrors(request);
    setErrors({});
    try {
      const saved = await request;
      toast.success(isEdit ? t('form.saved') : t('form.created'));
      navigate(`/applications/${saved.id}`);
    } catch (error) {
      const fieldErrors = apiFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) showFieldErrors(fieldErrors);
      else setSubmitError(error);
    }
  }

  const cancelTo = isEdit ? `/applications/${application.id}` : '/applications';

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Breadcrumb
        items={[
          { label: t('nav.applications'), to: '/applications' },
          ...(isEdit
            ? [{ label: fullName, to: cancelTo }, { label: t('common.edit') }]
            : [{ label: t('form.newCrumb') }]),
        ]}
      />
      <h1 className="text-[28px] font-medium tracking-tight">{title}</h1>

      {submitError !== null && (
        <ErrorAlert title={t('form.saveFailed')}>{errorMessage(submitError)}</ErrorAlert>
      )}

      <Card>
        <CardContent>
          <form ref={formRef} noValidate onSubmit={onSubmit} className="flex flex-col gap-6">
            <div className="grid gap-6 sm:grid-cols-2">
              {TEXT_FIELDS.map((field) => (
                <FormField
                  key={field.name}
                  label={t(`form.${field.name}`)}
                  error={errors[field.name]}
                >
                  {(control) => (
                    <Input
                      {...control}
                      type={'type' in field ? field.type : 'text'}
                      autoComplete={field.autoComplete}
                      value={values[field.name]}
                      onChange={(e) => set(field.name, e.target.value)}
                    />
                  )}
                </FormField>
              ))}

              <FormField
                label={t('form.school')}
                error={errors.schoolId}
                hint={isEdit ? t('form.schoolLocked') : undefined}
              >
                {(control) => (
                  <Select
                    value={values.schoolId}
                    onValueChange={(value) => set('schoolId', value)}
                    disabled={isEdit || schools.length <= 1}
                  >
                    <SelectTrigger {...control} className="w-full">
                      <SelectValue placeholder={t('form.schoolPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormField>

              <FormField label={t('form.program')} error={errors.program}>
                {(control) => (
                  <Input
                    {...control}
                    value={values.program}
                    onChange={(e) => set('program', e.target.value)}
                  />
                )}
              </FormField>
            </div>

            <fieldset className="flex flex-col gap-3">
              <legend className="mb-3 text-sm font-medium">{t('form.status')}</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {APPLICATION_STATUSES.map((status) => {
                  const checked = values.status === status;
                  return (
                    <label
                      key={status}
                      className={cn(
                        'flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border bg-card px-3 transition-colors',
                        'has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
                        checked ? 'border-primary bg-accent' : 'border-input hover:bg-muted',
                      )}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={status}
                        checked={checked}
                        onChange={() => set('status', status)}
                        className="size-4 accent-primary"
                      />
                      {t(`status.${status}.one`)}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex flex-wrap justify-end gap-2 border-t pt-6">
              <Button asChild variant="outline" size="lg">
                <Link to={cancelTo}>{t('common.cancel')}</Link>
              </Button>
              <Button type="submit" size="lg" disabled={pending}>
                {pending ? t('common.saving') : isEdit ? t('common.save') : t('form.create')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
