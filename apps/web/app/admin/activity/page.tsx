'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService, AuditLogItem } from '../../../services/adminService';
import { Navbar } from '../../../components/layout/Navbar';
import { Sidebar } from '../../../components/layout/Sidebar';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Clock, Search, Loader2, RefreshCw, FileText, Building2 } from 'lucide-react';
import Link from 'next/link';

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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">System Activity Logs</h2>
              <p className="text-sm text-muted-foreground">Audit trail for all sensitive platform administrative actions.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 text-xs">
              <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh Logs
            </Button>
          </div>

          {/* Filters and search */}
          <div className="flex flex-wrap gap-4 items-center justify-between bg-card/25 border border-border/80 p-4 rounded-2xl">
            <div className="relative w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search actor name, email, action, details..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 bg-secondary/20"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Action:</span>
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-xl border border-border/60 bg-secondary/30 px-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Loading audit logs...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/80 bg-card/10 overflow-hidden">
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
              </div>

              {/* Pagination controls */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/40 pt-4">
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
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
