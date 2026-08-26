'use client';

import React from 'react';
import { Navbar } from '../../../../components/layout/Navbar';
import { Sidebar } from '../../../../components/layout/Sidebar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../../../../services/inventoryService';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/Card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProductSchema } from '@furniture-os/shared';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function NewProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Query categories
  const { data: catData, isLoading: isCatLoading } = useQuery({
    queryKey: ['categories-active'],
    queryFn: () => inventoryService.getCategories({ isActive: true }),
  });

  // Query units
  const { data: unitData, isLoading: isUnitLoading } = useQuery({
    queryKey: ['units-active'],
    queryFn: () => inventoryService.getUnits({ isActive: true }),
  });

  const categories = catData?.categories || [];
  const units = unitData?.units || [];

  // Form Setup
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: '',
      sku: '',
      productType: 'FINISHED_PRODUCT',
      categoryId: '',
      unitId: '',
      purchasePrice: 0,
      sellingPrice: 0,
      minimumStock: 0,
      openingStock: 0,
      description: '',
      imageUrl: '',
    },
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => inventoryService.createProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      router.push('/inventory/products');
    },
  });

  const onSubmit = (formData: any) => {
    createMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/inventory/products">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-border/80">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Add New Product</h1>
                <p className="text-sm text-muted-foreground">Catalog a new furniture piece or raw material stock.</p>
              </div>
            </div>
          </div>

          <Card className="border-border/80 max-w-4xl bg-card/40">
            <CardHeader>
              <CardTitle className="text-lg">Product Details</CardTitle>
              <CardDescription>All fields are required unless indicated otherwise.</CardDescription>
            </CardHeader>
            <CardContent>
              {createMutation.isError && (
                <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <p className="text-xs text-destructive font-medium">
                    {(createMutation.error as any).message || 'Failed to create product. Check SKU uniqueness.'}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product Name</label>
                    <Input {...register('name')} placeholder="e.g. 3 Seater Velvet Sofa" className="bg-background border-border/80" />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                  </div>

                  {/* SKU */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">SKU (Unique code)</label>
                    <Input {...register('sku')} placeholder="e.g. SOFA-3S-001" className="bg-background border-border/80 font-mono uppercase" />
                    {errors.sku && <p className="text-xs text-red-500 mt-1">{errors.sku.message}</p>}
                  </div>

                  {/* Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product Type</label>
                    <select
                      {...register('productType')}
                      className="w-full h-10 text-sm rounded-lg border border-border bg-background px-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/80"
                    >
                      <option value="FINISHED_PRODUCT">Finished Furniture Piece</option>
                      <option value="RAW_MATERIAL">Raw Material Stock</option>
                    </select>
                    {errors.productType && <p className="text-xs text-red-500 mt-1">{errors.productType.message}</p>}
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
                    <select
                      {...register('categoryId')}
                      className="w-full h-10 text-sm rounded-lg border border-border bg-background px-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/80"
                      disabled={isCatLoading}
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && <p className="text-xs text-red-500 mt-1">{errors.categoryId.message}</p>}
                  </div>

                  {/* Unit */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unit of Measurement</label>
                    <select
                      {...register('unitId')}
                      className="w-full h-10 text-sm rounded-lg border border-border bg-background px-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/80"
                      disabled={isUnitLoading}
                    >
                      <option value="">Select Unit</option>
                      {units.map((unit: any) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name} ({unit.shortCode})
                        </option>
                      ))}
                    </select>
                    {errors.unitId && <p className="text-xs text-red-500 mt-1">{errors.unitId.message}</p>}
                  </div>

                  {/* Purchase Price */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Purchase Price (₹)</label>
                    <Input
                      type="number"
                      step="any"
                      {...register('purchasePrice', { valueAsNumber: true })}
                      placeholder="e.g. 25000"
                      className="bg-background border-border/80"
                    />
                    {errors.purchasePrice && <p className="text-xs text-red-500 mt-1">{errors.purchasePrice.message}</p>}
                  </div>

                  {/* Selling Price */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Selling Price (₹)</label>
                    <Input
                      type="number"
                      step="any"
                      {...register('sellingPrice', { valueAsNumber: true })}
                      placeholder="e.g. 35000"
                      className="bg-background border-border/80"
                    />
                    {errors.sellingPrice && <p className="text-xs text-red-500 mt-1">{errors.sellingPrice.message}</p>}
                  </div>

                  {/* Minimum Stock */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Minimum Alert Level</label>
                    <Input
                      type="number"
                      step="any"
                      {...register('minimumStock', { valueAsNumber: true })}
                      placeholder="e.g. 5"
                      className="bg-background border-border/80"
                    />
                    {errors.minimumStock && <p className="text-xs text-red-500 mt-1">{errors.minimumStock.message}</p>}
                  </div>

                  {/* Opening Stock */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Opening Stock Quantity</label>
                    <Input
                      type="number"
                      step="any"
                      {...register('openingStock', { valueAsNumber: true })}
                      placeholder="e.g. 25"
                      className="bg-background border-border/80"
                    />
                    {errors.openingStock && <p className="text-xs text-red-500 mt-1">{errors.openingStock.message}</p>}
                  </div>

                  {/* Image Url */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product Image URL (Optional)</label>
                    <Input {...register('imageUrl')} placeholder="https://example.com/images/sofa.jpg" className="bg-background border-border/80" />
                    {errors.imageUrl && <p className="text-xs text-red-500 mt-1">{errors.imageUrl.message}</p>}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description (Optional)</label>
                  <textarea
                    {...register('description')}
                    placeholder="Enter dimensions, colors, materials or assembly details..."
                    rows={4}
                    className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/80"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
                  <Link href="/inventory/products">
                    <Button type="button" variant="outline" className="border-border/85">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" className="bg-primary gap-2" disabled={createMutation.isPending}>
                    <Save className="h-4 w-4" />
                    {createMutation.isPending ? 'Saving...' : 'Save Product'}
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
