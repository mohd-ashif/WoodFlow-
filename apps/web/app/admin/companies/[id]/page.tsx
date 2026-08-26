'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../../../services/adminService';
import { CompanyRole, MemberStatus, UserStatus } from '@furniture-os/shared';
import { Navbar } from '../../../../components/layout/Navbar';
import { Sidebar } from '../../../../components/layout/Sidebar';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../components/ui/Table';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Dialog } from '../../../../components/ui/Dialog';
import { Input } from '../../../../components/ui/Input';
import {
  Building2,
  Users,
  Shield,
  Clock,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Power,
  CheckCircle,
  Mail,
  Phone,
  MapPin,
  FileText,
  User,
  Plus,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminCompanyDetailsPage({ params }: { params: { id: string } }) {
  const companyId = params.id;
  const queryClient = useQueryClient();

  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isActivateOpen, setIsActivateOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<CompanyRole>('MEMBER');
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch company details
  const { data, isLoading, error } = useQuery({
    queryKey: ['adminCompanyDetails', companyId],
    queryFn: () => adminService.getCompany(companyId),
  });

  // Fetch all users to display list for assignment
  const { data: allUsersData } = useQuery({
    queryKey: ['adminUsersDropdown'],
    queryFn: () => adminService.listUsers({ limit: 100 }),
    enabled: isAddUserOpen,
  });

  const company = data?.company;
  const members = company?.members || [];
  const accessRequests = company?.accessRequests || [];
  const logs = company?.auditLogs || [];
  const ownerMember = members.find((m) => m.role === 'OWNER');
  const allUsers = allUsersData?.data?.users || [];

  const suspendMutation = useMutation({
    mutationFn: () => adminService.suspendCompany(companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCompanyDetails', companyId] });
      setIsSuspendOpen(false);
    },
  });

  const activateMutation = useMutation({
    mutationFn: () => adminService.activateCompany(companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCompanyDetails', companyId] });
      setIsActivateOpen(false);
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: (userId: string) => adminService.assignUserToCompany(userId, companyId, newMemberRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCompanyDetails', companyId] });
      setIsAddUserOpen(false);
      setNewMemberEmail('');
      setActionError(null);
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to add user to company');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberUserId, role }: { memberUserId: string; role: CompanyRole }) =>
      adminService.assignUserToCompany(memberUserId, companyId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCompanyDetails', companyId] });
      setActionError(null);
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to update member role');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberUserId: string) => adminService.removeUserFromCompany(memberUserId, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCompanyDetails', companyId] });
      setIsRemoveOpen(false);
      setSelectedMember(null);
      setActionError(null);
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to remove user from company');
      setIsRemoveOpen(false);
    },
  });

  const handleAddMemberByEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const userToAssign = allUsers.find((u) => u.email.toLowerCase() === newMemberEmail.trim().toLowerCase());
    if (!userToAssign) {
      setActionError('User with this email not found on the platform.');
      return;
    }
    addMemberMutation.mutate(userToAssign.id);
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
              <span>Loading Company Details...</span>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8 text-center space-y-4">
            <p className="text-rose-400">Failed to load company details.</p>
            <Link href="/admin/companies">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to Companies
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
          {/* Top nav path */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/companies">
                <Button variant="outline" size="sm" className="p-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">{company.name}</h2>
                  {company.status === 'ACTIVE' ? (
                    <Badge variant="success">ACTIVE</Badge>
                  ) : (
                    <Badge variant="danger">SUSPENDED</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Workspace ID: {company.id}</p>
              </div>
            </div>

            <div className="flex gap-2">
              {company.status === 'ACTIVE' ? (
                <Button
                  variant="outline"
                  onClick={() => setIsSuspendOpen(true)}
                  className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10 gap-2"
                >
                  <Power className="h-4 w-4" /> Suspend Workspace
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setIsActivateOpen(true)}
                  className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 gap-2"
                >
                  <CheckCircle className="h-4 w-4" /> Activate Workspace
                </Button>
              )}
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

          {/* Grid info Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Metadata Card */}
            <div className="bg-card/30 border border-border/80 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Company Details
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Slug URL</span>
                  <span className="font-mono text-foreground">{company.slug}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground/75" />
                  <span>{company.email || 'No email provided'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground/75" />
                  <span>{company.phone || 'No phone number'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground/75 shrink-0 mt-0.5" />
                  <span>
                    {company.address ? `${company.address}, ` : ''}
                    {company.city ? `${company.city}, ` : ''}
                    {company.state ? `${company.state}` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">GSTIN / Tax ID</span>
                  <span>{company.gstNumber || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* Owner Card */}
            <div className="bg-card/30 border border-border/80 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> Workspace Owner
              </h3>
              {ownerMember ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{ownerMember.user.name}</p>
                      <p className="text-xs text-muted-foreground">ID: {ownerMember.user.id}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground/75" />
                      <span>{ownerMember.user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground/75" />
                      <span>{ownerMember.user.phone || 'No phone number'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground/75" />
                      <span className="text-xs text-muted-foreground">
                        Last Active: {ownerMember.user.lastLoginAt ? new Date(ownerMember.user.lastLoginAt).toLocaleString() : 'Never logged in'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-amber-400">
                  <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
                  No owner assigned. Assign an owner from the users roster.
                </div>
              )}
            </div>

            {/* Quick stats / summary */}
            <div className="bg-card/30 border border-border/80 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Workspace Summary
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/20 p-4 rounded-xl border border-border/40 text-center">
                  <span className="text-2xl font-bold text-foreground">{members.length}</span>
                  <span className="text-xs text-muted-foreground block mt-1">Workspace Users</span>
                </div>
                <div className="bg-secondary/20 p-4 rounded-xl border border-border/40 text-center">
                  <span className="text-2xl font-bold text-foreground">{accessRequests.length}</span>
                  <span className="text-xs text-muted-foreground block mt-1">Access Requests</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-1 pt-2">
                <p>Created: {new Date(company.createdAt).toLocaleDateString()}</p>
                <p>Last Activity Logged: {logs[0] ? new Date(logs[0].createdAt).toLocaleDateString() : 'None'}</p>
              </div>
            </div>
          </div>

          {/* Roster lists tabs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Workspace Roster
              </h3>
              <Button size="sm" onClick={() => setIsAddUserOpen(true)} className="gap-1 text-xs">
                <Plus className="h-3.5 w-3.5" /> Assign User
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No users assigned to this company.
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((m: any) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium text-foreground">{m.user.name}</TableCell>
                      <TableCell className="text-muted-foreground">{m.user.email}</TableCell>
                      <TableCell>
                        <select
                          value={m.role}
                          onChange={(e) =>
                            updateRoleMutation.mutate({
                              memberUserId: m.user.id,
                              role: e.target.value as CompanyRole,
                            })
                          }
                          className="rounded-lg border border-border bg-secondary/30 px-2 py-1 text-xs text-foreground focus-visible:outline-none"
                        >
                          <option value="OWNER">Owner</option>
                          <option value="MEMBER">Member</option>
                        </select>
                      </TableCell>
                      <TableCell>
                        {m.status === 'ACTIVE' ? (
                          <Badge variant="success">ACTIVE</Badge>
                        ) : (
                          <Badge variant="danger">INACTIVE</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMember(m);
                            setIsRemoveOpen(true);
                          }}
                          className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10 gap-1 text-xs"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Access request associated */}
          {accessRequests.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Associated Access Requests
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessRequests.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-foreground">{r.user?.name || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{r.user?.email || '-'}</TableCell>
                      <TableCell>
                        {r.status === 'APPROVED' && <Badge variant="success">APPROVED</Badge>}
                        {r.status === 'PENDING' && <Badge variant="warning">PENDING</Badge>}
                        {r.status === 'REJECTED' && <Badge variant="danger">REJECTED</Badge>}
                        {r.status === 'CANCELLED' && <Badge variant="info">CANCELLED</Badge>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Recent Audit Logs */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Recent Workspace Activity Logs
            </h3>
            <div className="rounded-2xl border border-border/80 bg-card/10 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        No recent activity recorded for this workspace.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((l: any) => (
                      <TableRow key={l.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(l.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">{l.user?.name || 'System'}</TableCell>
                        <TableCell>
                          <Badge variant="info" className="font-mono text-[10px]">
                            {l.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {JSON.stringify(l.metadata || {})}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Suspend Confirmation Dialog */}
          <Dialog
            isOpen={isSuspendOpen}
            onClose={() => setIsSuspendOpen(false)}
            title="Suspend Workspace"
            description={`Are you sure you want to suspend ${company.name}? Suspending this company will prevent all company users from accessing company resources.`}
          >
            <div className="flex items-start gap-3 rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-300 my-4">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>
                <strong>Warning:</strong> All active sessions for this company will immediately be redirected to the suspended landing page.
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
            title="Activate Workspace"
            description={`Are you sure you want to reactivate ${company.name}? Company users will regain immediate access.`}
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
                Activate Workspace
              </Button>
            </div>
          </Dialog>

          {/* Assign User Modal */}
          <Dialog
            isOpen={isAddUserOpen}
            onClose={() => {
              setIsAddUserOpen(false);
              setNewMemberEmail('');
              setActionError(null);
            }}
            title="Assign User to Workspace"
            description="Assign an existing user account to this company workspace."
          >
            <form onSubmit={handleAddMemberByEmail} className="space-y-4">
              <Input
                label="Enter User Email"
                placeholder="e.g. employee@company.com"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Company Role
                </label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as CompanyRole)}
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
                    setIsAddUserOpen(false);
                    setNewMemberEmail('');
                    setActionError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={addMemberMutation.isPending}>
                  Assign User
                </Button>
              </div>
            </form>
          </Dialog>

          {/* Remove Member Dialog */}
          <Dialog
            isOpen={isRemoveOpen}
            onClose={() => {
              setIsRemoveOpen(false);
              setSelectedMember(null);
            }}
            title="Remove User Membership"
            description={`Are you sure you want to remove ${selectedMember?.user?.name} from this company workspace?`}
          >
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsRemoveOpen(false);
                  setSelectedMember(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                onClick={() => removeMemberMutation.mutate(selectedMember.user.id)}
                isLoading={removeMemberMutation.isPending}
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
