'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '../../../components/layout/AppShell';
import { analyticsService } from '../../../services/analyticsService';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Hammer, Users, CheckCircle2, Clock } from 'lucide-react';

export default function ProductionReportPage() {
  const { data: prodRes, isLoading } = useQuery({
    queryKey: ['production-report'],
    queryFn: async () => {
      return analyticsService.getProductionReports();
    },
  });

  const report = prodRes?.data || prodRes;
  const summary = report?.summary;
  const workerStats = report?.workerStats || [];
  const workOrdersList = report?.workOrdersList || [];

  return (
    <AppShell title="Production & Worker Performance Reports">
      <div className="space-y-6 pb-12">
        <div className="border-b border-border/60 pb-5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Hammer className="h-6 w-6 text-primary" />
            Production & Worker Performance Reports
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Work order execution metrics, manufacturing output rates, and fair worker assignment analytics.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-xs text-muted-foreground uppercase font-semibold">Total Work Orders</div>
              <div className="text-2xl font-bold text-foreground mt-1">{summary?.totalOrders || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Factory Production Orders</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-xs text-muted-foreground uppercase font-semibold">Completed Orders</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{summary?.completedOrders || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Finished Furniture</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-xs text-muted-foreground uppercase font-semibold">In Progress</div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{summary?.inProgressOrders || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Active Workshops</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-xs text-muted-foreground uppercase font-semibold">Completion Rate</div>
              <div className="text-2xl font-bold text-primary mt-1">{summary?.completionRate || 0}%</div>
              <div className="text-xs text-muted-foreground mt-1">Production Efficiency</div>
            </CardContent>
          </Card>
        </div>

        {/* Worker Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Worker Task Assignment & Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            {workerStats.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">No worker activity recorded.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Assigned Tasks</TableHead>
                    <TableHead className="text-right">Completed Tasks</TableHead>
                    <TableHead className="text-right">Completion Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workerStats.map((w: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-semibold text-foreground">{w.workerName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{w.department}</TableCell>
                      <TableCell className="text-right font-bold">{w.assignedTasks}</TableCell>
                      <TableCell className="text-right text-emerald-600 dark:text-emerald-400 font-bold">{w.completedTasks}</TableCell>
                      <TableCell className="text-right font-bold text-primary">{w.completionRate}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
