'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../../services/adminService';
import { UserSummary } from '@furniture-os/shared';
import { Navbar } from '../../../components/layout/Navbar';
import { Sidebar } from '../../../components/layout/Sidebar';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { User, Phone, Mail, Loader2, Search, Eye, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Fetch users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['adminUsers', currentPage, pageSize, searchQuery, filterType],
    queryFn: () =>
      adminService.listUsers({
        page: currentPage,
        limit: pageSize,
        search: searchQuery || undefined,
        filter: filterType !== 'all' ? filterType : undefined,
      }),
  });

  const users = usersData?.data?.users || [];
  const pagination = usersData?.pagination;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Platform Users</h2>
              <p className="text-sm text-muted-foreground">All registered users across FurnitureOS platform.</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap gap-4 items-center justify-between bg-card/25 border border-border/80 p-4 rounded-2xl">
            <div className="relative w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, email, phone or company..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 bg-secondary/20"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Filter:</span>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-xl border border-border/60 bg-secondary/30 px-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">All Users</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="pendingAccess">Pending Access Request</option>
                <option value="noCompany">No Company / Guest</option>
                <option value="companyUsers">Company Users</option>
                <option value="platformAdmins">Platform Admins</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Loading users...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Associated Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No users found matching filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => {
                      const activeMembership = u.memberships?.[0];
                      const companyName = activeMembership?.company?.name || '-';
                      const companyRole = activeMembership?.role || '';
                      
                      return (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium text-foreground">
                            <span className="flex items-center gap-2">
                              <User className="h-4 w-4 text-primary" />
                              {u.name}
                              {u.systemRole === 'PLATFORM_ADMIN' && (
                                <Badge variant="warning" className="text-[10px] py-0 px-1.5">
                                  ADMIN
                                </Badge>
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground/75" />
                              {u.email}
                            </span>
                          </TableCell>
                          <TableCell>
                            {activeMembership ? (
                              <span className="flex items-center gap-1.5 text-sm text-foreground font-medium">
                                <Building2 className="h-3.5 w-3.5 text-sky-400" />
                                {companyName} 
                                <span className="text-xs text-muted-foreground font-normal">
                                  ({companyRole.replace('_', ' ')})
                                </span>
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">No company workspace</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {u.status === 'ACTIVE' && <Badge variant="success">ACTIVE</Badge>}
                            {u.status === 'INACTIVE' && <Badge variant="info">INACTIVE</Badge>}
                            {u.status === 'SUSPENDED' && <Badge variant="danger">SUSPENDED</Badge>}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/admin/users/${u.id}`}>
                              <Button variant="outline" size="sm" className="gap-1 text-xs">
                                <Eye className="h-3.5 w-3.5" /> View Profile
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

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
