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
import { Search, Plus, Edit, Trash2, Ruler, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUnitSchema } from '@furniture-os/shared';

export default function UnitsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Query Units
  const { data: unitData, isLoading, refetch } = useQuery({
    queryKey: ['units', debouncedSearch],
    queryFn: () => inventoryService.getUnits({ search: debouncedSearch }),
  });

  const units = unitData?.units || [];

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createUnitSchema),
    defaultValues: {
      name: '',
      shortCode: '',
    },
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => inventoryService.createUnit(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setSuccessMsg('Unit created successfully!');
      setTimeout(() => {
        setIsOpen(false);
        setSuccessMsg('');
        reset();
      }, 2000);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to create unit.');
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      inventoryService.updateUnit(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setSuccessMsg('Unit updated successfully!');
      setTimeout(() => {
        setIsOpen(false);
        setSuccessMsg('');
        setEditingUnit(null);
        reset();
      }, 2000);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to update unit.');
    },
  });

  // Deactivate Mutation
  const deactivateMutation = useMutation({
    mutationFn: (id: string) => inventoryService.deactivateUnit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to deactivate unit.');
    },
  });

  const handleOpenCreate = () => {
    setEditingUnit(null);
    setErrorMsg('');
    setSuccessMsg('');
    reset({ name: '', shortCode: '' });
    setIsOpen(true);
  };

  const handleOpenEdit = (unit: any) => {
    setEditingUnit(unit);
    setErrorMsg('');
    setSuccessMsg('');
    reset({
      name: unit.name,
      shortCode: unit.shortCode,
    });
    setIsOpen(true);
  };

  const onSubmit = (formData: any) => {
    setErrorMsg('');
    setSuccessMsg('');
    if (editingUnit) {
      updateMutation.mutate({ id: editingUnit.id, payload: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleToggleDeactivate = (unit: any) => {
    if (unit.isActive) {
      if (confirm(`Are you sure you want to deactivate unit "${unit.name}"?`)) {
        deactivateMutation.mutate(unit.id);
      }
    } else {
      // Reactivate by updating with same values
      updateMutation.mutate({
        id: unit.id,
        payload: { name: unit.name, shortCode: unit.shortCode, isActive: true },
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Ruler className="h-8 w-8 text-primary" /> Units of Measurement
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage stock counts, package formats, sheet layouts, and materials dimensions.
              </p>
            </div>
            <Button className="gap-2 bg-primary text-primary-foreground" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4" /> Add Unit
            </Button>
          </div>

          {/* Search bar */}
          <div className="bg-card/45 border border-border p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search unit name, short code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background/50 border-border/85"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2 border-border/80 text-foreground"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>

          {/* Table display */}
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-10 bg-card rounded-lg" />
              <div className="h-20 bg-card rounded-lg" />
            </div>
          ) : units.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 p-16 text-center">
              <Ruler className="mx-auto h-12 w-12 text-muted-foreground/60" />
              <h3 className="mt-4 text-sm font-semibold text-foreground">No units defined</h3>
              <p className="mt-1 text-xs text-muted-foreground">Define units of measurement to map your products.</p>
              <Button size="sm" onClick={handleOpenCreate} className="mt-4">
                Create First Unit
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card/30 overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Unit Name</TableHead>
                    <TableHead>Short Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-32 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.map((unit: any) => (
                    <TableRow key={unit.id} className="hover:bg-muted/20">
                      <TableCell className="font-semibold text-foreground">{unit.name}</TableCell>
                      <TableCell className="font-mono text-muted-foreground text-sm">
                        {unit.shortCode}
                      </TableCell>
                      <TableCell>
                        <Badge variant={unit.isActive ? 'success' : 'danger'} className="text-xs">
                          {unit.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(unit)}
                            className="h-8 w-8 p-0 border-border/80 hover:bg-secondary"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleDeactivate(unit)}
                            className={`h-8 w-8 p-0 border-border/80 hover:bg-secondary ${
                              unit.isActive ? 'text-destructive hover:text-destructive/95' : 'text-emerald-500'
                            }`}
                            title={unit.isActive ? 'Deactivate' : 'Reactivate'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </main>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingUnit ? 'Edit Unit' : 'Create Unit'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errorMsg && <p className="text-xs text-red-500 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">{errorMsg}</p>}
          {successMsg && <p className="text-xs text-emerald-500 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">{successMsg}</p>}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unit Name</label>
            <Input {...register('name')} placeholder="e.g. Piece" className="bg-background border-border/80" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message as string}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Short Code</label>
            <Input {...register('shortCode')} placeholder="e.g. pcs" className="bg-background border-border/80 font-mono uppercase" />
            {errors.shortCode && <p className="text-xs text-red-500 mt-1">{errors.shortCode.message as string}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="border-border/80">
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-primary text-primary-foreground">
              {editingUnit ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
