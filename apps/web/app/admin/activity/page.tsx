'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService, AuditLogItem } from '../../../services/adminService';
import { AppShell } from '../../../components/layout/AppShell';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { TableCard, TableCardBody, TableCardFooter } from '../../../components/ui/TableCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Clock, Search, Loader2, RefreshCw, FileText, Building2, Activity } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '../../../components/ui/PageHeader';
import { SearchInput } from '../../../components/ui/SearchInput';
import { AppIcon } from '../../../components/ui/AppIcon';

export default function AdminActivityPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data: logData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['adminActivityLogs', currentPage, pageSize, searchQuery, actionFilter],
    queryFn: () =>
      adminService.listActivityLogs({
        page: currentPage,
        limit: pageSize,
        search: searchQuery || undefined,
        action: actionFilter || undefined,
      }),
  });

  const logs = logData?.data?.logs || [];
  const pagination = logData?.pagination;

  // Common sensitive audit actions for dropdown filter
  const actionOptions = [
    { label: 'All Actions', value: '' },
    { label: 'User Registered', value: 'USER_REGISTERED' },
    { label: 'User Logged In', value: 'USER_LOGGED_IN' },
    { label: 'User Suspended', value: 'USER_SUSPENDED' },
    { label: 'User Status Updated', value: 'USER_STATUS_UPDATED' },
    { label: 'Company Created', value: 'COMPANY_CREATED' },
    { label: 'Company Updated', value: 'COMPANY_UPDATED' },
    { label: 'Company Suspended', value: 'COMPANY_SUSPENDED' },
    { label: 'Company Activated', value: 'COMPANY_ACTIVATED' },
    { label: 'Access Request Created', value: 'ACCESS_REQUEST_CREATED' },
    { label: 'Access Request Approved', value: 'ACCESS_REQUEST_APPROVED' },
    { label: 'Access Request Rejected', value: 'ACCESS_REQUEST_REJECTED' },
    { label: 'User Assigned to Company', value: 'USER_ASSIGNED_TO_COMPANY' },
    { label: 'User Removed from Company', value: 'USER_REMOVED_FROM_COMPANY' },
    { label: 'Member Role Updated', value: 'MEMBER_ROLE_UPDATED' },
    { label: 'Member Status Updated', value: 'MEMBER_STATUS_UPDATED' },
  ];

  return (
    <AppShell>
      <div className="h-full flex flex-col space-y-3 sm:space-y-4 min-h-0">
        <PageHeader
          icon={Activity}
          title="System Activity Logs"
          description="Audit trail for all sensitive platform administrative actions."
          actions={
            <Button variant="outline" size="md" onClick={() => refetch()} className="gap-2">
              <AppIcon icon={RefreshCw} size="sm" className={isRefetching ? 'animate-spin' : ''} />
              Refresh Logs
            </Button>
          }
        />

        {/* Filters and search */}
        <div className="flex flex-wrap gap-3 items-center justify-between bg-card/25 border border-border/80 p-3 sm:p-4 rounded-xl shrink-0">
          <SearchInput
            placeholder="Search actor name, email, action, details..."
            value={searchQuery}
            onChange={(val) => {
              setSearchQuery(val);
              setCurrentPage(1);
            }}
            onClear={() => {
              setSearchQuery('');
              setCurrentPage(1);
            }}
            wrapperClassName="w-full sm:w-80"
          />

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase font-semibold">Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {actionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <TableCard>
          {isLoading ? (
            <TableCardBody className="p-12 text-center text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Loading audit logs...</span>
            </TableCardBody>
          ) : (
            <>
              <TableCardBody>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target Entity</TableHead>
                      <TableHead>Company Workspace</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No audit activity logs recorded.
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((l: AuditLogItem) => (
                        <TableRow key={l.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap py-4">
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                              {new Date(l.createdAt).toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="font-semibold text-sm whitespace-nowrap">
                            {l.user ? (
                              <Link href={`/admin/users/${l.user.id}`} className="hover:underline text-primary">
                                {l.user.name}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">System</span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge variant="info" className="font-mono text-[10px]">
                              {l.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-medium whitespace-nowrap">
                            <span className="flex items-center gap-1">
                              <FileText className="h-3.5 w-3.5 text-muted-foreground/75" />
                              {l.entity} ({l.entityId || '-'})
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {l.company ? (
                              <Link href={`/admin/companies/${l.company.id}`} className="font-medium text-sky-400 hover:underline text-xs flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5" />
                                {l.company.name}
                              </Link>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-sm truncate font-mono">
                            {JSON.stringify(l.metadata || {})}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableCardBody>

              {/* Pagination controls */}
              {pagination && pagination.totalPages > 1 && (
                <TableCardFooter className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= pagination.totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </TableCardFooter>
              )}
            </>
          )}
        </TableCard>
      </div>
    </AppShell>
  );
}

