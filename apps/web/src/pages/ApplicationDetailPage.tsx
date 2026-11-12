import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { DetailList } from '@/components/DetailList';
import { LoadError, LoadingRows, errorMessage } from '@/components/PageState';
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
import { Breadcrumb } from '@/components/Breadcrumb';

export function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  // The page unmounts on success, so the toast is raised from the hook callback, not from mutate().
  const remove = useDeleteApplication(() => {
    toast.success('Candidature supprimée');
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
      <Breadcrumb items={[{ label: 'Candidatures', to: '/applications' }, { label: fullName }]} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[28px] font-medium tracking-tight">{fullName}</h1>
          <StatusBadge status={a.status} />
        </div>
        <div className="flex flex-wrap gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="lg">
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer cette candidature ?</AlertDialogTitle>
                <AlertDialogDescription>
                  La candidature de {fullName} sera définitivement supprimée d'Admissions Hub. Un
                  Lead déjà créé dans Salesforce n'est pas supprimé.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={onDelete}
                  disabled={remove.isPending}
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button asChild variant="outline" size="lg">
            <Link to={`/applications/${a.id}/edit`}>Modifier</Link>
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Candidature</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailList
              items={[
                {
                  label: 'E-mail',
                  value: (
                    <a
                      href={`mailto:${a.email}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {a.email}
                    </a>
                  ),
                },
                { label: 'Téléphone', value: <span className="tabular-nums">{a.phone}</span> },
                { label: 'École', value: school?.name ?? '—' },
                { label: 'Programme visé', value: a.program },
                { label: 'Reçue le', value: formatDateTime(a.createdAt) },
                { label: 'Modifiée le', value: formatDateTime(a.updatedAt) },
              ]}
            />
          </CardContent>
        </Card>

        <SalesforceSyncCard application={a} />
      </div>
    </div>
  );
}
