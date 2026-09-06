'use client';

import React, { useState, useCallback } from 'react';
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
import { ProductImage } from '../../../components/ui/ProductImage';
import { PageHeader } from '../../../components/ui/PageHeader';
import { SearchInput } from '../../../components/ui/SearchInput';
import { AppIcon } from '../../../components/ui/AppIcon';


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

import { AppShell } from '../../../components/layout/AppShell';
import { TableCard, TableCardBody, TableCardFooter } from '../../../components/ui/TableCard';

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

  // State lifecycle reset when stock adjustment dialog closes
  React.useEffect(() => {
    if (!isAdjustOpen) {
      setAdjustProduct(null);
      reset({
        productId: '',
        type: 'IN',
        quantity: 1,
        reason: '',
        notes: '',
      });
    }
  }, [isAdjustOpen, reset]);

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
    <AppShell>
      {/* Header */}
      <PageHeader
        icon={Package}
        title="Products Database"
        description="View and manage cataloged furniture items and raw materials."
        actions={
          <>
            <ImportButton
              module="PRODUCTS"
              moduleTitle="Products"
              onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ['products'] })}
            />
            <Link href="/inventory/products/new">
              <Button size="md" className="gap-2">
                <AppIcon icon={Plus} size="sm" />
                Add Product
              </Button>
            </Link>
          </>
        }
      />

      {/* Search & Filters */}
      <div className="bg-card/40 border border-border p-3 sm:p-3.5 rounded-xl space-y-3 flex-shrink-0 min-w-0">
        <div className="flex flex-col md:flex-row md:items-center gap-2.5 sm:gap-3">
          <SearchInput
            placeholder="Search by name, SKU…"
            value={search}
            onChange={(val) => { setSearch(val); setPage(1); }}
            onClear={() => { setSearch(''); setPage(1); }}
            wrapperClassName="flex-1 max-w-md"
            aria-label="Search products"
          />
          <select
            value={categoryId}
            onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
            className="h-9 text-xs rounded-lg border border-border bg-background px-3 text-foreground focus:outline-none w-full md:w-auto"
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap min-w-0 pt-2 border-t border-border/50">
          <span className="text-xs text-muted-foreground font-medium shrink-0 mr-1 flex items-center gap-1">
            <AppIcon icon={Filter} size="xs" />
            Filter:
          </span>
          {FILTER_TABS.map((t) => (
            <button
              key={t.val}
              onClick={() => { setFilterType(t.val); setPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
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

      {/* Table Card */}
      <TableCard>
        {isLoading ? (
          <TableCardBody>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead className="text-right">Stock Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Status</TableHead>
                    <TableHead className="min-w-[140px] text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 8 }).map((_, i) => <ProductSkeletonRow key={i} />)}
              </TableBody>
            </Table>
          </TableCardBody>
        ) : products.length === 0 ? (
          <TableCardBody className="flex items-center justify-center p-6 sm:p-12 min-h-[220px]">
            <div className="text-center max-w-sm mx-auto">
              <div className="mx-auto mb-3 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-secondary/60 text-muted-foreground">
                <PackageSearch className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-foreground">No products found</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {debouncedSearch || filterType !== 'ALL' || categoryId
                  ? 'No products match your current filters. Try adjusting search or category.'
                  : 'Start building your product catalog by adding your first product.'}
              </p>
              {!debouncedSearch && filterType === 'ALL' && !categoryId && (
                <Link href="/inventory/products/new">
                  <Button size="sm" className="mt-3.5 gap-2 text-xs">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add First Product
                  </Button>
                </Link>
              )}
            </div>
          </TableCardBody>
        ) : (
          <>
            <TableCardBody>
              {/* ─── 1. MOBILE CARD VIEW (screens < 768px) ─────────────────── */}
              <div className="block md:hidden space-y-3 p-3">
                {products.map((product: any) => (
                  <div
                    key={product.id}
                    className="rounded-xl border border-border/80 bg-card/60 p-3.5 space-y-3 shadow-xs transition-colors hover:border-primary/40"
                  >
                    {/* Top Row: Image + Name + Category + Status */}
                    <div className="flex items-start gap-3">
                      <ProductImage
                        src={product.imageUrl}
                        alt={product.name}
                        variant="thumbnail"
                        className="h-11 w-11 shrink-0 rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-sm text-foreground leading-tight truncate">
                            {product.name}
                          </h3>
                          <div className="shrink-0">{getStockStatusBadge(product)}</div>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <code className="font-mono text-[11px] bg-secondary/60 px-1.5 py-0.5 rounded border border-border/40 text-muted-foreground uppercase">
                            {product.sku}
                          </code>
                          <span>•</span>
                          <span className="truncate">{product.category?.name || 'Uncategorized'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle Row: Stock & Price Key-Value */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-xs">
                      <div className="bg-secondary/30 rounded-lg p-2 flex flex-col">
                        <span className="text-[11px] text-muted-foreground">Stock Level</span>
                        <span className="font-semibold text-foreground text-xs mt-0.5 tabular-nums">
                          {product.currentStock} {product.unit?.shortCode || 'units'}
                        </span>
                      </div>
                      <div className="bg-secondary/30 rounded-lg p-2 flex flex-col text-right">
                        <span className="text-[11px] text-muted-foreground">Selling Price</span>
                        <span className="font-bold text-foreground text-xs mt-0.5 font-mono tabular-nums">
                          ₹{product.sellingPrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Mobile Action Buttons */}
                    <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-border/40">
                      {product.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAdjust(product)}
                          className="h-9 px-2.5 text-xs flex-1 gap-1 text-primary hover:bg-primary/10"
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                          <span>+ Stock</span>
                        </Button>
                      )}

                      <Link href={`/inventory/products/${product.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="h-9 px-2.5 text-xs w-full gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          <span>View</span>
                        </Button>
                      </Link>

                      <Link href={`/inventory/products/${product.id}/edit`} className="flex-1">
                        <Button variant="outline" size="sm" className="h-9 px-2.5 text-xs w-full gap-1">
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </Button>
                      </Link>

                      {product.isActive ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeactivateClick(product)}
                          className="h-9 w-9 min-w-[36px] text-destructive hover:bg-destructive/15"
                          isLoading={deactivateMutation.isPending && confirmTarget?.id === product.id}
                          aria-label="Deactivate product"
                        >
                          <ShieldAlert className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleReactivate(product)}
                          className="h-9 w-9 min-w-[36px] text-emerald-500 hover:bg-emerald-500/15"
                          isLoading={activateMutation.isPending}
                          aria-label="Reactivate product"
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* ─── 2. DESKTOP TABLE VIEW (screens ≥ 768px) ─────────────────── */}
              <div className="hidden md:block">
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
                      <TableHead className="hidden md:table-cell">Type</TableHead>
                      <TableHead className="hidden sm:table-cell">Category</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/40 transition-colors select-none text-right"
                        onClick={() => handleSort('currentStock')}
                      >
                        <span className="flex items-center justify-end gap-1.5">
                          Stock <ArrowUpDown className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
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
                      <TableHead className="min-w-[140px] text-right pr-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product: any) => (
                      <TableRow key={product.id} className="hover:bg-muted/20 transition-colors group">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <ProductImage
                              src={product.imageUrl}
                              alt={product.name}
                              variant="thumbnail"
                              className="h-9 w-9 flex-shrink-0"
                            />
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
                        <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                          {product.productType === 'FINISHED_PRODUCT' ? 'Finished' : 'Raw Material'}
                        </TableCell>
                        <TableCell className="text-sm hidden sm:table-cell">{product.category?.name || 'N/A'}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {product.currentStock}{' '}
                          <span className="text-xs font-normal text-muted-foreground">{product.unit?.shortCode}</span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm tabular-nums">
                          ₹{product.sellingPrice.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell>{getStockStatusBadge(product)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                            <Tooltip content="View details">
                              <Link href={`/inventory/products/${product.id}`}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`View ${product.name}`}
                                  className="h-8 w-8 hover:bg-primary/20 hover:text-primary transition-colors"
                                >
                                  <Eye className="h-4 w-4" aria-hidden="true" />
                                </Button>
                              </Link>
                            </Tooltip>

                            <Tooltip content="Edit product">
                              <Link href={`/inventory/products/${product.id}/edit`}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Edit ${product.name}`}
                                  className="h-8 w-8 hover:bg-primary/20 hover:text-primary transition-colors"
                                >
                                  <Edit2 className="h-4 w-4" aria-hidden="true" />
                                </Button>
                              </Link>
                            </Tooltip>

                            {product.isActive && (
                              <Tooltip content="Adjust stock">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenAdjust(product)}
                                  aria-label={`Adjust stock for ${product.name}`}
                                  className="h-8 px-2 text-xs hover:bg-primary/20 hover:text-primary transition-colors"
                                >
                                  <SlidersHorizontal className="h-3.5 w-3.5 sm:mr-1" aria-hidden="true" />
                                  <span className="hidden sm:inline">Adjust</span>
                                </Button>
                              </Tooltip>
                            )}

                            {product.isActive ? (
                              <Tooltip content="Deactivate product">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeactivateClick(product)}
                                  aria-label={`Deactivate ${product.name}`}
                                  className="h-8 w-8 text-destructive hover:bg-destructive/15 transition-colors"
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
                                  className="h-8 w-8 text-emerald-500 hover:bg-emerald-500/15 transition-colors"
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
                itemLabel="products"
              />
            </TableCardFooter>
          </>
        )}
      </TableCard>

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
    </AppShell>
  );
}
