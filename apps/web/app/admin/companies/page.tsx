'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCompanySchema, CreateCompanyInput, CompanySummary, UserSummary } from '@furniture-os/shared';
import { adminService } from '../../../services/adminService';
import { Navbar } from '../../../components/layout/Navbar';
import { Sidebar } from '../../../components/layout/Sidebar';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { Input } from '../../../components/ui/Input';
import { Building2, Plus, Power, CheckCircle, Loader2, Search, Eye, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function AdminCompaniesPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isActivateOpen, setIsActivateOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanySummary | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'SUSPENDED' | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch companies
  const { data: companiesData, isLoading } = useQuery({
    queryKey: ['adminCompanies', currentPage, pageSize, searchQuery, statusFilter],
    queryFn: () =>
      adminService.listCompanies({
        page: currentPage,
        limit: pageSize,
        search: searchQuery || undefined,
        status: statusFilter || undefined,
      }),
  });

  // Fetch all users for owner assignment dropdown
  const { data: usersData } = useQuery({
    queryKey: ['adminUsersDropdown'],
    queryFn: () => adminService.listUsers({ limit: 100 }),
    enabled: isCreateOpen,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateCompanyInput>({
    resolver: zodResolver(createCompanySchema),
  });

  const createMutation = useMutation({
    mutationFn: adminService.createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCompanies'] });
      setIsCreateOpen(false);
      reset();
      setErrorMsg(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to create company');
    },
  });

  const suspendMutation = useMutation({
    mutationFn: () => adminService.suspendCompany(selectedCompany!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCompanies'] });
      setIsSuspendOpen(false);
      setSelectedCompany(null);
    },
  });

  const activateMutation = useMutation({
    mutationFn: () => adminService.activateCompany(selectedCompany!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCompanies'] });
      setIsActivateOpen(false);
      setSelectedCompany(null);
    },
  });

  const companies = companiesData?.data?.companies || [];
  const pagination = companiesData?.pagination;
  const users = usersData?.data?.users || [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Company Management</h2>
              <p className="text-sm text-muted-foreground">Manage onboarded multi-tenant furniture businesses.</p>
            </div>
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Add Company
            </Button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap gap-4 items-center justify-between bg-card/25 border border-border/80 p-4 rounded-2xl">
            <div className="relative w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search company or slug..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 bg-secondary/20"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Status:</span>
              <div className="flex rounded-xl bg-secondary/30 p-1 border border-border/40">
                {(['ACTIVE', 'SUSPENDED', ''] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      statusFilter === status
                        ? 'bg-primary text-primary-foreground shadow'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {status === '' ? 'ALL' : status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Loading companies...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Contact Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No companies found. Click "Add Company" to onboard a new business.
                      </TableCell>
                    </TableRow>
                  ) : (
                    companies.map((c: CompanySummary) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium text-foreground whitespace-nowrap">
                          <span className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-primary" />
                            {c.name}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">{c.slug}</TableCell>
                        <TableCell className="whitespace-nowrap">{c.email || '-'}</TableCell>
                        <TableCell className="whitespace-nowrap">{c.phone || '-'}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {c.status === 'ACTIVE' && <Badge variant="success">ACTIVE</Badge>}
                          {c.status === 'SUSPENDED' && <Badge variant="danger">SUSPENDED</Badge>}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/admin/companies/${c.id}`}>
                              <Button variant="outline" size="sm" className="gap-1 text-xs">
                                <Eye className="h-3.5 w-3.5" /> View
                              </Button>
                            </Link>
                            {c.status === 'ACTIVE' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedCompany(c);
                                  setIsSuspendOpen(true);
                                }}
                                className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10 gap-1 text-xs"
                              >
                                <Power className="h-3.5 w-3.5" /> Suspend
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedCompany(c);
                                  setIsActivateOpen(true);
                                }}
                                className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 gap-1 text-xs"
                              >
                                <CheckCircle className="h-3.5 w-3.5" /> Activate
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
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

          {/* Add Company Modal */}
          <Dialog
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            title="Onboard New Company"
            description="Create a new furniture company tenant and assign a Company Owner."
          >
            <form onSubmit={handleSubmit((d: CreateCompanyInput) => createMutation.mutate(d))} className="space-y-4">
              {errorMsg && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  {errorMsg}
                </div>
              )}

              <Input label="Company Name" placeholder="e.g. Royal Furniture" error={errors.name?.message} {...register('name')} />
              <Input label="Slug (URL unique)" placeholder="e.g. royal-furniture" error={errors.slug?.message} {...register('slug')} />

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Assign Owner User
                </label>
                <select
                  className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register('ownerId')}
                >
                  <option value="">Select User...</option>
                  {users.map((u: UserSummary) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
                {errors.ownerId?.message && typeof errors.ownerId.message === 'string' && (
                  <p className="text-xs text-destructive">{errors.ownerId.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input label="Email" type="email" placeholder="contact@company.com" {...register('email')} />
                <Input label="Phone" placeholder="+18005550199" {...register('phone')} />
              </div>

              <Input label="Address" placeholder="100 Industrial Parkway" {...register('address')} />

              <div className="grid grid-cols-3 gap-3">
                <Input label="City" placeholder="Grand Rapids" {...register('city')} />
                <Input label="State" placeholder="MI" {...register('state')} />
                <Input label="GST / Tax ID" placeholder="29ABCDE1234F1Z5" {...register('gstNumber')} />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={createMutation.isPending}>
                  Create & Activate Company
                </Button>
              </div>
            </form>
          </Dialog>

          {/* Suspend Confirmation Dialog */}
          <Dialog
            isOpen={isSuspendOpen}
            onClose={() => setIsSuspendOpen(false)}
            title="Suspend Company Workspace"
            description="Are you sure you want to suspend this company? Suspending this company will prevent all company users from accessing company resources."
          >
            <div className="flex items-start gap-3 rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-300 my-4">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>
                <strong>Warning:</strong> All active sessions for this tenant's employees will be blocked from accessing the application immediately.
              </span>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsSuspendOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="outline"
                className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                onClick={() => suspendMutation.mutate()}
                isLoading={suspendMutation.isPending}
              >
                Suspend Company
              </Button>
            </div>
          </Dialog>

          {/* Activate Confirmation Dialog */}
          <Dialog
            isOpen={isActivateOpen}
            onClose={() => setIsActivateOpen(false)}
            title="Activate Company Workspace"
            description="Are you sure you want to reactivate this company workspace? All company users will immediately regain access to their dashboard."
          >
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsActivateOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="outline"
                className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                onClick={() => activateMutation.mutate()}
                isLoading={activateMutation.isPending}
              >
                Activate Company
              </Button>
            </div>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
