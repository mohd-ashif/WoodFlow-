'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../../../services/adminService';
import { UserStatus, CompanyRole, SystemRole, MemberStatus } from '@furniture-os/shared';
import { Navbar } from '../../../../components/layout/Navbar';
import { Sidebar } from '../../../../components/layout/Sidebar';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../components/ui/Table';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Dialog } from '../../../../components/ui/Dialog';
import { Input } from '../../../../components/ui/Input';
import {
  User,
  Building2,
  Mail,
  Phone,
  Clock,
  ArrowLeft,
  Loader2,
  Shield,
  FileText,
  AlertTriangle,
  Power,
  Trash2,
  Plus,
  Activity,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminUserDetailsPage({ params }: { params: { id: string } }) {
  const userId = params.id;
  const queryClient = useQueryClient();

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<any>(null);

  const [statusToUpdate, setStatusToUpdate] = useState<UserStatus>('ACTIVE');
  const [assignCompanyId, setAssignCompanyId] = useState('');
  const [assignRole, setAssignRole] = useState<CompanyRole>('MEMBER');
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch user details
  const { data, isLoading, error } = useQuery({
    queryKey: ['adminUserDetails', userId],
    queryFn: () => adminService.getUser(userId),
  });

  // Fetch companies for dropdown selection
  const { data: companiesData } = useQuery({
    queryKey: ['adminCompaniesDropdown'],
    queryFn: () => adminService.listCompanies({ limit: 100 }),
    enabled: isAssignOpen,
  });

  const user = data?.user;
  const memberships = user?.memberships || [];
  const accessRequests = user?.accessRequests || [];
  const logs = user?.auditLogs || [];
  const companies = companiesData?.data?.companies || [];

  const updateStatusMutation = useMutation({
    mutationFn: (status: UserStatus) => adminService.updateUserStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUserDetails', userId] });
      setIsStatusOpen(false);
      setActionError(null);
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to update user status');
    },
  });

  const assignCompanyMutation = useMutation({
    mutationFn: () => adminService.assignUserToCompany(userId, assignCompanyId, assignRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUserDetails', userId] });
      setIsAssignOpen(false);
      setAssignCompanyId('');
      setActionError(null);
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to assign user to company');
    },
  });

  const removeCompanyMutation = useMutation({
    mutationFn: (companyId: string) => adminService.removeUserFromCompany(userId, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUserDetails', userId] });
      setIsRemoveOpen(false);
      setSelectedMembership(null);
      setActionError(null);
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to remove user from company');
      setIsRemoveOpen(false);
    },
  });

  const handleOpenStatus = (currentStatus: UserStatus) => {
    setStatusToUpdate(currentStatus);
    setIsStatusOpen(true);
  };

  const handleRemoveClick = (m: any) => {
    setSelectedMembership(m);
    setIsRemoveOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Loading User Details...</span>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8 text-center space-y-4">
            <p className="text-rose-400">Failed to load user profile.</p>
            <Link href="/admin/users">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to Users
              </Button>
            </Link>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 space-y-6">
          {/* Top navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/users">
                <Button variant="outline" size="sm" className="p-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">{user.name}</h2>
                  {user.systemRole === 'PLATFORM_ADMIN' && <Badge variant="warning">PLATFORM ADMIN</Badge>}
                  {user.status === 'ACTIVE' && <Badge variant="success">ACTIVE</Badge>}
                  {user.status === 'INACTIVE' && <Badge variant="info">INACTIVE</Badge>}
                  {user.status === 'SUSPENDED' && <Badge variant="danger">SUSPENDED</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">User ID: {user.id}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleOpenStatus(user.status)} className="gap-1 text-xs">
                <Power className="h-3.5 w-3.5" /> Change Account Status
              </Button>
            </div>
          </div>

          {actionError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center justify-between">
              <span>{actionError}</span>
              <button onClick={() => setActionError(null)} className="font-bold hover:underline">
                Dismiss
              </button>
            </div>
          )}

          {/* Grid Layout Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Profile Card */}
            <div className="bg-card/30 border border-border/80 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Profile Info
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Email Address</span>
                  <span className="flex items-center gap-2 mt-0.5">
                    <Mail className="h-4 w-4 text-muted-foreground/75" />
                    {user.email}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Phone Number</span>
                  <span className="flex items-center gap-2 mt-0.5">
                    <Phone className="h-4 w-4 text-muted-foreground/75" />
                    {user.phone || 'No phone number'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Registration Date</span>
                  <span className="flex items-center gap-2 mt-0.5">
                    <Clock className="h-4 w-4 text-muted-foreground/75" />
                    {new Date(user.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Last Login Timestamp</span>
                  <span className="flex items-center gap-2 mt-0.5">
                    <Clock className="h-4 w-4 text-muted-foreground/75" />
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never logged in'}
                  </span>
                </div>
              </div>
            </div>

            {/* Memberships summary Card */}
            <div className="bg-card/30 border border-border/80 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Workspace Memberships
              </h3>
              <div className="space-y-4">
                {memberships.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    This user is not associated with any company workspace yet.
                  </div>
                ) : (
                  memberships.map((m) => (
                    <div key={m.id} className="p-4 rounded-xl bg-secondary/20 border border-border/40 flex items-center justify-between">
                      <div>
                        <Link href={`/admin/companies/${m.company.id}`} className="font-semibold text-foreground hover:underline">
                          {m.company.name}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider font-semibold flex gap-1">
                          Role: <span className="text-primary">{m.role.replace('_', ' ')}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.status === 'ACTIVE' ? (
                          <Badge variant="success">ACTIVE</Badge>
                        ) : (
                          <Badge variant="danger">INACTIVE</Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveClick(m)}
                          className="text-rose-400 border-rose-500/20 hover:bg-rose-500/10 p-1.5 h-8"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
                <Button size="sm" onClick={() => setIsAssignOpen(true)} className="w-full gap-1 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Assign to Company Workspace
                </Button>
              </div>
            </div>

            {/* Access Requests Card */}
            <div className="bg-card/30 border border-border/80 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Access Requests Log
              </h3>
              {accessRequests.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No access requests submitted.
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {accessRequests.map((r) => (
                    <div key={r.id} className="p-3 rounded-lg bg-secondary/10 border border-border/40 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{r.requestedCompanyName}</span>
                        {r.status === 'APPROVED' && <Badge variant="success" className="text-[10px]">APPROVED</Badge>}
                        {r.status === 'PENDING' && <Badge variant="warning" className="text-[10px]">PENDING</Badge>}
                        {r.status === 'REJECTED' && <Badge variant="danger" className="text-[10px]">REJECTED</Badge>}
                        {r.status === 'CANCELLED' && <Badge variant="info" className="text-[10px]">CANCELLED</Badge>}
                      </div>
                      {r.message && <p className="text-muted-foreground italic">"{r.message}"</p>}
                      <p className="text-[10px] text-muted-foreground/70">
                        Submitted: {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Audit Trail Activity logs */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> User Audit Trail Logs
            </h3>
            <div className="rounded-2xl border border-border/80 bg-card/10 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        No activity logs found for this user.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((l: any) => (
                      <TableRow key={l.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(l.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="info" className="font-mono text-[10px]">
                            {l.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-xs">{l.entity}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {JSON.stringify(l.metadata || {})}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{l.ipAddress || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Change status dialog */}
          <Dialog
            isOpen={isStatusOpen}
            onClose={() => setIsStatusOpen(false)}
            title="Update User Account Status"
            description={`Change platform accessibility for user ${user.name}`}
          >
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Select Status
                </label>
                <select
                  value={statusToUpdate}
                  onChange={(e) => setStatusToUpdate(e.target.value as UserStatus)}
                  className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus-visible:outline-none"
                >
                  <option value="ACTIVE">Active (Can authenticate & access assigned companies)</option>
                  <option value="INACTIVE">Inactive (Soft deactivation)</option>
                  <option value="SUSPENDED">Suspended (Blocked globally from the platform)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsStatusOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => updateStatusMutation.mutate(statusToUpdate)}
                  isLoading={updateStatusMutation.isPending}
                >
                  Save Status
                </Button>
              </div>
            </div>
          </Dialog>

          {/* Assign User Workspace Modal */}
          <Dialog
            isOpen={isAssignOpen}
            onClose={() => {
              setIsAssignOpen(false);
              setAssignCompanyId('');
              setActionError(null);
            }}
            title="Assign User to Workspace"
            description="Add this user account to a company workspace tenant."
          >
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Select Workspace Company
                </label>
                <select
                  value={assignCompanyId}
                  onChange={(e) => setAssignCompanyId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus-visible:outline-none"
                >
                  <option value="">Select Company...</option>
                  {companies.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Membership Role
                </label>
                <select
                  value={assignRole}
                  onChange={(e) => setAssignRole(e.target.value as CompanyRole)}
                  className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus-visible:outline-none"
                >
                  <option value="MEMBER">Member</option>
                  <option value="OWNER">Owner</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAssignOpen(false);
                    setAssignCompanyId('');
                    setActionError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => assignCompanyMutation.mutate()}
                  isLoading={assignCompanyMutation.isPending}
                  disabled={!assignCompanyId}
                >
                  Assign Workspace
                </Button>
              </div>
            </div>
          </Dialog>

          {/* Remove Company membership confirmation dialog */}
          <Dialog
            isOpen={isRemoveOpen}
            onClose={() => {
              setIsRemoveOpen(false);
              setSelectedMembership(null);
            }}
            title="Remove Company Membership"
            description={`Are you sure you want to remove ${user.name} from the company workspace ${selectedMembership?.company?.name}?`}
          >
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsRemoveOpen(false);
                  setSelectedMembership(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                onClick={() => removeCompanyMutation.mutate(selectedMembership.company.id)}
                isLoading={removeCompanyMutation.isPending}
              >
                Remove Membership
              </Button>
            </div>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
