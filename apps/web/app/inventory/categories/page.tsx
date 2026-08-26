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
import { Search, Plus, Edit, Trash2, FolderHeart, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCategorySchema } from '@furniture-os/shared';

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Query Categories
  const { data: catData, isLoading, refetch } = useQuery({
    queryKey: ['categories', debouncedSearch],
    queryFn: () => inventoryService.getCategories({ search: debouncedSearch }),
  });

  const categories = catData?.categories || [];

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => inventoryService.createCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setSuccessMsg('Category created successfully!');
      setTimeout(() => {
        setIsOpen(false);
        setSuccessMsg('');
        reset();
      }, 2000);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to create category.');
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      inventoryService.updateCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setSuccessMsg('Category updated successfully!');
      setTimeout(() => {
        setIsOpen(false);
        setSuccessMsg('');
        setEditingCategory(null);
        reset();
      }, 2000);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to update category.');
    },
  });

  // Deactivate Mutation
  const deactivateMutation = useMutation({
    mutationFn: (id: string) => inventoryService.deactivateCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to deactivate category.');
    },
  });

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setErrorMsg('');
    setSuccessMsg('');
    reset({ name: '', description: '' });
    setIsOpen(true);
  };

  const handleOpenEdit = (category: any) => {
    setEditingCategory(category);
    setErrorMsg('');
    setSuccessMsg('');
    reset({
      name: category.name,
      description: category.description || '',
    });
    setIsOpen(true);
  };

  const onSubmit = (formData: any) => {
    setErrorMsg('');
    setSuccessMsg('');
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, payload: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleToggleDeactivate = (category: any) => {
    if (category.isActive) {
      if (confirm(`Are you sure you want to deactivate category "${category.name}"?`)) {
        deactivateMutation.mutate(category.id);
      }
    } else {
      // Reactivate by updating with same values
      updateMutation.mutate({
        id: category.id,
        payload: { name: category.name, description: category.description || '', isActive: true },
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
                <FolderHeart className="h-8 w-8 text-primary" /> Product Categories
              </h1>
              <p className="text-sm text-muted-foreground">
                Classify your items to organize catalogs and structure metrics.
              </p>
            </div>
            <Button className="gap-2 bg-primary text-primary-foreground" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4" /> Add Category
            </Button>
          </div>

          {/* Search bar */}
          <div className="bg-card/45 border border-border p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search category name, description..."
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
          ) : categories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 p-16 text-center">
              <FolderHeart className="mx-auto h-12 w-12 text-muted-foreground/60" />
              <h3 className="mt-4 text-sm font-semibold text-foreground">No categories defined</h3>
              <p className="mt-1 text-xs text-muted-foreground">Define categories to classify products.</p>
              <Button size="sm" onClick={handleOpenCreate} className="mt-4">
                Create First Category
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card/30 overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Category Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-32 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category: any) => (
                    <TableRow key={category.id} className="hover:bg-muted/20">
                      <TableCell className="font-semibold text-foreground">{category.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {category.description || <span className="italic text-xs opacity-60">No description</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={category.isActive ? 'success' : 'danger'} className="text-xs">
                          {category.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(category)}
                            className="h-8 w-8 p-0 border-border/80 hover:bg-secondary"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleDeactivate(category)}
                            className={`h-8 w-8 p-0 border-border/80 hover:bg-secondary ${
                              category.isActive ? 'text-destructive hover:text-destructive/95' : 'text-emerald-500'
                            }`}
                            title={category.isActive ? 'Deactivate' : 'Reactivate'}
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
      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingCategory ? 'Edit Category' : 'Create Category'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errorMsg && <p className="text-xs text-red-500 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">{errorMsg}</p>}
          {successMsg && <p className="text-xs text-emerald-500 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">{successMsg}</p>}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category Name</label>
            <Input {...register('name')} placeholder="e.g. Sofa Chairs" className="bg-background border-border/80" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message as string}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description (Optional)</label>
            <textarea
              {...register('description')}
              placeholder="Provide a description..."
              className="w-full min-h-[80px] rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/80"
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message as string}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="border-border/80">
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-primary text-primary-foreground">
              {editingCategory ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
