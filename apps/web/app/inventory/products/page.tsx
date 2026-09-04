'use client';

import React, { useState, useCallback } from 'react';
import { Navbar } from '../../../components/layout/Navbar';
import { Sidebar } from '../../../components/layout/Sidebar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../../../services/inventoryService';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Dialog } from '../../../components/ui/Dialog';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Tooltip } from '../../../components/ui/Tooltip';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import {
  Search, Plus, Filter, ArrowUpDown, ChevronLeft, ChevronRight,
  Eye, Edit2, ShieldAlert, ShieldCheck, SlidersHorizontal,
  Package, PackageSearch,
} from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { stockAdjustmentSchema } from '@furniture-os/shared';
import toast from '@/components/ui/Toast';
import { ImportButton } from '../../../components/import/ImportButton';


// ─── Skeleton Row ──────────────────────────────────────────────────────────────
function ProductSkeletonRow() {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-muted/50 animate-pulse flex-shrink-0" />
          <div className="h-4 w-36 rounded bg-muted/50 animate-pulse" />
        </div>
      </TableCell>
      <TableCell><div className="h-4 w-24 rounded bg-muted/50 animate-pulse" /></TableCell>
      <TableCell><div className="h-4 w-20 rounded bg-muted/50 animate-pulse" /></TableCell>
      <TableCell><div className="h-4 w-20 rounded bg-muted/50 animate-pulse" /></TableCell>
      <TableCell className="text-right"><div className="h-4 w-16 rounded bg-muted/50 animate-pulse ml-auto" /></TableCell>
      <TableCell className="text-right"><div className="h-4 w-20 rounded bg-muted/50 animate-pulse ml-auto" /></TableCell>
      <TableCell><div className="h-5 w-20 rounded-full bg-muted/50 animate-pulse" /></TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-2">
          <div className="h-8 w-8 rounded-md bg-muted/50 animate-pulse" />
          <div className="h-8 w-8 rounded-md bg-muted/50 animate-pulse" />
          <div className="h-8 w-20 rounded-md bg-muted/50 animate-pulse" />
          <div className="h-8 w-8 rounded-md bg-muted/50 animate-pulse" />
        </div>
      </TableCell>
    </TableRow>
  );
}

import { DataTablePagination } from '@/components/ui/DataTablePagination';

import { useDebounce } from '../../../hooks/useDebounce';
import { useProducts, useCategories } from '../../../hooks/useProducts';

export default function ProductsListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [categoryId, setCategoryId] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Quick Adjust Dialog
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<any>(null);

  // Toggle Active Confirm
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<any>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  // Query Products via custom hook (uses placeholderData: keepPreviousData for smooth pagination)
  const { data: prodData, isLoading } = useProducts({
    search: debouncedSearch,
    filterType: filterType as any,
    categoryId,
    sortBy: sortBy as any,
    sortOrder,
    page,
    limit,
  });

  const products = (prodData as any)?.data || [];
  const pagination = (prodData as any)?.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 };

  // Query Categories via custom hook
  const { data: catData } = useCategories();
  const categories = catData?.categories || [];

  // ─── Mutations ────────────────────────────────────────────────────────────
  const deactivateMutation = useMutation({
    mutationFn: (id: string) => inventoryService.deactivateProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      setConfirmOpen(false);
      setConfirmTarget(null);
      toast.success('Product deactivated successfully');
    },
    onError: (err: any) => {
      setConfirmOpen(false);
      toast.error(err.message || 'Failed to deactivate product.');
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => inventoryService.activateProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      toast.success('Product reactivated successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to reactivate product.');
    },
  });

  // Quick Adjust Form
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
      reason: '',
      notes: '',
    },
  });

  const adjustMutation = useMutation({
    mutationFn: (payload: any) => inventoryService.adjustStock(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      setIsAdjustOpen(false);
      reset();
      toast.success(
        `Stock updated. New quantity: ${(res.updatedInventory as any).currentQuantity}`
      );
    },
    onError: (err: any) => {
      toast.error(err.message || 'Unable to update stock. Please try again.');
    },
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleOpenAdjust = useCallback(
    (product: any) => {
      setAdjustProduct(product);
      reset({
        productId: product.id,
        type: 'IN',
        quantity: 1,
        reason: 'Physical stock correction',
        notes: '',
      });
      setIsAdjustOpen(true);
    },
    [reset]
  );

  const handleCloseAdjust = useCallback(() => {
    if (adjustMutation.isPending) return;
    setIsAdjustOpen(false);
    setAdjustProduct(null);
    reset();
  }, [adjustMutation.isPending, reset]);

  const onAdjustSubmit = useCallback(
    (formData: any) => {
      adjustMutation.mutate(formData);
    },
    [adjustMutation]
  );

  const handleDeactivateClick = useCallback((product: any) => {
    setConfirmTarget(product);
    setConfirmOpen(true);
  }, []);

  const handleConfirmDeactivate = useCallback(() => {
    if (confirmTarget) deactivateMutation.mutate(confirmTarget.id);
  }, [confirmTarget, deactivateMutation]);

  const handleReactivate = useCallback(
    (product: any) => {
      activateMutation.mutate(product.id);
    },
    [activateMutation]
  );

  const handleSort = useCallback(
    (field: string) => {
      setSortBy((prev) => {
        if (prev === field) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
        else setSortOrder('asc');
        return field;
      });
      setPage(1);
    },
    []
  );

  const getStockStatusBadge = useCallback((product: any) => {
    if (!product.isActive) return <Badge variant="danger">Inactive</Badge>;
    if (product.currentStock <= 0) return <Badge variant="danger">Out of Stock</Badge>;
    if (product.currentStock <= product.minimumStock) return <Badge variant="warning">Low Stock</Badge>;
    return <Badge variant="success">In Stock</Badge>;
  }, []);

  const FILTER_TABS = [
    { label: 'All', val: 'ALL' },
    { label: 'Furniture', val: 'FINISHED_PRODUCT' },
    { label: 'Raw Materials', val: 'RAW_MATERIAL' },
    { label: 'Low Stock', val: 'LOW_STOCK' },
    { label: 'Out of Stock', val: 'OUT_OF_STOCK' },
    { label: 'Inactive', val: 'INACTIVE' },
  ];

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col p-6 space-y-4 overflow-hidden min-w-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Products Database
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                View and manage cataloged furniture items and raw materials.
              </p>
            </div>
            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <ImportButton
                module="PRODUCTS"
                moduleTitle="Products"
                onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ['products'] })}
              />
              <Link href="/inventory/products/new">
                <Button size="sm" className="gap-2 text-xs">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add Product
                </Button>
              </Link>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-card/40 border border-border p-3.5 rounded-xl space-y-3 flex-shrink-0">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
                <Input
                  placeholder="Search by name, SKU…"
                  value={search}
                  onChange={handleSearchChange}
                  className="pl-9 bg-background/50 border-border/80 text-xs h-9"
                  aria-label="Search products"
                />
              </div>
              <select
                value={categoryId}
                onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
                className="h-9 text-xs rounded-lg border border-border bg-background px-3 text-foreground focus:outline-none"
                aria-label="Filter by category"
              >
                <option value="">All Categories</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
              <span className="text-xs text-muted-foreground font-medium mr-1 flex items-center gap-1">
                <Filter className="h-3 w-3" aria-hidden="true" />
                Filter:
              </span>
              {FILTER_TABS.map((t) => (
                <button
                  key={t.val}
                  onClick={() => { setFilterType(t.val); setPage(1); }}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    filterType === t.val
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-secondary/40 text-muted-foreground border-border/60 hover:text-foreground hover:bg-secondary'
                  }`}
                  aria-pressed={filterType === t.val}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="rounded-xl border border-border bg-card/30 overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Stock Qty</TableHead>
                    <TableHead className="text-right">Selling Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 8 }).map((_, i) => <ProductSkeletonRow key={i} />)}
                </TableBody>
              </Table>
            </div>
          ) : products.length === 0 ? (
            // Empty State
            <div className="rounded-2xl border border-dashed border-border/60 bg-card/20 p-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/60">
                <PackageSearch className="h-8 w-8 text-muted-foreground/70" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No products found</h3>
              <p className="mt-1.5 text-sm text-muted-foreground max-w-xs mx-auto">
                {debouncedSearch || filterType !== 'ALL' || categoryId
                  ? 'No products match your current filters. Try adjusting your search or filters.'
                  : 'Start building your product catalog by adding your first product.'}
              </p>
              {!debouncedSearch && filterType === 'ALL' && !categoryId && (
                <Link href="/inventory/products/new">
                  <Button className="mt-6 gap-2">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add First Product
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 rounded-xl border border-border bg-card/30 overflow-hidden shadow-sm">
              <div className="flex-1 overflow-auto min-h-0">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-secondary/95 backdrop-blur-md shadow-sm">
                    <TableRow className="bg-muted/30">
                      <TableHead
                        className="cursor-pointer hover:bg-muted/40 transition-colors select-none"
                        onClick={() => handleSort('name')}
                      >
                        <span className="flex items-center gap-1.5">
                          Product <ArrowUpDown className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                        </span>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/40 transition-colors select-none"
                        onClick={() => handleSort('sku')}
                      >
                        <span className="flex items-center gap-1.5">
                          SKU <ArrowUpDown className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                        </span>
                      </TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/40 transition-colors select-none text-right"
                        onClick={() => handleSort('currentStock')}
                      >
                        <span className="flex items-center justify-end gap-1.5">
                          Stock Qty <ArrowUpDown className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                        </span>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/40 transition-colors select-none text-right"
                        onClick={() => handleSort('sellingPrice')}
                      >
                        <span className="flex items-center justify-end gap-1.5">
                          Price <ArrowUpDown className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                        </span>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product: any) => (
                      <TableRow key={product.id} className="hover:bg-muted/20 transition-colors group">
                        {/* Product Name + Image thumbnail */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.imageUrl}
                                alt=""
                                aria-hidden="true"
                                className="h-9 w-9 rounded-md object-cover border border-border/40 flex-shrink-0 bg-muted/30"
                                loading="lazy"
                              />
                            ) : (
                              <div className="h-9 w-9 rounded-md bg-secondary/60 border border-border/30 flex items-center justify-center flex-shrink-0">
                                <Package className="h-4 w-4 text-muted-foreground/50" aria-hidden="true" />
                              </div>
                            )}
                            <span className="font-semibold text-foreground leading-tight">
                              {product.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="font-mono text-xs bg-secondary/60 px-2 py-0.5 rounded border border-border/40 text-muted-foreground uppercase">
                            {product.sku}
                          </code>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {product.productType === 'FINISHED_PRODUCT' ? 'Finished' : 'Raw Material'}
                        </TableCell>
                        <TableCell className="text-sm">{product.category?.name || 'N/A'}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {product.currentStock}{' '}
                          <span className="text-xs font-normal text-muted-foreground">{product.unit?.shortCode}</span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm tabular-nums">
                          ₹{product.sellingPrice.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell>{getStockStatusBadge(product)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View */}
                            <Tooltip content="View details">
                              <Link href={`/inventory/products/${product.id}`}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`View ${product.name}`}
                                  className="hover:bg-primary/20 hover:text-primary transition-colors"
                                >
                                  <Eye className="h-4 w-4" aria-hidden="true" />
                                </Button>
                              </Link>
                            </Tooltip>

                            {/* Edit */}
                            <Tooltip content="Edit product">
                              <Link href={`/inventory/products/${product.id}/edit`}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Edit ${product.name}`}
                                  className="hover:bg-primary/20 hover:text-primary transition-colors"
                                >
                                  <Edit2 className="h-4 w-4" aria-hidden="true" />
                                </Button>
                              </Link>
                            </Tooltip>

                            {/* Adjust Stock */}
                            {product.isActive && (
                              <Tooltip content="Adjust stock">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenAdjust(product)}
                                  aria-label={`Adjust stock for ${product.name}`}
                                  className="h-8 px-2.5 text-xs hover:bg-primary/20 hover:text-primary transition-colors"
                                >
                                  <SlidersHorizontal className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                                  Adjust
                                </Button>
                              </Tooltip>
                            )}

                            {/* Deactivate / Reactivate */}
                            {product.isActive ? (
                              <Tooltip content="Deactivate product">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeactivateClick(product)}
                                  aria-label={`Deactivate ${product.name}`}
                                  className="text-destructive hover:bg-destructive/15 transition-colors"
                                  isLoading={deactivateMutation.isPending && confirmTarget?.id === product.id}
                                >
                                  <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                                </Button>
                              </Tooltip>
                            ) : (
                              <Tooltip content="Reactivate product">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleReactivate(product)}
                                  aria-label={`Reactivate ${product.name}`}
                                  className="text-emerald-500 hover:bg-emerald-500/15 transition-colors"
                                  isLoading={activateMutation.isPending}
                                >
                                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                                </Button>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Always Visible Fixed Bottom Pagination */}
              <div className="flex-shrink-0 border-t border-border/60">
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
                  itemLabel="products"
                />
              </div>
            </div>
          )}

          {/* ─── Quick Stock Adjustment Dialog ─────────────────────────────────── */}
          <Dialog
            isOpen={isAdjustOpen}
            onClose={handleCloseAdjust}
            loading={adjustMutation.isPending}
            title={`Adjust Stock — ${adjustProduct?.name}`}
            description="Perform a manual addition or subtraction of items in storage."
          >
            <form onSubmit={handleSubmit(onAdjustSubmit)} className="space-y-4" noValidate>
              {/* Product info panel */}
              <div className="rounded-xl bg-secondary/30 p-3 text-xs border border-border/40 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SKU</span>
                  <code className="font-mono text-foreground font-semibold">{adjustProduct?.sku}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Stock</span>
                  <span className="font-semibold text-foreground">
                    {adjustProduct?.currentStock} {adjustProduct?.unit?.shortCode}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="adj-type" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Operation
                </label>
                <select
                  id="adj-type"
                  {...register('type')}
                  className="w-full h-10 text-sm rounded-lg border border-border bg-background px-3 text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="IN">Add Stock (+)</option>
                  <option value="OUT">Remove Stock (−)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="adj-qty" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Quantity
                </label>
                <Input
                  id="adj-qty"
                  type="number"
                  step="any"
                  {...register('quantity', { valueAsNumber: true })}
                  placeholder="e.g. 5"
                  className="bg-background border-border/80"
                />
                {errors.quantity && (
                  <p role="alert" className="text-xs text-destructive">{errors.quantity.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="adj-reason" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Reason
                </label>
                <select
                  id="adj-reason"
                  {...register('reason')}
                  className="w-full h-10 text-sm rounded-lg border border-border bg-background px-3 text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="Physical stock correction">Physical stock correction</option>
                  <option value="Initial Opening Stock">Initial Opening Stock</option>
                  <option value="Damage">Damage</option>
                  <option value="Lost">Lost</option>
                  <option value="Initial Import">Initial Import</option>
                </select>
                {errors.reason && (
                  <p role="alert" className="text-xs text-destructive">{errors.reason.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="adj-notes" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Notes <span className="text-muted-foreground/60 normal-case font-normal">(Optional)</span>
                </label>
                <textarea
                  id="adj-notes"
                  {...register('notes')}
                  placeholder="e.g. Items found in storage room C"
                  rows={2}
                  className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCloseAdjust}
                  disabled={adjustMutation.isPending}
                  className="border-border/85"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={adjustMutation.isPending}
                  isLoading={adjustMutation.isPending}
                  className="min-w-[120px]"
                >
                  {adjustMutation.isPending ? 'Processing…' : 'Save Adjustment'}
                </Button>
              </div>
            </form>
          </Dialog>

          {/* Deactivate Confirm */}
          <ConfirmDialog
            isOpen={confirmOpen}
            onClose={() => { setConfirmOpen(false); setConfirmTarget(null); }}
            onConfirm={handleConfirmDeactivate}
            title="Deactivate Product?"
            description={`"${confirmTarget?.name}" will be hidden from active inventory. Stock data and history will be preserved.`}
            confirmLabel="Deactivate"
            confirmingLabel="Deactivating…"
            isLoading={deactivateMutation.isPending}
          />
        </main>
      </div>
    </div>
  );
}
