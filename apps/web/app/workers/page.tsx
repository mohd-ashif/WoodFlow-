'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workerService } from '../../services/workerService';
import { AppShell } from '../../components/layout/AppShell';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import { Users, Search, Plus, Loader2, Building2, Phone, Mail, Eye } from 'lucide-react';
import Link from 'next/link';

export default function WorkersListPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [employmentType, setEmploymentType] = useState('FULL_TIME');
  const [dailyWage, setDailyWage] = useState('');

  const { data: workersData, isLoading } = useQuery({
    queryKey: ['workersList', page, search, departmentId, status],
    queryFn: () =>
      workerService.listWorkers({
        page,
        limit: 20,
        search: search || undefined,
        departmentId: departmentId || undefined,
        status: status || undefined,
      }),
  });

  const { data: departmentsData } = useQuery({
    queryKey: ['departmentsList'],
    queryFn: () => workerService.getDepartments(),
  });

  const createWorkerMutation = useMutation({
    mutationFn: (input: any) => workerService.createWorker(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workersList'] });
      queryClient.invalidateQueries({ queryKey: ['productionDashboardStats'] });
      setIsAddOpen(false);
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      toast.success('Worker added successfully!');
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to add worker'),
  });

  const workers = Array.isArray((workersData as any)?.data)
    ? (workersData as any).data
    : (workersData as any)?.workers || [];
  const departments = Array.isArray((departmentsData as any)?.data)
    ? (departmentsData as any).data
    : (departmentsData as any) || [];
  const pagination = (workersData as any)?.pagination;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createWorkerMutation.mutate({
      firstName,
      lastName,
      phone: phone || undefined,
      email: email || undefined,
      departmentId: selectedDept || undefined,
      employmentType: employmentType as any,
      dailyWage: dailyWage ? Number(dailyWage) : undefined,
    });
  };

  return (
    <AppShell>
      <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Workers Directory</h2>
              <p className="text-sm text-muted-foreground">
                Manage factory workers, skills, departments, wages, and active production status.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/workers/departments">
                <Button variant="outline" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>Departments</span>
                </Button>
              </Link>
              <Button onClick={() => setIsAddOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" />
                <span>Add Worker</span>
              </Button>
            </div>
          </div>

          {/* Add Worker Dialog Modal */}
          {isAddOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
                <h3 className="text-lg font-bold text-foreground">Add New Worker</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">First Name *</label>
                      <Input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Ravi"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Last Name *</label>
                      <Input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Kumar"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Phone Number</label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 9876543210"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Email</label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="worker@company.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Department</label>
                      <select
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">No Department</option>
                        {departments.map((d: any) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Employment Type</label>
                      <select
                        value={employmentType}
                        onChange={(e) => setEmploymentType(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="FULL_TIME">Full Time</option>
                        <option value="PART_TIME">Part Time</option>
                        <option value="CONTRACT">Contract</option>
                        <option value="DAILY_WAGE">Daily Wage</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Daily Wage (₹)</label>
                    <Input
                      type="number"
                      value={dailyWage}
                      onChange={(e) => setDailyWage(e.target.value)}
                      placeholder="800"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createWorkerMutation.isPending}>
                      {createWorkerMutation.isPending ? 'Saving...' : 'Save Worker'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap gap-4 items-center justify-between bg-card/30 border border-border p-4 rounded-2xl">
            <div className="relative w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search worker name, code, phone..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value);
                  setPage(1);
                }}
                className="h-10 px-3 rounded-lg border border-input bg-background text-xs font-semibold"
              >
                <option value="">All Departments</option>
                {departments.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="h-10 px-3 rounded-lg border border-input bg-background text-xs font-semibold"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>
          </div>

          {/* Workers Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Employment</TableHead>
                  <TableHead>Phone / Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span>Loading workers...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : workers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No workers found. Click "Add Worker" to register a new employee.
                    </TableCell>
                  </TableRow>
                ) : (
                  workers.map((worker: any) => (
                    <TableRow key={worker.id}>
                      <TableCell className="font-semibold text-foreground">
                        {worker.firstName} {worker.lastName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {worker.employeeCode}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {worker.department ? (
                          <span className="text-xs font-medium text-muted-foreground">
                            {worker.department.name}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                          {worker.employmentType.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground space-y-0.5">
                        {worker.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {worker.phone}</div>}
                        {worker.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {worker.email}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            worker.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : worker.status === 'ON_LEAVE'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }
                        >
                          {worker.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/workers/${worker.id}`}>
                          <Button variant="outline" size="sm" className="gap-1.5">
                            <Eye className="h-3.5 w-3.5" />
                            <span>View Profile</span>
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
      </div>
    </AppShell>
  );
}
