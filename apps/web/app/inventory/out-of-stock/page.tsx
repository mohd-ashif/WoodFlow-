'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../../../services/inventoryService';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { Input } from '../../../components/ui/Input';
import { Flame, Check } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { stockAdjustmentSchema } from '@furniture-os/shared';
import { AppShell } from '../../../components/layout/AppShell';
import { TableCard, TableCardBody, TableCardFooter } from '../../../components/ui/TableCard';
import { DataTablePagination } from '@/components/ui/DataTablePagination';
import { PageHeader } from '../../../components/ui/PageHeader';

import { useOutOfStock } from '../../../hooks/useInventory';

export default function OutOfStockPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<any>(null);
  const [adjustSuccessMsg, setAdjustSuccessMsg] = useState('');
  const [adjustErrorMsg, setAdjustErrorMsg] = useState('');

  // Query Out of Stock Products via custom hook (uses keepPreviousData)
  const { data: prodData, isLoading } = useOutOfStock(page, limit);

  const products = (prodData as any)?.data || [];
  const pagination = (prodData as any)?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 };

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

  // State lifecycle reset when adjust dialog closes
  React.useEffect(() => {
    if (!isAdjustOpen) {
      setAdjustProduct(null);
      setAdjustSuccessMsg('');
      setAdjustErrorMsg('');
      reset({
        productId: '',
        type: 'IN',
        quantity: 1,
        reason: 'Physical stock correction',
        notes: '',
      });
    }
  }, [isAdjustOpen, reset]);

  const onAdjustSubmit = (formData: any) => {
    adjustMutation.mutate(formData);
  };

  return (
    <AppShell>
      <PageHeader
        icon={Flame}
        title="Out of Stock Alerts"
        description="Items currently at zero balance requiring immediate inventory replenishment."
      />

      <TableCard>
        {isLoading ? (
          <TableCardBody className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-card/60 animate-pulse rounded-lg border border-border/40" />
            ))}
          </TableCardBody>
        ) : products.length === 0 ? (
          <TableCardBody className="flex items-center justify-center p-16">
            <div className="text-center">
              <Check className="mx-auto h-12 w-12 text-emerald-500" />
              <h3 className="mt-4 text-sm font-semibold text-foreground">Zero out of stock products!</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                All cataloged items have stock quantities available for orders.
              </p>
              <Link href="/inventory/products">
                <Button className="mt-4" size="sm" variant="outline">
                  Browse products
                </Button>
              </Link>
            </div>
          </TableCardBody>
        ) : (
          <>
            <TableCardBody>
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-secondary/95 backdrop-blur-md">
                  <TableRow className="bg-muted/30">
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="text-right">Stock Level</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Target Min</TableHead>
                    <TableHead className="hidden sm:table-cell">Unit</TableHead>
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
                      <TableCell className="hidden md:table-cell">{product.category?.name || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="danger" className="font-mono text-[11px]">0</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground hidden sm:table-cell">
                        {product.minimumStock}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">{product.unit?.shortCode}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAdjust(product)}
                          className="h-8 border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                        >
                          Restock Now
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableCardBody>

            <TableCardFooter>
              <DataTablePagination
                currentPage={page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={(l) => {
                  setLimit(l);
                  setPage(1);
                }}
                itemLabel="out of stock items"
              />
            </TableCardFooter>
          </>
        )}
      </TableCard>

      {/* Adjust Dialog */}
      <Dialog
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        title={`Restock Product — ${adjustProduct?.name}`}
      >
        {adjustSuccessMsg ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold">
            {adjustSuccessMsg}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onAdjustSubmit)} className="space-y-4">
            {adjustErrorMsg && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg font-medium">
                {adjustErrorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Restock Quantity</label>
              <Input
                type="number"
                step="any"
                {...register('quantity', { valueAsNumber: true })}
                className="bg-background border-border/80 font-semibold text-xs"
              />
              {errors.quantity && <p className="text-xs text-destructive mt-1">{errors.quantity.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reason</label>
              <select
                {...register('reason')}
                className="w-full h-9 text-xs rounded-lg border border-border bg-background px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Physical stock correction">Physical stock correction</option>
                <option value="Stock received from supplier">Stock received from supplier</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes (Optional)</label>
              <textarea
                {...register('notes')}
                rows={2}
                className="w-full text-xs rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAdjustOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={adjustMutation.isPending}>
                {adjustMutation.isPending ? 'Processing...' : 'Restock Item'}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </AppShell>
  );
}
