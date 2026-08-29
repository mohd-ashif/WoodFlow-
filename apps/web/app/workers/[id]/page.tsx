'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workerService } from '../../../services/workerService';
import { Navbar } from '../../../components/layout/Navbar';
import { Sidebar } from '../../../components/layout/Sidebar';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { User, Phone, Mail, MapPin, Calendar, DollarSign, Building2, Clock, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function WorkerDetailPage({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const workerId = params.id;
  const [attendanceStatus, setAttendanceStatus] = useState('PRESENT');

  const { data: workerData, isLoading } = useQuery({
    queryKey: ['workerDetail', workerId],
    queryFn: () => workerService.getWorker(workerId),
  });

  const attendanceMutation = useMutation({
    mutationFn: (input: any) => workerService.recordAttendance(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workerDetail', workerId] });
      queryClient.invalidateQueries({ queryKey: ['workersList'] });
      toast.success('Attendance recorded successfully!');
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to record attendance'),
  });

  const worker: any = (workerData as any)?.data || workerData;

  const handleMarkAttendance = () => {
    attendanceMutation.mutate({
      workerId,
      date: new Date().toISOString().split('T')[0],
      status: attendanceStatus as any,
    });
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

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Loading Worker Profile...</span>
            </div>
          ) : !worker ? (
            <div className="text-center py-12 text-muted-foreground">Worker not found.</div>
          ) : (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-card/40 border border-border p-6 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                    <User className="h-8 w-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-foreground">
                        {worker.firstName} {worker.lastName}
                      </h2>
                      <Badge variant="outline" className="font-mono text-xs">
                        {worker.employeeCode}
                      </Badge>
                      <Badge
                        className={
                          worker.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }
                      >
                        {worker.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {worker.department ? worker.department.name : 'No Department'} • {worker.employmentType}
                    </p>
                  </div>
                </div>

                {/* Mark Attendance Action */}
                <div className="flex items-center gap-3 bg-background p-3 rounded-xl border border-border">
                  <span className="text-xs font-semibold text-muted-foreground">Today's Attendance:</span>
                  <select
                    value={attendanceStatus}
                    onChange={(e) => setAttendanceStatus(e.target.value)}
                    className="h-8 px-2 rounded border border-input text-xs font-medium bg-card"
                  >
                    <option value="PRESENT">PRESENT</option>
                    <option value="ABSENT">ABSENT</option>
                    <option value="HALF_DAY">HALF DAY</option>
                    <option value="LEAVE">LEAVE</option>
                  </select>
                  <Button size="sm" onClick={handleMarkAttendance} disabled={attendanceMutation.isPending}>
                    {attendanceMutation.isPending ? 'Saving...' : 'Mark'}
                  </Button>
                </div>
              </div>

              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold">Contact & Employment Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 text-primary" />
                      <span>Phone: {worker.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4 text-primary" />
                      <span>Email: {worker.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>Address: {worker.address || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>Joining Date: {worker.joiningDate ? new Date(worker.joiningDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span>Daily Wage: ₹{worker.dailyWage ?? 0} / day</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold">Assigned Tasks ({worker.assignments?.length || 0})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(!worker.assignments || worker.assignments.length === 0) ? (
                      <p className="text-xs text-muted-foreground">No active production tasks assigned to this worker.</p>
                    ) : (
                      worker.assignments.map((asg: any) => (
                        <div key={asg.id} className="p-3 bg-secondary/30 rounded-xl border border-border/60 text-xs space-y-1">
                          <div className="font-semibold text-foreground flex items-center justify-between">
                            <span>{asg.task?.title}</span>
                            <Badge variant="outline">{asg.task?.status}</Badge>
                          </div>
                          <p className="text-muted-foreground text-[11px]">
                            Work Order #{asg.task?.workOrder?.workOrderNumber} — Stage: {asg.task?.stage}
                          </p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
