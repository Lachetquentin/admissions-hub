import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { DetailList } from '@/components/DetailList';
import { Breadcrumb } from '@/components/Breadcrumb';
import { LoadError, LoadingRows } from '@/components/PageState';
import { SalesforceSyncCard } from '@/components/SalesforceSyncCard';
import { StatusBadge } from '@/components/StatusBadges';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApplication, useDeleteApplication, useSchools } from '@/hooks/useApplications';
import { formatDateTime } from '@/lib/labels';
import { errorMessage } from '@/lib/messages';

export function ApplicationDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  // The page unmounts on success, so the toast is raised from the hook callback, not from mutate().
  const remove = useDeleteApplication(() => {
    toast.success(t('detail.deleted'));
    navigate('/applications', { replace: true });
  });
  // Once deleted, the record answers 404: stop fetching it while the page leaves.
  const application = useApplication(id, !remove.isSuccess);
  const { data: schools = [] } = useSchools();

  if (application.isPending) return <LoadingRows />;
  if (application.isError) return <LoadError error={application.error} />;

  const a = application.data;
  const fullName = `${a.firstName} ${a.lastName}`;
  const school = schools.find((s) => s.id === a.schoolId);

  function onDelete() {
    remove.mutate(a.id, { onError: (error) => toast.error(errorMessage(error)) });
  }

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[{ label: t('nav.applications'), to: '/applications' }, { label: fullName }]}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[28px] font-medium tracking-tight">{fullName}</h1>
          <StatusBadge status={a.status} />
        </div>
        <div className="flex flex-wrap gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="lg">
                {t('common.delete')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('detail.deleteTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('detail.deleteBody', { name: fullName })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={onDelete}
                  disabled={remove.isPending}
                >
                  {t('common.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button asChild variant="outline" size="lg">
            <Link to={`/applications/${a.id}/edit`}>{t('common.edit')}</Link>
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('detail.card')}</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailList
              items={[
                {
                  label: t('detail.email'),
                  value: (
                    <a
                      href={`mailto:${a.email}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {a.email}
                    </a>
                  ),
                },
                {
                  label: t('detail.phone'),
                  value: <span className="tabular-nums">{a.phone}</span>,
                },
                { label: t('detail.school'), value: school?.name ?? '—' },
                { label: t('detail.program'), value: a.program },
                { label: t('detail.receivedAt'), value: formatDateTime(a.createdAt) },
                { label: t('detail.updatedAt'), value: formatDateTime(a.updatedAt) },
              ]}
            />
          </CardContent>
        </Card>

        <SalesforceSyncCard application={a} />
      </div>
    </div>
  );
}
