import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router';
import { AppLayout } from '@/components/AppLayout';
import { LoadingRows } from '@/components/PageState';
import { useAuth } from '@/hooks/useAuth';
import { ApplicationDetailPage } from '@/pages/ApplicationDetailPage';
import { ApplicationFormPage } from '@/pages/ApplicationFormPage';
import { ApplicationsPage } from '@/pages/ApplicationsPage';
import { LoginPage } from '@/pages/LoginPage';

/** Sends anonymous visitors to /login and brings them back afterwards. */
function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <LoadingRows />;
  if (status === 'anonymous')
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2 py-16 text-center">
      <h1 className="text-xl font-medium">{t('notFound.title')}</h1>
      <p className="text-muted-foreground">{t('notFound.body')}</p>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/applications" replace />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/applications/new" element={<ApplicationFormPage />} />
          <Route path="/applications/:id" element={<ApplicationDetailPage />} />
          <Route path="/applications/:id/edit" element={<ApplicationFormPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
