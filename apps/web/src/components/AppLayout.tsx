import { LogOut } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router';
import { Button } from '@/components/ui/button';
import { useSchools } from '@/hooks/useApplications';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';
import { SalesforceConnection } from './SalesforceConnection';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

export function AppLayout() {
  const { user, logout } = useAuth();
  const { data: schools } = useSchools();
  const scopeLabel =
    user?.role === 'GROUP_ADMIN'
      ? 'Toutes les écoles'
      : (schools?.find((s) => s.id === user?.schoolId)?.name ?? 'Mon école');

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-8">
          <Link
            to="/applications"
            className="rounded-md text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Logo />
          </Link>
          <nav aria-label="Navigation principale" className="flex gap-1">
            <NavLink
              to="/applications"
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                  isActive
                    ? 'bg-accent font-medium text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              Candidatures
            </NavLink>
          </nav>
          <div className="grow" />
          <SalesforceConnection />
          {user && (
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="grid size-8 place-items-center rounded-full bg-foreground text-xs font-medium text-background"
              >
                {initials(user.name)}
              </span>
              <span className="flex flex-col leading-tight">
                <span className="font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">{scopeLabel}</span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                aria-label="Se déconnecter"
                title="Se déconnecter"
              >
                <LogOut strokeWidth={1.5} />
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <Outlet />
      </main>
    </div>
  );
}
