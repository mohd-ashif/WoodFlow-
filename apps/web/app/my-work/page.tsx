'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { workOrderService } from '../../services/workOrderService';
import { AppShell } from '../../components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Hammer, Clock, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function MyWorkDashboardPage() {
  const { data: woData, isLoading } = useQuery({
    queryKey: ['myWorkOrdersList'],
    queryFn: () => workOrderService.listWorkOrders({ limit: 50 }),
  });

  const workOrders = Array.isArray((woData as any)?.data)
    ? (woData as any).data
    : (woData as any)?.workOrders || [];

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">My Work Today</h2>
            <p className="text-sm text-muted-foreground">
              Mobile task dashboard for floor workers to view assigned jobs, update task status, and log work.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Loading Assigned Work...</span>
            </div>
          ) : workOrders.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No active production jobs assigned today.
            </Card>
          ) : (
            <div className="space-y-4">
              {workOrders.map((wo: any) => (
                <Card key={wo.id} className="p-5 hover:border-primary/50 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground text-lg">{wo.title}</h3>
                        <Badge variant="outline" className="font-mono text-xs">
                          {wo.workOrderNumber}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {wo.customer ? `Customer: ${wo.customer.name}` : 'Internal Order'} • Due Date:{' '}
                        {wo.dueDate ? new Date(wo.dueDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>

                    <Badge
                      className={
                        wo.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : wo.status === 'IN_PROGRESS'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-secondary text-muted-foreground'
                      }
                    >
                      {wo.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  {/* Tasks List snippet */}
                  <div className="mt-4 pt-3 border-t border-border/60 space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Tasks ({wo.tasks?.length || 0})
                    </p>
                    <div className="space-y-2">
                      {wo.tasks?.map((task: any) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-2.5 bg-secondary/30 rounded-lg text-xs"
                        >
                          <span className="font-medium text-foreground">{task.title} ({task.stage})</span>
                          <Badge variant="outline" className="text-[10px]">
                            {task.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-2 flex justify-end">
                    <Link href={`/work-orders/${wo.id}`}>
                      <Button size="sm" className="gap-2">
                        <span>Open Task Details</span>
                        <Hammer className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
      </div>
    </AppShell>
  );
}
