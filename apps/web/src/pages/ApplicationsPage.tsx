import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Pagination } from '@/components/Pagination';
import { LoadError, LoadingRows } from '@/components/PageState';
import { SchoolTag, StatusBadge, SyncIndicator } from '@/components/StatusBadges';
import { StatusTiles } from '@/components/StatusTiles';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useApplicationList, useSchools } from '@/hooks/useApplications';
import { useListFilters } from '@/hooks/useListFilters';
import { formatDate } from '@/lib/labels';

const ALL_SCHOOLS = 'all';

export function ApplicationsPage() {
  const { t } = useTranslation();
  const { filters, update } = useListFilters();
  const list = useApplicationList(filters);
  const { data: schools = [] } = useSchools();
  const schoolById = new Map(schools.map((s) => [s.id, s]));

  const total = list.data ? Object.values(list.data.counts).reduce((a, b) => a + b, 0) : undefined;
  const subtitle =
    total === undefined
      ? ' '
      : [
          t('list.count', { count: total }),
          schools.length > 1 ? t('list.schoolCount', { count: schools.length }) : null,
        ]
          .filter(Boolean)
          .join(' · ');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-medium tracking-tight">{t('list.title')}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        <Button asChild size="lg">
          <Link to="/applications/new">
            <Plus strokeWidth={1.5} />
            {t('list.create')}
          </Link>
        </Button>
      </div>

      <StatusTiles
        counts={list.data?.counts}
        selected={filters.status}
        onSelect={(status) => update({ status })}
      />

      <div className="overflow-hidden rounded-xl border bg-card">
        {schools.length > 1 && (
          <div className="flex flex-wrap items-end gap-4 border-b p-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="school-filter" className="text-xs text-muted-foreground">
                {t('list.school')}
              </Label>
              <Select
                value={filters.schoolId ?? ALL_SCHOOLS}
                onValueChange={(value) =>
                  update({ schoolId: value === ALL_SCHOOLS ? undefined : value })
                }
              >
                <SelectTrigger id="school-filter" className="min-w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_SCHOOLS}>{t('common.allSchools')}</SelectItem>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {list.isPending ? (
          <LoadingRows />
        ) : list.isError ? (
          <div className="p-4">
            <LoadError error={list.error} />
          </div>
        ) : list.data.items.length === 0 ? (
          <p className="px-4 py-16 text-center text-muted-foreground">{t('list.empty')}</p>
        ) : (
          <>
            <Table className="min-w-[960px]">
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead className="px-4">{t('list.columns.candidate')}</TableHead>
                  <TableHead className="px-4">{t('list.columns.school')}</TableHead>
                  <TableHead className="px-4">{t('list.columns.program')}</TableHead>
                  <TableHead className="px-4">{t('list.columns.status')}</TableHead>
                  <TableHead className="px-4">{t('list.columns.salesforce')}</TableHead>
                  <TableHead className="px-4 text-right">{t('list.columns.receivedAt')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className={list.isPlaceholderData ? 'opacity-60' : undefined}>
                {list.data.items.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="px-4 py-3">
                      <Link
                        to={`/applications/${application.id}`}
                        className="rounded-sm font-medium text-foreground outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        {application.firstName} {application.lastName}
                      </Link>
                      <div className="mt-0.5 text-[13px] text-muted-foreground">
                        {application.email}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <SchoolTag slug={schoolById.get(application.schoolId)?.slug ?? '—'} />
                    </TableCell>
                    <TableCell className="px-4 py-3">{application.program}</TableCell>
                    <TableCell className="px-4 py-3">
                      <StatusBadge status={application.status} />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <SyncIndicator status={application.syncStatus} />
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                      {formatDate(application.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="border-t">
              <Pagination
                page={list.data.page}
                pageSize={list.data.pageSize}
                total={list.data.total}
                onChange={(page) => update({ page })}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
