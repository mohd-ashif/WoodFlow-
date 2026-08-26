'use client';

import React from 'react';
import { Navbar } from '../../../../../components/layout/Navbar';
import { Sidebar } from '../../../../../components/layout/Sidebar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../../../../../services/inventoryService';
import { Button } from '../../../../../components/ui/Button';
import { Input } from '../../../../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../../components/ui/Card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProductSchema } from '@furniture-os/shared';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const queryClient = useQueryClient();

  // Query product data
  const { data: result, isLoading: isProdLoading, error } = useQuery({
    queryKey: ['product-edit-data', id],
    queryFn: () => inventoryService.getProductById(id),
  });

  // Query categories
  const { data: catData, isLoading: isCatLoading } = useQuery({
    queryKey: ['categories-active-edit'],
    queryFn: () => inventoryService.getCategories({ isActive: true }),
  });

  // Query units
  const { data: unitData, isLoading: isUnitLoading } = useQuery({
    queryKey: ['units-active-edit'],
    queryFn: () => inventoryService.getUnits({ isActive: true }),
  });

  const product = result?.product;
  const categories = catData?.categories || [];
  const units = unitData?.units || [];

  // Form Setup
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(updateProductSchema),
  });

  // Populate form once data is loaded
  React.useEffect(() => {
    if (product) {
      setValue('name', product.name);
      setValue('categoryId', product.categoryId);
      setValue('unitId', product.unitId);
      setValue('purchasePrice', product.purchasePrice);
      setValue('sellingPrice', product.sellingPrice);
      setValue('minimumStock', product.minimumStock);
      setValue('description', product.description || '');
      setValue('imageUrl', product.imageUrl || '');
      setValue('isActive', product.isActive);
    }
  }, [product, setValue]);

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (payload: any) => inventoryService.updateProduct(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      router.push(`/inventory/products/${id}`);
    },
  });

  const onSubmit = (formData: any) => {
    updateMutation.mutate(formData);
  };

  if (isProdLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8 space-y-6 animate-pulse">
            <div className="h-8 w-48 bg-card rounded-md" />
            <div className="h-96 bg-card rounded-xl max-w-4xl" />
          </main>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8 text-center">
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 max-w-lg mx-auto">
              <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
              <h3 className="mt-4 text-sm font-semibold text-foreground">Failed to load product for editing</h3>
              <Link href="/inventory/products" className="mt-4 inline-block">
                <Button size="sm">Back to Products</Button>
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href={`/inventory/products/${id}`}>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-border/80">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Edit Product</h1>
                <p className="text-sm text-muted-foreground">Modify catalog details for product <span className="font-semibold text-foreground">{product.name}</span></p>
              </div>
            </div>
          </div>

          <Card className="border-border/80 max-w-4xl bg-card/40">
            <CardHeader>
              <CardTitle className="text-lg">Edit Details</CardTitle>
              <CardDescription>Adjust pricing, category groupings, alert thresholds, and image urls.</CardDescription>
            </CardHeader>
            <CardContent>
              {updateMutation.isError && (
                <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <p className="text-xs text-destructive font-medium">
                    {(updateMutation.error as any).message || 'Failed to save product edits. Check parameters.'}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product Name</label>
                    <Input {...register('name')} className="bg-background border-border/80" />
                    {errors.name?.message && <p className="text-xs text-red-500 mt-1">{errors.name.message as string}</p>}
                  </div>

                  {/* SKU - LOCKED */}
                  <div className="space-y-1.5 opacity-60">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">SKU Code (Read-Only)</label>
                    <Input value={product.sku} disabled className="bg-secondary font-mono uppercase cursor-not-allowed border-border/80" />
                  </div>

                  {/* Product Type - LOCKED */}
                  <div className="space-y-1.5 opacity-60">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product Type (Read-Only)</label>
                    <Input
                      value={product.productType === 'FINISHED_PRODUCT' ? 'Finished Furniture Piece' : 'Raw Material Resource'}
                      disabled
                      className="bg-secondary cursor-not-allowed border-border/80"
                    />
                  </div>

                  {/* Current Quantity - LOCKED */}
                  <div className="space-y-1.5 opacity-60">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Stock Quantity (Read-Only)</label>
                    <Input
                      value={`${product.currentStock} ${product.unit?.shortCode}`}
                      disabled
                      className="bg-secondary cursor-not-allowed border-border/80 font-semibold"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">To change stock quantities, execute a manual adjustment operation.</p>
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
                    <select
                      {...register('categoryId')}
                      className="w-full h-10 text-sm rounded-lg border border-border bg-background px-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/80"
                      disabled={isCatLoading}
                    >
                      {categories.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId?.message && <p className="text-xs text-red-500 mt-1">{errors.categoryId.message as string}</p>}
                  </div>

                  {/* Unit */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unit</label>
                    <select
                      {...register('unitId')}
                      className="w-full h-10 text-sm rounded-lg border border-border bg-background px-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/80"
                      disabled={isUnitLoading}
                    >
                      {units.map((unit: any) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name} ({unit.shortCode})
                        </option>
                      ))}
                    </select>
                    {errors.unitId?.message && <p className="text-xs text-red-500 mt-1">{errors.unitId.message as string}</p>}
                  </div>

                  {/* Purchase Price */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Purchase Price (₹)</label>
                    <Input
                      type="number"
                      step="any"
                      {...register('purchasePrice', { valueAsNumber: true })}
                      className="bg-background border-border/80"
                    />
                    {errors.purchasePrice?.message && <p className="text-xs text-red-500 mt-1">{errors.purchasePrice.message as string}</p>}
                  </div>

                  {/* Selling Price */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Selling Price (₹)</label>
                    <Input
                      type="number"
                      step="any"
                      {...register('sellingPrice', { valueAsNumber: true })}
                      className="bg-background border-border/80"
                    />
                    {errors.sellingPrice?.message && <p className="text-xs text-red-500 mt-1">{errors.sellingPrice.message as string}</p>}
                  </div>

                  {/* Minimum Stock */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Minimum Alert Level</label>
                    <Input
                      type="number"
                      step="any"
                      {...register('minimumStock', { valueAsNumber: true })}
                      className="bg-background border-border/80"
                    />
                    {errors.minimumStock?.message && <p className="text-xs text-red-500 mt-1">{errors.minimumStock.message as string}</p>}
                  </div>

                  {/* Image Url */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product Image URL (Optional)</label>
                    <Input {...register('imageUrl')} className="bg-background border-border/80" />
                    {errors.imageUrl?.message && <p className="text-xs text-red-500 mt-1">{errors.imageUrl.message as string}</p>}
                  </div>

                  {/* Status Toggle */}
                  <div className="space-y-1.5 flex flex-col justify-center">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Catalog Status</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        {...register('isActive')}
                        className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary/80"
                      />
                      <label htmlFor="isActive" className="text-sm font-medium text-foreground">
                        Active SKU in listings
                      </label>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description (Optional)</label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/80"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
                  <Link href={`/inventory/products/${id}`}>
                    <Button type="button" variant="outline" className="border-border/85">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" className="bg-primary gap-2" disabled={updateMutation.isPending}>
                    <Save className="h-4 w-4" />
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
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
