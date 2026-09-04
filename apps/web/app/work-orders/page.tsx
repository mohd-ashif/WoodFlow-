'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { workOrderService } from '../../services/workOrderService';
import { AppShell } from '../../components/layout/AppShell';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Hammer, Search, Plus, Loader2, Eye, Calendar, UserCheck } from 'lucide-react';
import Link from 'next/link';

import { useDebounce } from '../../hooks/useDebounce';
import { useWorkOrders } from '../../hooks/useWorkOrders';

export default function WorkOrdersListPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);

  const { data: woData, isLoading } = useWorkOrders({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: status || undefined,
    priority: priority || undefined,
  });

  const workOrders = Array.isArray((woData as any)?.data)
    ? (woData as any).data
    : (woData as any)?.workOrders || [];
  const pagination = (woData as any)?.pagination;

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Work Orders Directory</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                View all manufacturing jobs, custom furniture specifications, progress, and material status.
              </p>
            </div>
            <Link href="/work-orders/new" className="self-start sm:self-auto">
              <Button className="gap-2 shadow-lg shadow-primary/20 text-xs sm:text-sm">
                <Plus className="h-4 w-4" />
                <span>Create Work Order</span>
              </Button>
            </Link>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card/30 border border-border p-3 sm:p-4 rounded-xl sm:rounded-2xl">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search WO number, title..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 text-xs h-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="h-9 px-3 rounded-lg border border-input bg-background text-xs font-semibold flex-1 md:flex-none"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PLANNED">Planned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="QUALITY_CHECK">Quality Check</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <select
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  setPage(1);
                }}
                className="h-10 px-3 rounded-lg border border-input bg-background text-xs font-semibold"
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* Work Orders Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Work Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Progress</TableHead>
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
                        <span>Loading work orders...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : workOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No work orders found. Create a new work order to start production planning.
                    </TableCell>
                  </TableRow>
                ) : (
                  workOrders.map((wo: any) => (
                    <TableRow key={wo.id}>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="font-semibold text-foreground flex items-center gap-2">
                            <span>{wo.title}</span>
                            <Badge variant="outline" className="font-mono text-[10px]">
                              {wo.workOrderNumber}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate max-w-xs">
                            {wo.items?.map((i: any) => i.productNameSnapshot || i.customProductName).join(', ')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {wo.customer ? (
                          <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <UserCheck className="h-3.5 w-3.5 text-primary" />
                            <span>{wo.customer.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">Internal Order</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            wo.priority === 'URGENT' || wo.priority === 'HIGH'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-secondary text-muted-foreground'
                          }
                        >
                          {wo.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {wo.dueDate ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{new Date(wo.dueDate).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          'No due date'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="w-24 space-y-1">
                          <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                            <span>{wo.progressPercentage ?? 0}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-300"
                              style={{ width: `${wo.progressPercentage ?? 0}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            wo.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : wo.status === 'IN_PROGRESS'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : wo.status === 'QUALITY_CHECK'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              : 'bg-secondary text-muted-foreground'
                          }
                        >
                          {wo.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/work-orders/${wo.id}`}>
                          <Button variant="outline" size="sm" className="gap-1.5">
                            <Eye className="h-3.5 w-3.5" />
                            <span>Open Job</span>
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
    </AppShell>
  );
}
