'use client';

import React from 'react';
import { Navbar } from '../../../components/layout/Navbar';
import { Sidebar } from '../../../components/layout/Sidebar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../../../services/inventoryService';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { stockAdjustmentSchema } from '@furniture-os/shared';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ManualAdjustmentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Query products list for select dropdown
  const { data: prodData, isLoading: isProdLoading } = useQuery({
    queryKey: ['products-list-adjust'],
    queryFn: () => inventoryService.getProducts({ limit: 1000 }), // Fetch large list for selection
  });

  const products = (prodData as any)?.data || [];

  // Form Setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      productId: '',
      type: 'IN' as const,
      quantity: 1,
      reason: 'Physical stock correction',
      notes: '',
    },
  });

  const selectedProductId = watch('productId');
  const selectedProduct = products.find((p: any) => p.id === selectedProductId);

  // Adjust Mutation
  const adjustMutation = useMutation({
    mutationFn: (payload: any) => inventoryService.adjustStock(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      router.push('/inventory/movements');
    },
  });

  const onSubmit = (formData: any) => {
    adjustMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/inventory">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-border/80">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Adjust Warehouse Stock</h1>
                <p className="text-sm text-muted-foreground">Perform manual addition or removal of inventory items.</p>
              </div>
            </div>
          </div>

          <Card className="border-border/80 max-w-2xl bg-card/40">
            <CardHeader>
              <CardTitle className="text-lg">Stock Adjustment Form</CardTitle>
              <CardDescription>Adjustments create a permanent stock movement record for auditing.</CardDescription>
            </CardHeader>
            <CardContent>
              {adjustMutation.isError && (
                <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <p className="text-xs text-destructive font-medium">
                    {(adjustMutation.error as any).message || 'Failed to update stock. Verify available quantities.'}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Select Product */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Product</label>
                  <select
                    {...register('productId')}
                    className="w-full h-10 text-sm rounded-lg border border-border bg-background px-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/80"
                    disabled={isProdLoading}
                  >
                    <option value="">Select Item...</option>
                    {products.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                  {errors.productId && <p className="text-xs text-red-500 mt-1">{errors.productId.message}</p>}
                </div>

                {selectedProduct && (
                  <div className="rounded-xl bg-secondary/30 p-3 text-xs border border-border/40 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Quantity:</span>
                      <span className="font-semibold text-foreground font-mono">
                        {selectedProduct.currentStock} {selectedProduct.unit?.shortCode}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Minimum Threshold Level:</span>
                      <span className="font-mono text-muted-foreground">
                        {selectedProduct.minimumStock} {selectedProduct.unit?.shortCode}
                      </span>
                    </div>
                  </div>
                )}

                {/* Operation Mode */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Adjustment Type</label>
                  <select
                    {...register('type')}
                    className="w-full h-10 text-sm rounded-lg border border-border bg-background px-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/80"
                  >
                    <option value="IN">Add Stock (+)</option>
                    <option value="OUT">Remove/Subtract Stock (-)</option>
                  </select>
                </div>

                {/* Quantity */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quantity</label>
                  <Input
                    type="number"
                    step="any"
                    {...register('quantity', { valueAsNumber: true })}
                    placeholder="e.g. 5"
                    className="bg-background border-border/80 font-mono"
                  />
                  {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity.message}</p>}
                </div>

                {/* Reason */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Adjustment Reason</label>
                  <select
                    {...register('reason')}
                    className="w-full h-10 text-sm rounded-lg border border-border bg-background px-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/80"
                  >
                    <option value="Physical stock correction">Physical stock correction</option>
                    <option value="Stock received from supplier">Stock received from supplier</option>
                    <option value="Damage">Damage</option>
                    <option value="Lost">Lost</option>
                    <option value="Initial Import">Initial Import</option>
                  </select>
                  {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason.message}</p>}
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes (Optional)</label>
                  <textarea
                    {...register('notes')}
                    placeholder="Provide additional details about why the adjustment is being recorded..."
                    rows={3}
                    className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/80"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
                  <Link href="/inventory">
                    <Button type="button" variant="outline" className="border-border/85">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" className="bg-primary gap-2" disabled={adjustMutation.isPending}>
                    <Save className="h-4 w-4" />
                    {adjustMutation.isPending ? 'Processing...' : 'Apply Adjustment'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
