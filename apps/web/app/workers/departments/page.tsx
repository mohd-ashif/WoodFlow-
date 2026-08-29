'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workerService } from '../../../services/workerService';
import { Navbar } from '../../../components/layout/Navbar';
import { Sidebar } from '../../../components/layout/Sidebar';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card } from '../../../components/ui/Card';
import { useToast } from '../../../components/ui/Toast';
import { Building2, Plus, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['departmentsList'],
    queryFn: () => workerService.getDepartments(),
  });

  const createDeptMutation = useMutation({
    mutationFn: (input: any) => workerService.createDepartment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departmentsList'] });
      setIsAddOpen(false);
      setName('');
      setDescription('');
      toast.success('Department created successfully!');
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to create department'),
  });

  const departments = data?.data || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDeptMutation.mutate({ name, description });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/workers">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Workers</span>
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Company Departments</h2>
              <p className="text-sm text-muted-foreground">
                Manage factory departments (e.g. Carpentry, Polishing, Assembly, Warehouse).
              </p>
            </div>
            <Button onClick={() => setIsAddOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" />
              <span>Add Department</span>
            </Button>
          </div>

          {isAddOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
                <h3 className="text-lg font-bold text-foreground">Create Department</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Department Name *</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Carpentry"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Description</label>
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Wood cutting and structural assembly department"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createDeptMutation.isPending}>
                      {createDeptMutation.isPending ? 'Creating...' : 'Create'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Workers Count</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span>Loading departments...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : departments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No departments created yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  departments.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-semibold text-foreground flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span>{dept.name}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {dept.description || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {dept._count?.workers ?? 0} Workers
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          {dept.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </main>
      </div>
    </div>
  );
}
