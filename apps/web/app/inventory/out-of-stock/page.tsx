'use client';

import React, { useState } from 'react';
import { Navbar } from '../../../components/layout/Navbar';
import { Sidebar } from '../../../components/layout/Sidebar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../../../services/inventoryService';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { Input } from '../../../components/ui/Input';
import { Flame, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { stockAdjustmentSchema } from '@furniture-os/shared';

export default function OutOfStockPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<any>(null);
  const [adjustSuccessMsg, setAdjustSuccessMsg] = useState('');
  const [adjustErrorMsg, setAdjustErrorMsg] = useState('');

  // Query Out of Stock Products
  const { data: prodData, isLoading } = useQuery({
    queryKey: ['products-out-of-stock', page],
    queryFn: () => inventoryService.getOutOfStock(page, 20),
  });

  const products = (prodData as any)?.data || [];
  const pagination = (prodData as any)?.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 };

  // Adjust Form Setup
  const {
    register,
    handleSubmit,
    reset,
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

  // Adjust Mutation
  const adjustMutation = useMutation({
    mutationFn: (payload: any) => inventoryService.adjustStock(payload),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['products-out-of-stock'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      setAdjustSuccessMsg(`Stock added successfully! New Quantity: ${(res.updatedInventory as any).currentQuantity}`);
      setTimeout(() => {
        setIsAdjustOpen(false);
        setAdjustSuccessMsg('');
        reset();
      }, 2000);
    },
    onError: (err: any) => {
      setAdjustErrorMsg(err.message || 'Failed to update stock.');
    },
  });

  const handleOpenAdjust = (product: any) => {
    setAdjustProduct(product);
    setAdjustErrorMsg('');
    setAdjustSuccessMsg('');
    reset({
      productId: product.id,
      type: 'IN',
      quantity: 10,
      reason: 'Physical stock correction',
      notes: 'Initial restock for out of stock item',
    });
    setIsAdjustOpen(true);
  };

  const onAdjustSubmit = (formData: any) => {
    adjustMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Flame className="h-8 w-8 text-red-500" /> Out of Stock Items
            </h1>
            <p className="text-sm text-muted-foreground">
              These items are currently at zero or negative stock. Action is required.
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-10 bg-card rounded-lg" />
              <div className="h-20 bg-card rounded-lg" />
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-emerald-500/20 bg-emerald-500/5 p-16 text-center animate-in zoom-in-95">
              <Check className="mx-auto h-12 w-12 text-emerald-500" />
              <h3 className="mt-4 text-sm font-semibold text-foreground">Perfect! No items are out of stock.</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                All cataloged items have active warehouse stock levels.
              </p>
              <Link href="/inventory/products">
                <Button className="mt-4" size="sm" variant="outline">
                  Browse products
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-border bg-card/30 overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="w-40 text-center">Status</TableHead>
                      <TableHead className="text-right">Current Stock</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product: any) => (
                      <TableRow key={product.id} className="hover:bg-muted/20">
                        <TableCell className="font-semibold text-foreground">
                          <Link href={`/inventory/products/${product.id}`} className="hover:underline">
                            {product.name}
                          </Link>
                        </TableCell>
                        <TableCell className="font-mono text-xs uppercase">{product.sku}</TableCell>
                        <TableCell>{product.category?.name || 'N/A'}</TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20 uppercase tracking-wide">
                            OUT OF STOCK
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-red-500 font-mono">
                          {product.currentStock}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{product.unit?.shortCode}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenAdjust(product)}
                            className="h-8 border-red-500/30 text-red-500 hover:bg-red-500/10"
                          >
                            Restock
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <span className="text-xs text-muted-foreground">
                    Showing {(page - 1) * 20 + 1} - {Math.min(page * 20, pagination.total)} of {pagination.total} products
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1} className="border-border/80">
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    <span className="text-xs font-semibold">
                      Page {page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
                      disabled={page === pagination.totalPages}
                      className="border-border/80"
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Quick Adjustment dialog modal */}
          <Dialog
            isOpen={isAdjustOpen}
            onClose={() => setIsAdjustOpen(false)}
            title={`Restock — ${adjustProduct?.name}`}
            description="Perform a manual restock to bring the item back into inventory availability."
          >
            {adjustSuccessMsg ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center animate-in fade-in">
                <p className="text-sm text-emerald-500 font-semibold">{adjustSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onAdjustSubmit)} className="space-y-4">
                {adjustErrorMsg && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-500 font-medium">
                    {adjustErrorMsg}
                  </div>
                )}

                <div className="rounded-xl bg-secondary/30 p-3 text-xs border border-border/40">
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">SKU:</span>
                    <span className="font-mono text-foreground font-semibold">{adjustProduct?.sku}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current quantity:</span>
                    <span className="font-semibold text-red-500 font-mono">
                      {adjustProduct?.currentStock} {adjustProduct?.unit?.shortCode}
                    </span>
                  </div>
                </div>

                {/* Operation Mode */}
                <input type="hidden" {...register('type')} value="IN" />

                {/* Quantity */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quantity to Add</label>
                  <Input
                    type="number"
                    step="any"
                    {...register('quantity', { valueAsNumber: true })}
                    className="bg-background border-border/80 font-semibold"
                  />
                  {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity.message}</p>}
                </div>

                {/* Reason */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reason</label>
                  <select
                    {...register('reason')}
                    className="w-full h-10 text-sm rounded-lg border border-border bg-background px-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/80"
                  >
                    <option value="Physical stock correction">Physical stock correction</option>
                    <option value="Stock received from supplier">Stock received from supplier</option>
                  </select>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes (Optional)</label>
                  <textarea
                    {...register('notes')}
                    rows={2}
                    className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/80"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsAdjustOpen(false)} className="border-border/85">
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="bg-primary text-primary-foreground" disabled={adjustMutation.isPending}>
                    {adjustMutation.isPending ? 'Processing...' : 'Restock Item'}
                  </Button>
                </div>
              </form>
            )}
          </Dialog>
        </main>
      </div>
    </div>
  );
}
