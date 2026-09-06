'use client';

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../../../services/inventoryService';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Tooltip } from '../../../components/ui/Tooltip';
import { Input } from '../../../components/ui/Input';
import { Search, Plus, Edit2, PowerOff, RotateCcw, Ruler, Hash } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUnitSchema } from '@furniture-os/shared';
import toast from '@/components/ui/Toast';
import { ImportButton } from '../../../components/import/ImportButton';
import { AppShell } from '../../../components/layout/AppShell';
import { TableCard, TableCardBody } from '../../../components/ui/TableCard';

function UnitSkeletonRow() {
  return (
    <TableRow>
      <TableCell><div className="h-4 w-28 rounded bg-muted/50 animate-pulse" /></TableCell>
      <TableCell><div className="h-4 w-16 rounded bg-muted/50 animate-pulse" /></TableCell>
      <TableCell><div className="h-5 w-16 rounded-full bg-muted/50 animate-pulse" /></TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <div className="h-8 w-8 rounded-md bg-muted/50 animate-pulse" />
          <div className="h-8 w-8 rounded-md bg-muted/50 animate-pulse" />
        </div>
      </TableCell>
    </TableRow>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p role="alert" className="text-xs font-medium text-destructive mt-1">{message}</p>;
}

export default function UnitsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<any>(null);

  const searchTimerRef = React.useRef<ReturnType<typeof setTimeout>>();
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(val), 400);
  }, []);

  const { data: unitData, isLoading } = useQuery({
    queryKey: ['units', debouncedSearch],
    queryFn: () => inventoryService.getUnits({ search: debouncedSearch }),
  });
  const units = unitData?.units || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createUnitSchema),
    defaultValues: { name: '', shortCode: '' },
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => inventoryService.createUnit(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setIsFormOpen(false);
      reset();
      toast.success('Unit created successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create unit. Please try again.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      inventoryService.updateUnit(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setIsFormOpen(false);
      setEditingUnit(null);
      reset();
      toast.success('Unit updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update unit. Please try again.');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => inventoryService.deactivateUnit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setConfirmOpen(false);
      setConfirmTarget(null);
      toast.success('Unit deactivated successfully');
    },
    onError: (err: any) => {
      setConfirmOpen(false);
      toast.error(err.message || 'Failed to deactivate unit.');
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      inventoryService.updateUnit(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast.success('Unit reactivated successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to reactivate unit.');
    },
  });

  const handleOpenCreate = useCallback(() => {
    setEditingUnit(null);
    reset({ name: '', shortCode: '' });
    setIsFormOpen(true);
  }, [reset]);

  const handleOpenEdit = useCallback((unit: any) => {
    setEditingUnit(unit);
    reset({ name: unit.name, shortCode: unit.shortCode });
    setIsFormOpen(true);
  }, [reset]);

  const handleCloseForm = useCallback(() => {
    if (createMutation.isPending || updateMutation.isPending) return;
    setIsFormOpen(false);
    setEditingUnit(null);
    reset();
  }, [createMutation.isPending, updateMutation.isPending, reset]);

  React.useEffect(() => {
    if (!isFormOpen) {
      setEditingUnit(null);
      reset({ name: '', shortCode: '' });
    }
  }, [isFormOpen, reset]);

  const handleDeactivateClick = useCallback((unit: any) => {
    setConfirmTarget(unit);
    setConfirmOpen(true);
  }, []);

  const handleConfirmDeactivate = useCallback(() => {
    if (confirmTarget) deactivateMutation.mutate(confirmTarget.id);
  }, [confirmTarget, deactivateMutation]);

  const handleReactivate = useCallback((unit: any) => {
    reactivateMutation.mutate({
      id: unit.id,
      payload: { name: unit.name, shortCode: unit.shortCode, isActive: true },
    });
  }, [reactivateMutation]);

  const onSubmit = useCallback((formData: any) => {
    if (editingUnit) {
      updateMutation.mutate({ id: editingUnit.id, payload: formData });
    } else {
      createMutation.mutate(formData);
    }
  }, [editingUnit, createMutation, updateMutation]);

  const isMutating = createMutation.isPending || updateMutation.isPending;
  const isEditMode = !!editingUnit;

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 flex-shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Ruler className="h-6 w-6 text-primary flex-shrink-0" aria-hidden="true" />
            Units of Measurement
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage stock counts, package formats, sheet layouts, and material dimensions.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <ImportButton
            module="UNITS"
            moduleTitle="Units of Measurement"
            onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ['units'] })}
          />
          <Button onClick={handleOpenCreate} size="sm" className="gap-2 text-xs">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Unit
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-card/45 border border-border p-3 sm:p-3.5 rounded-xl flex-shrink-0 min-w-0">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
          <Input
            placeholder="Search unit name or short code…"
            value={search}
            onChange={handleSearchChange}
            className="pl-9 bg-background/50 border-border/85 text-xs h-9"
            aria-label="Search units"
          />
        </div>
      </div>

      {/* Table */}
      <TableCard>
        {isLoading ? (
          <TableCardBody>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Unit Name</TableHead>
                  <TableHead>Short Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => <UnitSkeletonRow key={i} />)}
              </TableBody>
            </Table>
          </TableCardBody>
        ) : units.length === 0 ? (
          <TableCardBody className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/60">
                <Hash className="h-8 w-8 text-muted-foreground/70" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No units yet</h3>
              <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">
                {debouncedSearch
                  ? 'No units match your search.'
                  : 'Create your first unit of measurement to start cataloging products.'}
              </p>
              {!debouncedSearch && (
                <Button onClick={handleOpenCreate} size="sm" className="mt-4 gap-2 text-xs">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Create First Unit
                </Button>
              )}
            </div>
          </TableCardBody>
        ) : (
          <TableCardBody>
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-secondary/95 backdrop-blur-md">
                <TableRow className="bg-muted/40">
                  <TableHead>Unit Name</TableHead>
                  <TableHead>Short Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((unit: any) => (
                  <TableRow key={unit.id} className="hover:bg-muted/20 transition-colors group">
                    <TableCell className="font-semibold text-foreground">{unit.name}</TableCell>
                    <TableCell>
                      <code className="font-mono text-xs bg-secondary/60 px-2 py-0.5 rounded border border-border/40 text-muted-foreground">
                        {unit.shortCode}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={unit.isActive ? 'success' : 'danger'}>
                        {unit.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Tooltip content="Edit unit">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(unit)}
                            aria-label={`Edit ${unit.name}`}
                            className="h-8 w-8 p-0 hover:bg-secondary"
                          >
                            <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                        </Tooltip>

                        {unit.isActive ? (
                          <Tooltip content="Deactivate unit">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeactivateClick(unit)}
                              aria-label={`Deactivate ${unit.name}`}
                              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              isLoading={deactivateMutation.isPending && confirmTarget?.id === unit.id}
                            >
                              <PowerOff className="h-3.5 w-3.5" aria-hidden="true" />
                            </Button>
                          </Tooltip>
                        ) : (
                          <Tooltip content="Reactivate unit">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReactivate(unit)}
                              aria-label={`Reactivate ${unit.name}`}
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

      {/* Form Modal */}
      <Dialog
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        loading={isMutating}
        title={isEditMode ? 'Edit Unit' : 'Create Unit'}
        description={isEditMode ? 'Update unit attributes.' : 'Add a new unit format.'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="unit-name" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Unit Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="unit-name"
              {...register('name')}
              placeholder="e.g. Pieces, Meters, Sheets"
              aria-invalid={!!errors.name}
              disabled={isMutating}
            />
            <FieldError message={errors.name?.message as string} />
          </div>

          <div>
            <label htmlFor="unit-code" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Short Code <span className="text-destructive">*</span>
            </label>
            <Input
              id="unit-code"
              {...register('shortCode')}
              placeholder="e.g. pcs, m, sht"
              aria-invalid={!!errors.shortCode}
              disabled={isMutating}
            />
            <FieldError message={errors.shortCode?.message as string} />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={handleCloseForm} disabled={isMutating}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isMutating} isLoading={isMutating} className="min-w-[120px]">
              {isMutating ? (isEditMode ? 'Saving…' : 'Creating…') : isEditMode ? 'Save Changes' : 'Create Unit'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Deactivate Confirm */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setConfirmTarget(null); }}
        onConfirm={handleConfirmDeactivate}
        title="Deactivate Unit?"
        description={`"${confirmTarget?.name}" will no longer be available for new product assignments.`}
        confirmLabel="Deactivate"
        confirmingLabel="Deactivating…"
        isLoading={deactivateMutation.isPending}
      />
    </AppShell>
  );
}
