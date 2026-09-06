'use client';

import React, { useState, useCallback, useId } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../../../services/inventoryService';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Tooltip } from '../../../components/ui/Tooltip';
import { Input } from '../../../components/ui/Input';
import { Search, Plus, Edit2, PowerOff, RotateCcw, FolderHeart, Tag } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCategorySchema } from '@furniture-os/shared';
import toast from '@/components/ui/Toast';
import { ImportButton } from '../../../components/import/ImportButton';
import { AppShell } from '../../../components/layout/AppShell';
import { TableCard, TableCardBody } from '../../../components/ui/TableCard';

// ─── Skeleton Row ──────────────────────────────────────────────────────────────
function CategorySkeletonRow() {
  return (
    <TableRow>
      <TableCell>
        <div className="h-4 w-32 rounded bg-muted/50 animate-pulse" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-48 rounded bg-muted/50 animate-pulse" />
      </TableCell>
      <TableCell>
        <div className="h-5 w-16 rounded-full bg-muted/50 animate-pulse" />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <div className="h-8 w-8 rounded-md bg-muted/50 animate-pulse" />
          <div className="h-8 w-8 rounded-md bg-muted/50 animate-pulse" />
        </div>
      </TableCell>
    </TableRow>
  );
}

// ─── Field Error ───────────────────────────────────────────────────────────────
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs font-medium text-destructive mt-1">
      {message}
    </p>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const formTitleId = useId();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<any>(null);

  // Debounce search — stable, no useEffect needed here
  const searchTimerRef = React.useRef<ReturnType<typeof setTimeout>>();
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(val), 400);
  }, []);

  // ─── Data Fetching ────────────────────────────────────────────────────────
  const { data: catData, isLoading } = useQuery({
    queryKey: ['categories', debouncedSearch],
    queryFn: () => inventoryService.getCategories({ search: debouncedSearch }),
  });
  const categories = catData?.categories || [];

  // ─── Form Setup ───────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createCategorySchema),
    defaultValues: { name: '', description: '' },
  });

  // ─── Mutations ────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (payload: any) => inventoryService.createCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsFormOpen(false);
      reset({ name: '', description: '' });
      toast.success('Category created successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create category.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      inventoryService.updateCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsFormOpen(false);
      setEditingCategory(null);
      reset({ name: '', description: '' });
      toast.success('Category updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update category.');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => inventoryService.deactivateCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setConfirmOpen(false);
      setConfirmTarget(null);
      toast.success('Category deactivated successfully');
    },
    onError: (err: any) => {
      setConfirmOpen(false);
      toast.error(err.message || 'Failed to deactivate category.');
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      inventoryService.updateCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category reactivated successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to reactivate category.');
    },
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleOpenCreate = useCallback(() => {
    setEditingCategory(null);
    reset({ name: '', description: '' });
    setIsFormOpen(true);
  }, [reset]);

  const handleOpenEdit = useCallback(
    (category: any) => {
      setEditingCategory(category);
      reset({ name: category.name, description: category.description || '' });
      setIsFormOpen(true);
    },
    [reset]
  );

  const handleCloseForm = useCallback(() => {
    if (createMutation.isPending || updateMutation.isPending) return;
    setIsFormOpen(false);
    setEditingCategory(null);
    reset({ name: '', description: '' });
  }, [createMutation.isPending, updateMutation.isPending, reset]);

  const handleDeactivateClick = useCallback((category: any) => {
    setConfirmTarget(category);
    setConfirmOpen(true);
  }, []);

  const handleConfirmDeactivate = useCallback(() => {
    if (confirmTarget) {
      deactivateMutation.mutate(confirmTarget.id);
    }
  }, [confirmTarget, deactivateMutation]);

  const handleReactivate = useCallback(
    (category: any) => {
      reactivateMutation.mutate({
        id: category.id,
        payload: { name: category.name, description: category.description || '', isActive: true },
      });
    },
    [reactivateMutation]
  );

  const onSubmit = useCallback(
    (formData: any) => {
      if (editingCategory) {
        updateMutation.mutate({ id: editingCategory.id, payload: formData });
      } else {
        createMutation.mutate(formData);
      }
    },
    [editingCategory, createMutation, updateMutation]
  );

  const isMutating = createMutation.isPending || updateMutation.isPending;
  const isEditMode = !!editingCategory;

  return (
    <AppShell>
      {/* ─── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 flex-shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FolderHeart className="h-6 w-6 text-primary flex-shrink-0" aria-hidden="true" />
            Product Categories
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Classify your items to organize catalogs and structure metrics.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <ImportButton
            module="CATEGORIES"
            moduleTitle="Categories"
            onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ['categories'] })}
          />
          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="gap-2 text-xs"
            id="create-category-btn"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Category
          </Button>
        </div>
      </div>

      {/* ─── Search Bar ──────────────────────────────────────────────────── */}
      <div className="bg-card/45 border border-border p-3 sm:p-3.5 rounded-xl flex-shrink-0 min-w-0">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
          <Input
            placeholder="Search categories…"
            value={search}
            onChange={handleSearchChange}
            className="pl-9 bg-background/50 border-border/85 text-xs h-9"
            aria-label="Search categories"
          />
        </div>
      </div>

      {/* ─── Table ───────────────────────────────────────────────────────── */}
      <TableCard>
        {isLoading ? (
          <TableCardBody>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Category Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <CategorySkeletonRow key={i} />
                ))}
              </TableBody>
            </Table>
          </TableCardBody>
        ) : categories.length === 0 ? (
          <TableCardBody className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/60">
                <Tag className="h-8 w-8 text-muted-foreground/70" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No categories yet</h3>
              <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">
                {debouncedSearch
                  ? 'No categories match your search. Try different keywords.'
                  : 'Create your first category to start organizing your product catalog.'}
              </p>
              {!debouncedSearch && (
                <Button onClick={handleOpenCreate} size="sm" className="mt-4 gap-2 text-xs">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Create First Category
                </Button>
              )}
            </div>
          </TableCardBody>
        ) : (
          <TableCardBody>
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-secondary/95 backdrop-blur-md">
                <TableRow className="bg-muted/40">
                  <TableHead>Category Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category: any) => (
                  <TableRow
                    key={category.id}
                    className="hover:bg-muted/20 transition-colors group"
                  >
                    <TableCell className="font-semibold text-foreground">
                      {category.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs max-w-xs">
                      {category.description || (
                        <span className="italic text-xs opacity-50">No description</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={category.isActive ? 'success' : 'danger'}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit */}
                        <Tooltip content="Edit category">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(category)}
                            aria-label={`Edit ${category.name}`}
                            className="h-8 w-8 p-0 hover:bg-secondary"
                          >
                            <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                        </Tooltip>

                        {/* Deactivate / Reactivate */}
                        {category.isActive ? (
                          <Tooltip content="Deactivate category">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeactivateClick(category)}
                              aria-label={`Deactivate ${category.name}`}
                              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              isLoading={deactivateMutation.isPending && confirmTarget?.id === category.id}
                            >
                              <PowerOff className="h-3.5 w-3.5" aria-hidden="true" />
                            </Button>
                          </Tooltip>
                        ) : (
                          <Tooltip content="Reactivate category">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReactivate(category)}
                              aria-label={`Reactivate ${category.name}`}
                              className="h-8 w-8 p-0 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400"
                              isLoading={reactivateMutation.isPending}
                            >
                              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                            </Button>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCardBody>
        )}
      </TableCard>

      {/* ─── Modal Form (Create / Edit Category) ──────────────────────────────── */}
      <Dialog
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        loading={isMutating}
        title={isEditMode ? 'Edit Category' : 'Create Category'}
        description={
          isEditMode
            ? 'Update category metadata.'
            : 'Add a new category to group related inventory items.'
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="cat-name" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Category Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="cat-name"
              {...register('name')}
              placeholder="e.g. Dining Chairs"
              aria-invalid={!!errors.name}
              disabled={isMutating}
            />
            <FieldError message={errors.name?.message as string} />
          </div>

          <div>
            <label htmlFor="cat-desc" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Description <span className="text-muted-foreground/60 normal-case font-normal">(Optional)</span>
            </label>
            <textarea
              id="cat-desc"
              {...register('description')}
              rows={3}
              placeholder="Brief summary of items in this category…"
              disabled={isMutating}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none disabled:opacity-50"
            />
            <FieldError message={errors.description?.message as string} />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseForm}
              disabled={isMutating}
              className="border-border/80"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isMutating}
              isLoading={isMutating}
              className="min-w-[120px]"
            >
              {isMutating
                ? isEditMode
                  ? 'Saving…'
                  : 'Creating…'
                : isEditMode
                ? 'Save Changes'
                : 'Create Category'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── Deactivate Confirm Dialog ────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setConfirmTarget(null); }}
        onConfirm={handleConfirmDeactivate}
        title="Deactivate Category?"
        description={`"${confirmTarget?.name}" will be hidden from product assignment. Existing products will retain their current category.`}
        confirmLabel="Deactivate"
        confirmingLabel="Deactivating…"
        isLoading={deactivateMutation.isPending}
      />
    </AppShell>
  );
}
