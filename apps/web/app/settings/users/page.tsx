'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '../../../services/companyService';
import { Navbar } from '../../../components/layout/Navbar';
import { Sidebar } from '../../../components/layout/Sidebar';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { CompanyRole, MemberStatus } from '@furniture-os/shared';
import { Users, Shield, Power, Loader2, Mail, ShieldCheck, AlertCircle } from 'lucide-react';

export default function CompanyUsersPage() {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

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

  const members = data?.members || [];

  const roleOptions: CompanyRole[] = ['OWNER', 'MEMBER'];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">User Management</h2>
              <p className="text-sm text-muted-foreground">Manage employees and workspace permissions for your company.</p>
            </div>
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
                      </TableCell>
                      <TableCell>
                        {m.status === 'ACTIVE' && <Badge variant="success">ACTIVE</Badge>}
                        {m.status === 'INACTIVE' && <Badge variant="danger">INACTIVE</Badge>}
                      </TableCell>
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </main>
      </div>
    </div>
  );
}
