'use client';

import React, { useState } from 'react';
import { Navbar } from '../../../components/layout/Navbar';
import { Sidebar } from '../../../components/layout/Sidebar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../../../services/inventoryService';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Dialog } from '../../../components/ui/Dialog';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Search, Plus, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Edit, Eye, ShieldAlert, SlidersHorizontal, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { stockAdjustmentSchema } from '@furniture-os/shared';

export default function ProductsListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [categoryId, setCategoryId] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Quick Adjustment Dialog State
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<any>(null);
  const [adjustSuccessMsg, setAdjustSuccessMsg] = useState('');
  const [adjustErrorMsg, setAdjustErrorMsg] = useState('');

  // Debouncing search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on search
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Query Products
  const { data: prodData, isLoading, refetch } = useQuery({
    queryKey: ['products', debouncedSearch, filterType, categoryId, sortBy, sortOrder, page, limit],
    queryFn: () =>
      inventoryService.getProducts({
        search: debouncedSearch,
        filterType,
        categoryId,
        sortBy,
        sortOrder,
        page,
        limit,
      }),
  });

  const products = (prodData as any)?.data || [];
  const pagination = (prodData as any)?.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 };

  // Query Categories
  const { data: catData } = useQuery({
    queryKey: ['categories-active-filter'],
    queryFn: () => inventoryService.getCategories({ isActive: true }),
  });
  const categories = catData?.categories || [];

  // Deactivate Mutation
  const deactivateMutation = useMutation({
    mutationFn: (id: string) => inventoryService.deactivateProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
    },
  });

  // Activate Mutation
  const activateMutation = useMutation({
    mutationFn: (id: string) => inventoryService.activateProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
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

  // Adjust Mutation
  const adjustMutation = useMutation({
    mutationFn: (payload: any) => inventoryService.adjustStock(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      setAdjustSuccessMsg(`Stock updated successfully. New quantity: ${(res.updatedInventory as any).currentQuantity}`);
      setTimeout(() => {
        setIsAdjustOpen(false);
        setAdjustSuccessMsg('');
        reset();
      }, 2000);
    },
    onError: (err: any) => {
      setAdjustErrorMsg(err.message || 'Unable to update stock. Please try again.');
    },
  });

  const handleOpenAdjust = (product: any) => {
    setAdjustProduct(product);
    setAdjustErrorMsg('');
    setAdjustSuccessMsg('');
    reset({
      productId: product.id,
      type: 'IN',
      quantity: 1,
      reason: 'Physical stock correction',
      notes: '',
    });
    setIsAdjustOpen(true);
  };

  const onAdjustSubmit = (formData: any) => {
    setAdjustErrorMsg('');
    setAdjustSuccessMsg('');
    adjustMutation.mutate(formData);
  };

  const handleToggleActive = (product: any) => {
    if (product.isActive) {
      if (confirm(`Are you sure you want to deactivate product "${product.name}"?`)) {
        deactivateMutation.mutate(product.id);
      }
    } else {
      activateMutation.mutate(product.id);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
    }
    setPage(1);
  };

  const getStockStatusBadge = (product: any) => {
    if (!product.isActive) {
      return <Badge variant="danger">Inactive</Badge>;
    }
    if (product.currentStock <= 0) {
      return <Badge variant="danger">Out of Stock</Badge>;
    }
    if (product.currentStock <= product.minimumStock) {
      return <Badge variant="warning">Low Stock</Badge>;
    }
    return <Badge variant="success">In Stock</Badge>;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Products Database</h1>
              <p className="text-sm text-muted-foreground">View and manage cataloged furniture items and raw materials.</p>
            </div>
            <Link href="/inventory/products/new">
              <Button className="gap-2 bg-primary">
                <Plus className="h-4 w-4" /> Add Product
              </Button>
            </Link>
          </div>

          {/* Search, Filters, and Options panel */}
          <div className="bg-card/40 border border-border p-4 rounded-xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-background/50 border-border/80"
                />
              </div>

              {/* Category Filter */}
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setPage(1);
                }}
                className="h-10 text-sm rounded-lg border border-border bg-background px-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/80"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              {/* Page size limit */}
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(parseInt(e.target.value));
                  setPage(1);
                }}
                className="h-10 text-sm rounded-lg border border-border bg-background px-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/80"
              >
                <option value={20}>20 products / page</option>
                <option value={50}>50 products / page</option>
                <option value={100}>100 products / page</option>
              </select>
            </div>

            {/* Filter tags buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50 text-xs">
              <span className="text-muted-foreground font-medium mr-2">Quick Filters:</span>
              {[
                { label: 'All', val: 'ALL' },
                { label: 'Finished Furniture', val: 'FINISHED_PRODUCT' },
                { label: 'Raw Materials', val: 'RAW_MATERIAL' },
                { label: 'Low Stock', val: 'LOW_STOCK' },
                { label: 'Out of Stock', val: 'OUT_OF_STOCK' },
                { label: 'Inactive Catalog', val: 'INACTIVE' },
              ].map((t) => (
                <button
                  key={t.val}
                  onClick={() => {
                    setFilterType(t.val);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-full border transition-colors ${
                    filterType === t.val
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-secondary/40 text-muted-foreground border-border/60 hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table display */}
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-10 bg-card rounded-lg" />
              <div className="h-20 bg-card rounded-lg" />
              <div className="h-20 bg-card rounded-lg" />
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/85 p-16 text-center">
              <Plus className="mx-auto h-12 w-12 text-muted-foreground/60" />
              <h3 className="mt-4 text-sm font-semibold text-foreground">No products found</h3>
              <p className="mt-1 text-xs text-muted-foreground">Adjust filters or search parameters, or create a new cataloged SKU.</p>
              <Link href="/inventory/products/new">
                <Button className="mt-4 bg-primary text-xs" size="sm">
                  + Add Product
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-border bg-card/30 overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="cursor-pointer hover:bg-muted/40" onClick={() => handleSort('name')}>
                        <span className="flex items-center gap-1.5">
                          Product <ArrowUpDown className="h-3 w-3" />
                        </span>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/40" onClick={() => handleSort('sku')}>
                        <span className="flex items-center gap-1.5">
                          SKU <ArrowUpDown className="h-3 w-3" />
                        </span>
                      </TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/40 text-right" onClick={() => handleSort('currentStock')}>
                        <span className="flex items-center justify-end gap-1.5">
                          Stock Quantity <ArrowUpDown className="h-3 w-3" />
                        </span>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/40 text-right" onClick={() => handleSort('sellingPrice')}>
                        <span className="flex items-center justify-end gap-1.5">
                          Selling Price <ArrowUpDown className="h-3 w-3" />
                        </span>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product: any) => (
                      <TableRow key={product.id} className="hover:bg-muted/20">
                        <TableCell>
                          <div className="font-semibold text-foreground">{product.name}</div>
                        </TableCell>
                        <TableCell className="font-mono text-xs uppercase tracking-tight">{product.sku}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {product.productType === 'FINISHED_PRODUCT' ? 'Finished Furniture' : 'Raw Material'}
                        </TableCell>
                        <TableCell className="text-sm">{product.category?.name || 'N/A'}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {product.currentStock} <span className="text-xs font-normal text-muted-foreground">{product.unit?.shortCode}</span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          ₹{product.sellingPrice.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell>{getStockStatusBadge(product)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/inventory/products/${product.id}`}>
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-border/80 hover:bg-secondary" title="View details">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                            <Link href={`/inventory/products/${product.id}/edit`}>
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-border/80 hover:bg-secondary" title="Edit details">
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                            {product.isActive && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenAdjust(product)}
                                className="h-8 px-2 text-xs border-border/80 hover:bg-primary/10 hover:text-primary"
                              >
                                Adjust Stock
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleActive(product)}
                              className={`h-8 w-8 p-0 border-border/80 text-red-500 hover:bg-red-500/10`}
                              title={product.isActive ? 'Deactivate Product' : 'Reactivate Product'}
                            >
                              <ShieldAlert className="h-3.5 w-3.5" />
                            </Button>
                          </div>
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
                    Showing {(page - 1) * limit + 1} - {Math.min(page * limit, pagination.total)} of {pagination.total} products
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
            title={`Adjust Stock — ${adjustProduct?.name}`}
            description="Perform a manual addition or subtraction of items in storage."
          >
            {adjustSuccessMsg ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
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
                    <span className="text-muted-foreground">Current Quantity in Warehouse:</span>
                    <span className="font-semibold text-foreground">
                      {adjustProduct?.currentStock} {adjustProduct?.unit?.shortCode}
                    </span>
                  </div>
                </div>

                {/* Adjustment Mode */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Operation Mode</label>
                  <select
                    {...register('type')}
                    className="w-full h-10 text-sm rounded-lg border border-border bg-background px-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/80"
                  >
                    <option value="IN">Add Stock (+)</option>
                    <option value="OUT">Remove Stock (-)</option>
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
                    className="bg-background border-border/80"
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
                    <option value="Initial Opening Stock">Initial Opening Stock</option>
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
                    placeholder="e.g. Items found in storage room C"
                    rows={2}
                    className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/80"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsAdjustOpen(false)} className="border-border/85">
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="bg-primary text-primary-foreground" disabled={adjustMutation.isPending}>
                    {adjustMutation.isPending ? 'Processing...' : 'Save adjustment'}
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
