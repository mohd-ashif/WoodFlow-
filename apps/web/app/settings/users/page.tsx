'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '../../../services/companyService';
import { AppShell } from '../../../components/layout/AppShell';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { Input } from '../../../components/ui/Input';
import { useAuth } from '../../../components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { CompanyRole, MemberStatus } from '@furniture-os/shared';
import { Users, Shield, Power, Loader2, Mail, ShieldCheck, AlertCircle, Plus } from 'lucide-react';

export default function CompanyUsersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'MEMBER' as CompanyRole,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const isOwner = user?.activeMembership?.role === 'OWNER';
  const router = useRouter();

  useEffect(() => {
    if (user && user.activeMembership?.role !== 'OWNER') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['companyMembers'],
    queryFn: companyService.getMembers,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: CompanyRole }) =>
      companyService.updateMemberRole(memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyMembers'] });
      setActionError(null);
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to update member role');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ memberId, status }: { memberId: string; status: MemberStatus }) =>
      companyService.updateMemberStatus(memberId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyMembers'] });
      setActionError(null);
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to update member status');
    },
  });

  const createMemberMutation = useMutation({
    mutationFn: companyService.createMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyMembers'] });
      setIsOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create member');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'MEMBER',
    });
    setFormError(null);
  };

  const members = (data as any)?.members || (Array.isArray(data) ? data : (data as any)?.data?.members || []);

  const roleOptions: CompanyRole[] = ['OWNER', 'MEMBER'];

  return (
    <AppShell>
      <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">User Management</h2>
              <p className="text-sm text-muted-foreground">Manage employees and workspace permissions for your company.</p>
            </div>
            {isOwner && (
              <Button onClick={() => setIsOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Add User
              </Button>
            )}
          </div>

          {actionError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Loading company members...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Workspace Role</TableHead>
                  <TableHead>Status</TableHead>
                  {isOwner && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isOwner ? 5 : 4} className="text-center py-8 text-muted-foreground">
                      No members registered in company.
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((m: any) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-semibold text-foreground flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        {m.user?.name || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground/70" />
                          {m.user?.email || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {isOwner ? (
                          <select
                            value={m.role}
                            onChange={(e) =>
                              updateRoleMutation.mutate({
                                memberId: m.id,
                                role: e.target.value as CompanyRole,
                              })
                            }
                            className="rounded-lg border border-border bg-secondary/30 px-2 py-1 text-xs text-foreground focus-visible:outline-none"
                          >
                            {roleOptions.map((r) => (
                              <option key={r} value={r}>
                                {r === 'OWNER' ? 'Owner' : 'Member'}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs font-semibold text-muted-foreground uppercase">
                            {m.role === 'OWNER' ? 'Owner' : 'Member'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {m.status === 'ACTIVE' && <Badge variant="success">ACTIVE</Badge>}
                        {m.status === 'INACTIVE' && <Badge variant="danger">INACTIVE</Badge>}
                      </TableCell>
                      {isOwner && (
                        <TableCell className="text-right">
                          {m.status === 'ACTIVE' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  memberId: m.id,
                                  status: 'INACTIVE',
                                })
                              }
                              className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10 gap-1 text-xs"
                            >
                              <Power className="h-3.5 w-3.5" /> Deactivate
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  memberId: m.id,
                                  status: 'ACTIVE',
                                })
                              }
                              className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 gap-1 text-xs"
                            >
                              <Shield className="h-3.5 w-3.5" /> Activate
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
      </div>

      <Dialog
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          resetForm();
        }}
        title="Add Company User"
        description="Create a new user profile and assign them to your company workspace."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMemberMutation.mutate(formData);
          }}
          className="space-y-4"
        >
          {formError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              {formError}
            </div>
          )}

          <Input
            label="Full Name"
            placeholder="e.g. John Doe"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. john@company.com"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            required
          />

          <Input
            label="Phone Number (Optional)"
            placeholder="e.g. +91 9999999999"
            value={formData.phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
          />

          <Input
            label="Password"
            type="password"
            placeholder="At least 8 chars, 1 uppercase, 1 special char"
            value={formData.password}
            onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Workspace Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value as CompanyRole }))}
              className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="MEMBER">Member (Standard Access)</option>
              <option value="OWNER">Owner (Full Permissions)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createMemberMutation.isPending}>
              Create User
            </Button>
          </div>
        </form>
      </Dialog>
    </AppShell>
  );
}
