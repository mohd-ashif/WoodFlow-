'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../../services/adminService';
import { AccessRequestSummary, CompanySummary } from '@furniture-os/shared';
import { Navbar } from '../../../components/layout/Navbar';
import { Sidebar } from '../../../components/layout/Sidebar';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { Input } from '../../../components/ui/Input';
import { CheckCircle2, XCircle, Clock, Loader2, Search, ArrowRight, Building, Check, FileText } from 'lucide-react';

export default function AdminAccessRequestsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | ''>('PENDING');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Dialog & workflow state
  const [selectedRequest, setSelectedRequest] = useState<AccessRequestSummary | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [approvalOption, setApprovalOption] = useState<'create' | 'assign'>('create');

  // New Company form state
  const [companyDetails, setCompanyDetails] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
    gstNumber: '',
  });

  // Assign Existing form state
  const [selectedExistingCompanyId, setSelectedExistingCompanyId] = useState('');

  // Fetch access requests
  const { data: requestData, isLoading } = useQuery({
    queryKey: ['adminAccessRequests', currentPage, pageSize, searchQuery, statusFilter],
    queryFn: () =>
      adminService.listAccessRequests({
        page: currentPage,
        limit: pageSize,
        search: searchQuery || undefined,
        status: statusFilter || undefined,
      }),
  });

  // Fetch companies for "Assign Existing" dropdown
  const { data: companiesData } = useQuery({
    queryKey: ['adminCompaniesAll'],
    queryFn: () => adminService.listCompanies({ limit: 100 }),
    enabled: isApproveDialogOpen && approvalOption === 'assign',
  });

  const approveMutation = useMutation({
    mutationFn: (data: Parameters<typeof adminService.approveAccessRequest>[1]) =>
      adminService.approveAccessRequest(selectedRequest!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAccessRequests'] });
      setIsApproveDialogOpen(false);
      setSelectedRequest(null);
      resetApprovalForm();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => adminService.rejectAccessRequest(selectedRequest!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAccessRequests'] });
      setIsRejectDialogOpen(false);
      setSelectedRequest(null);
    },
  });

  const resetApprovalForm = () => {
    setCompanyDetails({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      postalCode: '',
      gstNumber: '',
    });
    setSelectedExistingCompanyId('');
    setApprovalOption('create');
  };

  const handleOpenApprove = (req: AccessRequestSummary) => {
    setSelectedRequest(req);
    setCompanyDetails((prev) => ({
      ...prev,
      name: req.requestedCompanyName,
      email: req.user?.email || '',
      phone: req.user?.phone || '',
    }));
    setIsApproveDialogOpen(true);
  };

  const handleOpenReject = (req: AccessRequestSummary) => {
    setSelectedRequest(req);
    setIsRejectDialogOpen(true);
  };

  const submitApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (approvalOption === 'create') {
      approveMutation.mutate({
        option: 'create',
        companyDetails,
      });
    } else {
      if (!selectedExistingCompanyId) return;
      approveMutation.mutate({
        option: 'assign',
        companyId: selectedExistingCompanyId,
      });
    }
  };

  const requests = requestData?.data?.requests || [];
  const pagination = requestData?.pagination;
  const companies = companiesData?.data?.companies || [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Access Requests</h2>
              <p className="text-sm text-muted-foreground">Review user requests for furniture company onboardings.</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap gap-4 items-center justify-between bg-card/25 border border-border/80 p-4 rounded-2xl">
            <div className="relative w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search user, email or company..."
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
                {(['PENDING', 'APPROVED', 'REJECTED', ''] as const).map((status) => (
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

          {/* Table list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Loading access requests...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Requested Company</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No access requests pending or recorded.
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map((r: AccessRequestSummary) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium text-foreground whitespace-nowrap">{r.user?.name || '-'}</TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">{r.user?.email || '-'}</TableCell>
                        <TableCell className="font-semibold text-primary whitespace-nowrap">{r.requestedCompanyName}</TableCell>
                        <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                          {r.message || '-'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {r.status === 'PENDING' && (
                            <Badge variant="warning" className="gap-1">
                              <Clock className="h-3 w-3" /> PENDING
                            </Badge>
                          )}
                          {r.status === 'APPROVED' && (
                            <Badge variant="success" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" /> APPROVED
                            </Badge>
                          )}
                          {r.status === 'REJECTED' && (
                            <Badge variant="danger" className="gap-1">
                              <XCircle className="h-3 w-3" /> REJECTED
                            </Badge>
                          )}
                          {r.status === 'CANCELLED' && (
                            <Badge variant="info" className="gap-1">
                              <XCircle className="h-3 w-3" /> CANCELLED
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {r.status === 'PENDING' && (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenApprove(r)}
                                className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 gap-1 text-xs"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenReject(r)}
                                className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10 gap-1 text-xs"
                              >
                                <XCircle className="h-3.5 w-3.5" /> Reject
                              </Button>
                            </div>
                          )}
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

          {/* Detailed Approve Workflow Dialog */}
          <Dialog
            isOpen={isApproveDialogOpen}
            onClose={() => {
              setIsApproveDialogOpen(false);
              resetApprovalForm();
            }}
            title="Approve Access Request"
            description={`Assign ${selectedRequest?.user?.name} to a furniture company tenant workspace.`}
          >
            <form onSubmit={submitApproval} className="space-y-5">
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-secondary/30 p-1 border border-border/40 mb-2">
                <button
                  type="button"
                  onClick={() => setApprovalOption('create')}
                  className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                    approvalOption === 'create'
                      ? 'bg-primary text-primary-foreground shadow'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Building className="h-3.5 w-3.5" /> Create New Company
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalOption('assign')}
                  className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                    approvalOption === 'assign'
                      ? 'bg-primary text-primary-foreground shadow'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ArrowRight className="h-3.5 w-3.5" /> Assign Existing
                </button>
              </div>

              {approvalOption === 'create' ? (
                <div className="space-y-4">
                  <Input
                    label="Company Name"
                    value={companyDetails.name}
                    onChange={(e) => setCompanyDetails((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Company Email"
                      type="email"
                      value={companyDetails.email}
                      onChange={(e) => setCompanyDetails((prev) => ({ ...prev, email: e.target.value }))}
                    />
                    <Input
                      label="Company Phone"
                      value={companyDetails.phone}
                      onChange={(e) => setCompanyDetails((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>

                  <Input
                    label="Street Address"
                    value={companyDetails.address}
                    onChange={(e) => setCompanyDetails((prev) => ({ ...prev, address: e.target.value }))}
                  />

                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      label="City"
                      value={companyDetails.city}
                      onChange={(e) => setCompanyDetails((prev) => ({ ...prev, city: e.target.value }))}
                    />
                    <Input
                      label="State"
                      value={companyDetails.state}
                      onChange={(e) => setCompanyDetails((prev) => ({ ...prev, state: e.target.value }))}
                    />
                    <Input
                      label="GST Number"
                      value={companyDetails.gstNumber}
                      onChange={(e) => setCompanyDetails((prev) => ({ ...prev, gstNumber: e.target.value }))}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Search Active Companies
                    </label>
                    <select
                      value={selectedExistingCompanyId}
                      onChange={(e) => setSelectedExistingCompanyId(e.target.value)}
                      className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      required
                    >
                      <option value="">Select a company workspace...</option>
                      {companies.map((c: CompanySummary) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.slug})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsApproveDialogOpen(false);
                    resetApprovalForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={approveMutation.isPending}>
                  Approve and Assign
                </Button>
              </div>
            </form>
          </Dialog>

          {/* Reject Confirmation Dialog */}
          <Dialog
            isOpen={isRejectDialogOpen}
            onClose={() => setIsRejectDialogOpen(false)}
            title="Reject Access Request"
            description="Are you sure you want to reject this access request? The user will be notified of the rejection."
          >
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="outline"
                className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                onClick={() => rejectMutation.mutate()}
                isLoading={rejectMutation.isPending}
              >
                Reject Request
              </Button>
            </div>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
