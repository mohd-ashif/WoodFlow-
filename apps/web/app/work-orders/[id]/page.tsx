'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workOrderService } from '../../../services/workOrderService';
import { workerService } from '../../../services/workerService';
import { inventoryService } from '../../../services/inventoryService';
import { AppShell } from '../../../components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useToast } from '../../../components/ui/Toast';
import { Hammer, Plus, CheckCircle2, Clock, AlertTriangle, ShieldCheck, ArrowLeft, Loader2, UserCheck, Package } from 'lucide-react';
import Link from 'next/link';

export default function WorkOrderDetailPage({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const woId = params.id;

  // Task Form State
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskStage, setTaskStage] = useState('CARPENTRY');

  // Assign Worker State
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');

  // Material Issue State
  const [isMaterialOpen, setIsMaterialOpen] = useState(false);
  const [materialProductId, setMaterialProductId] = useState('');
  const [materialQty, setMaterialQty] = useState('1');

  // Quality Check State
  const [isQualityOpen, setIsQualityOpen] = useState(false);
  const [qualityNotes, setQualityNotes] = useState('');

  const { data: woData, isLoading } = useQuery({
    queryKey: ['workOrderDetail', woId],
    queryFn: () => workOrderService.getWorkOrder(woId),
  });

  const { data: workersData } = useQuery({
    queryKey: ['workersListSelect'],
    queryFn: () => workerService.listWorkers(),
  });

  const { data: productsData } = useQuery({
    queryKey: ['productsListSelect'],
    queryFn: () => inventoryService.getProducts(),
  });

  const wo: any = (woData as any)?.data || woData;
  const workers = workersData?.workers || [];
  const products = Array.isArray(productsData) ? productsData : (productsData as any)?.data?.products || (productsData as any)?.data || [];

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: string) => workOrderService.updateWorkOrderStatus(woId, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrderDetail', woId] });
      queryClient.invalidateQueries({ queryKey: ['workOrdersList'] });
      queryClient.invalidateQueries({ queryKey: ['productionDashboardStats'] });
      toast.success('Work Order status updated!');
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update status'),
  });

  const addTaskMutation = useMutation({
    mutationFn: (input: any) => workOrderService.createProductionTask(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrderDetail', woId] });
      setIsTaskOpen(false);
      setTaskTitle('');
      toast.success('Production Task created!');
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to create task'),
  });

  const assignWorkerMutation = useMutation({
    mutationFn: ({ taskId, workerId }: { taskId: string; workerId: string }) =>
      workOrderService.assignWorkersToTask(taskId, { workerIds: [workerId] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrderDetail', woId] });
      setActiveTaskId(null);
      setSelectedWorkerId('');
      toast.success('Worker assigned to task!');
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to assign worker'),
  });

  const issueMaterialMutation = useMutation({
    mutationFn: (input: any) => workOrderService.issueMaterial(woId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrderDetail', woId] });
      queryClient.invalidateQueries({ queryKey: ['productsListSelect'] });
      setIsMaterialOpen(false);
      setMaterialQty('1');
      toast.success('Raw material issued from inventory!');
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to issue material'),
  });

  const qualityCheckMutation = useMutation({
    mutationFn: (status: 'PASSED' | 'FAILED') =>
      workOrderService.performQualityCheck(woId, { status, notes: qualityNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrderDetail', woId] });
      setIsQualityOpen(false);
      toast.success('Quality check recorded!');
    },
    onError: (err: any) => toast.error(err?.message || 'Quality check failed'),
  });

  const completeWoMutation = useMutation({
    mutationFn: () => workOrderService.completeWorkOrder(woId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrderDetail', woId] });
      queryClient.invalidateQueries({ queryKey: ['workOrdersList'] });
      queryClient.invalidateQueries({ queryKey: ['productionDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['productsListSelect'] });
      toast.success('Work Order completed! Finished goods added to stock.');
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to complete Work Order'),
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: any }) =>
      workOrderService.updateTaskStatus(taskId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrderDetail', woId] });
      toast.success('Task status updated!');
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update task status'),
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Loading Work Order Details...</span>
        </div>
      </AppShell>
    );
  }

  if (!wo) {
    return (
      <AppShell>
        <div className="py-24 text-center text-muted-foreground">Work Order not found.</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Link href="/work-orders">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Work Orders</span>
              </Button>
            </Link>
          </div>

          {/* Header Card */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-card/40 border border-border p-6 rounded-2xl">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-foreground">{wo.title}</h2>
                <Badge variant="outline" className="font-mono text-xs">
                  {wo.workOrderNumber}
                </Badge>
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
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {wo.customer ? `Customer: ${wo.customer.name}` : 'Internal Production'} • Due Date:{' '}
                {wo.dueDate ? new Date(wo.dueDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>

            {/* Workflow Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {wo.status === 'DRAFT' && (
                <Button size="sm" onClick={() => updateStatusMutation.mutate('PLANNED')}>
                  Plan Work Order
                </Button>
              )}
              {wo.status === 'PLANNED' && (
                <Button size="sm" onClick={() => updateStatusMutation.mutate('IN_PROGRESS')}>
                  Start Production
                </Button>
              )}
              {wo.status === 'IN_PROGRESS' && (
                <Button size="sm" onClick={() => setIsQualityOpen(true)} className="gap-1.5 bg-purple-600 hover:bg-purple-700">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Quality Check</span>
                </Button>
              )}
              {wo.status === 'QUALITY_CHECK' && (
                <Button
                  size="sm"
                  onClick={() => completeWoMutation.mutate()}
                  disabled={completeWoMutation.isPending}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Complete & Output Finished Goods</span>
                </Button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>Overall Production Completion</span>
              <span className="text-primary">{wo.progressPercentage}%</span>
            </div>
            <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${wo.progressPercentage}%` }}
              />
            </div>
          </Card>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Products & Tasks */}
            <div className="lg:col-span-2 space-y-6">
              {/* Products Item Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <span>Furniture Products</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {wo.items?.map((item: any) => (
                    <div key={item.id} className="p-3 bg-secondary/20 rounded-xl border border-border/60 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-foreground">{item.productNameSnapshot || item.customProductName}</div>
                        {item.dimensions && <div className="text-muted-foreground text-[11px]">Dimensions: {item.dimensions}</div>}
                      </div>
                      <Badge variant="outline">Qty: {item.quantity}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Tasks Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Hammer className="h-4 w-4 text-primary" />
                    <span>Production Tasks ({wo.tasks?.length || 0})</span>
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setIsTaskOpen(true)} className="gap-1.5">
                    <Plus className="h-4 w-4" />
                    <span>Add Task</span>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isTaskOpen && (
                    <div className="p-4 bg-card border border-border rounded-xl space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="Task Title (e.g. Wood Cutting)"
                          value={taskTitle}
                          onChange={(e: any) => setTaskTitle(e.target.value)}
                        />
                        <select
                          value={taskStage}
                          onChange={(e: any) => setTaskStage(e.target.value)}
                          className="h-10 px-3 rounded-lg border border-input text-xs font-semibold bg-background"
                        >
                          <option value="MATERIAL_PREPARATION">Material Preparation</option>
                          <option value="CUTTING">Cutting</option>
                          <option value="CARPENTRY">Carpentry</option>
                          <option value="ASSEMBLY">Assembly</option>
                          <option value="SANDING">Sanding</option>
                          <option value="PAINTING">Painting</option>
                          <option value="POLISHING">Polishing</option>
                          <option value="UPHOLSTERY">Upholstery</option>
                        </select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setIsTaskOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => addTaskMutation.mutate({ workOrderId: woId, title: taskTitle, stage: taskStage })}
                        >
                          Save Task
                        </Button>
                      </div>
                    </div>
                  )}

                  {(!wo.tasks || wo.tasks.length === 0) ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No tasks created yet.</p>
                  ) : (
                    wo.tasks.map((t: any) => (
                      <div key={t.id} className="p-3 bg-secondary/20 rounded-xl border border-border/60 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="font-semibold text-foreground flex items-center gap-2">
                            <span>{t.title}</span>
                            <Badge variant="outline" className="text-[10px]">{t.stage}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={t.status}
                              onChange={(e) => updateTaskStatusMutation.mutate({ taskId: t.id, status: e.target.value })}
                              className="h-7 px-2 text-[11px] font-semibold rounded border border-input bg-background"
                            >
                              <option value="TODO">TODO</option>
                              <option value="IN_PROGRESS">IN PROGRESS</option>
                              <option value="BLOCKED">BLOCKED</option>
                              <option value="COMPLETED">COMPLETED</option>
                            </select>
                          </div>
                        </div>

                        {/* Workers assigned to this task */}
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                          <div className="flex items-center gap-1">
                            <UserCheck className="h-3.5 w-3.5 text-primary" />
                            <span>
                              Assigned:{' '}
                              {t.assignments?.map((a: any) => `${a.worker?.firstName} ${a.worker?.lastName}`).join(', ') ||
                                'None'}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[11px]"
                            onClick={() => setActiveTaskId(t.id)}
                          >
                            + Assign
                          </Button>
                        </div>

                        {activeTaskId === t.id && (
                          <div className="flex items-center gap-2 pt-2">
                            <select
                              value={selectedWorkerId}
                              onChange={(e) => setSelectedWorkerId(e.target.value)}
                              className="h-8 px-2 text-xs rounded border border-input bg-background flex-1"
                            >
                              <option value="">Select Worker...</option>
                              {workers.map((w: any) => (
                                <option key={w.id} value={w.id}>
                                  {w.firstName} {w.lastName} ({w.employeeCode})
                                </option>
                              ))}
                            </select>
                            <Button
                              size="sm"
                              onClick={() => assignWorkerMutation.mutate({ taskId: t.id, workerId: selectedWorkerId })}
                              disabled={!selectedWorkerId}
                            >
                              Assign
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Col: Materials & Quality Checks */}
            <div className="space-y-6">
              {/* Materials Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-bold">Materials ({wo.materials?.length || 0})</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setIsMaterialOpen(true)}>
                    + Issue
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isMaterialOpen && (
                    <div className="p-3 bg-card border border-border rounded-xl space-y-3 text-xs">
                      <div>
                        <label className="font-semibold text-muted-foreground">Select Material/Product</label>
                        <select
                          value={materialProductId}
                          onChange={(e) => setMaterialProductId(e.target.value)}
                          className="w-full h-9 px-2 rounded border border-input bg-background mt-1"
                        >
                          <option value="">Choose Material...</option>
                          {products.map((p: any) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Stock: {p.currentStock})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="font-semibold text-muted-foreground">Quantity to Issue</label>
                        <Input
                          type="number"
                          value={materialQty}
                          onChange={(e: any) => setMaterialQty(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setIsMaterialOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            issueMaterialMutation.mutate({
                              productId: materialProductId,
                              quantity: Number(materialQty),
                            })
                          }
                          disabled={!materialProductId}
                        >
                          Issue Stock
                        </Button>
                      </div>
                    </div>
                  )}

                  {(!wo.materials || wo.materials.length === 0) ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No materials issued yet.</p>
                  ) : (
                    wo.materials.map((m: any) => (
                      <div key={m.id} className="p-3 bg-secondary/20 rounded-xl border border-border/60 text-xs space-y-1">
                        <div className="font-semibold text-foreground flex items-center justify-between">
                          <span>{m.product?.name}</span>
                          <Badge variant="outline">Issued: {m.issuedQuantity}</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Quality Checks Log */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-bold">Quality Checks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isQualityOpen && (
                    <div className="p-3 bg-card border border-border rounded-xl space-y-3 text-xs">
                      <p className="font-semibold text-foreground">Perform Quality Inspection</p>
                      <Input
                        placeholder="Notes or issues found..."
                        value={qualityNotes}
                        onChange={(e: any) => setQualityNotes(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 flex-1" onClick={() => qualityCheckMutation.mutate('PASSED')}>
                          Pass Inspection
                        </Button>
                        <Button size="sm" variant="destructive" className="flex-1" onClick={() => qualityCheckMutation.mutate('FAILED')}>
                          Fail Inspection
                        </Button>
                      </div>
                    </div>
                  )}

                  {(!wo.qualityChecks || wo.qualityChecks.length === 0) ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No quality checks recorded.</p>
                  ) : (
                    wo.qualityChecks.map((qc: any) => (
                      <div key={qc.id} className="p-3 bg-secondary/20 rounded-xl border border-border/60 text-xs space-y-1">
                        <div className="flex items-center justify-between font-semibold">
                          <span>Inspection</span>
                          <Badge className={qc.status === 'PASSED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}>
                            {qc.status}
                          </Badge>
                        </div>
                        {qc.notes && <p className="text-[11px] text-muted-foreground">{qc.notes}</p>}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
      </div>
    </AppShell>
  );
}
