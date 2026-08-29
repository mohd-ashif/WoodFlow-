'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { workOrderService } from '../../services/workOrderService';
import { AppShell } from '../../components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Hammer, Clock, AlertTriangle, CheckCircle2, Users, FileCheck, Plus, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ProductionDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['productionDashboardStats'],
    queryFn: () => workOrderService.getDashboardStats(),
  });

  const stats = data?.data;

  const statCards = [
    { title: 'Total Jobs', value: stats?.totalWorkOrders ?? 0, icon: Hammer, color: 'text-sky-400', bg: 'bg-sky-500/10' },
    { title: 'In Progress', value: stats?.inProgressWorkOrders ?? 0, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { title: 'Quality Check', value: stats?.qualityCheckWorkOrders ?? 0, icon: FileCheck, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { title: 'Completed', value: stats?.completedWorkOrders ?? 0, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { title: 'Overdue Jobs', value: stats?.overdueWorkOrders ?? 0, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { title: 'Active Workers', value: stats?.activeWorkersToday ?? 0, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  ];

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Furniture Production Overview</h2>
            <p className="text-sm text-muted-foreground">
              Track active manufacturing jobs, worker allocations, material consumption, and quality control.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/work-orders/new">
              <Button className="gap-2 shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" />
                <span>New Work Order</span>
              </Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>Fetching Production Metrics...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.title} className="hover:border-primary/50 transition-all">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                      {card.title}
                    </CardTitle>
                    <div className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold tracking-tight text-foreground">{card.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Quick Nav Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          <Card className="hover:border-primary/50 transition-all">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center justify-between">
                <span>Work Orders</span>
                <Hammer className="h-5 w-5 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                View and manage all custom and standard furniture production work orders.
              </p>
              <Link href="/work-orders">
                <Button variant="outline" className="w-full gap-2 justify-between">
                  <span>View Work Orders</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-all">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center justify-between">
                <span>Workers Directory</span>
                <Users className="h-5 w-5 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Manage carpenters, painters, polishers, upholsterers, and floor staff.
              </p>
              <Link href="/workers">
                <Button variant="outline" className="w-full gap-2 justify-between">
                  <span>View Workers</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-all">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center justify-between">
                <span>Worker Dashboard</span>
                <Clock className="h-5 w-5 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Mobile-friendly task dashboard for floor workers to update progress and complete jobs.
              </p>
              <Link href="/my-work">
                <Button variant="outline" className="w-full gap-2 justify-between">
                  <span>Open My Work View</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
