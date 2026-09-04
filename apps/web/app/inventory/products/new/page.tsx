'use client';

import React, { useCallback, useState } from 'react';
import { Navbar } from '../../../../components/layout/Navbar';
import { Sidebar } from '../../../../components/layout/Sidebar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../../../../services/inventoryService';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { ImageUpload } from '../../../../components/ui/ImageUpload';
import { Card, CardContent } from '../../../../components/ui/Card';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProductSchema } from '@furniture-os/shared';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Package, Tag, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import toast from '@/components/ui/Toast';

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-3 border-b border-border/50 mb-5">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p role="alert" className="text-xs font-medium text-destructive mt-1">{message}</p>;
}

const selectClass =
  'w-full h-10 text-sm rounded-lg border border-border bg-background px-3 text-foreground placeholder-muted-foreground/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all disabled:opacity-50 disabled:cursor-not-allowed';

export default function NewProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Query categories and units
  const { data: catData, isLoading: isCatLoading } = useQuery({
    queryKey: ['categories-active'],
    queryFn: () => inventoryService.getCategories({ isActive: true }),
    staleTime: 5 * 60 * 1000,
  });
  const { data: unitData, isLoading: isUnitLoading } = useQuery({
    queryKey: ['units-active'],
    queryFn: () => inventoryService.getUnits({ isActive: true }),
    staleTime: 5 * 60 * 1000,
  });
  const categories = catData?.categories || [];
  const units = unitData?.units || [];

  // Form
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: '',
      sku: '',
      productType: 'FINISHED_PRODUCT' as const,
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

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => inventoryService.createProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      toast.success('Product created successfully');
      router.push('/inventory/products');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create product. Check SKU uniqueness.');
    },
  });

  // Image upload handler — proxied via backend
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const result = await inventoryService.uploadImage(file);
    toast.success('Image uploaded successfully');
    return result.url;
  }, []);

  const onSubmit = useCallback((formData: any) => {
    createMutation.mutate(formData);
  }, [createMutation]);

  const isSubmitting = createMutation.isPending;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex flex-1 min-h-0 w-full max-w-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 overflow-y-auto custom-scrollbar min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/inventory/products">
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0 border-border/80"
                aria-label="Back to products"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                  Add New Product
                </h1>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  New
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Catalog a new furniture piece or raw material stock item.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-6xl">
              {/* Left column — main details */}
              <div className="xl:col-span-2 space-y-6">
                {/* Basic Info */}
                <Card className="border-border/80 bg-card/40">
                  <CardContent className="pt-6">
                    <SectionHeader icon={Package} title="Basic Information" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="sm:col-span-2 space-y-1.5">
                        <label htmlFor="prod-name" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Product Name <span className="text-destructive">*</span>
                        </label>
                        <Input
                          id="prod-name"
                          {...register('name')}
                          placeholder="e.g. 3 Seater Velvet Sofa"
                          className="bg-background border-border/80"
                          aria-invalid={!!errors.name}
                          autoComplete="off"
                        />
                        <FieldError message={errors.name?.message as string} />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="prod-sku" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          SKU <span className="text-destructive">*</span>
                        </label>
                        <Input
                          id="prod-sku"
                          {...register('sku')}
                          placeholder="e.g. SOFA-3S-001"
                          className="bg-background border-border/80 font-mono uppercase"
                          aria-invalid={!!errors.sku}
                          autoComplete="off"
                        />
                        <p className="text-xs text-muted-foreground">Unique identifier — alphanumeric, hyphens and underscores allowed.</p>
                        <FieldError message={errors.sku?.message as string} />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="prod-type" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Product Type <span className="text-destructive">*</span>
                        </label>
                        <select id="prod-type" {...register('productType')} className={selectClass} aria-invalid={!!errors.productType}>
                          <option value="FINISHED_PRODUCT">Finished Furniture Piece</option>
                          <option value="RAW_MATERIAL">Raw Material Stock</option>
                        </select>
                        <FieldError message={errors.productType?.message as string} />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="prod-category" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Category <span className="text-destructive">*</span>
                        </label>
                        <select
                          id="prod-category"
                          {...register('categoryId')}
                          className={selectClass}
                          disabled={isCatLoading}
                          aria-invalid={!!errors.categoryId}
                        >
                          <option value="">
                            {isCatLoading ? 'Loading categories…' : 'Select a category'}
                          </option>
                          {categories.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                        <FieldError message={errors.categoryId?.message as string} />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="prod-unit" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Unit of Measurement <span className="text-destructive">*</span>
                        </label>
                        <select
                          id="prod-unit"
                          {...register('unitId')}
                          className={selectClass}
                          disabled={isUnitLoading}
                          aria-invalid={!!errors.unitId}
                        >
                          <option value="">
                            {isUnitLoading ? 'Loading units…' : 'Select a unit'}
                          </option>
                          {units.map((unit: any) => (
                            <option key={unit.id} value={unit.id}>
                              {unit.name} ({unit.shortCode})
                            </option>
                          ))}
                        </select>
                        <FieldError message={errors.unitId?.message as string} />
                      </div>

                      <div className="sm:col-span-2 space-y-1.5">
                        <label htmlFor="prod-desc" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Description <span className="text-muted-foreground/60 normal-case font-normal">(Optional)</span>
                        </label>
                        <textarea
                          id="prod-desc"
                          {...register('description')}
                          placeholder="Enter dimensions, colors, materials or assembly details…"
                          rows={3}
                          className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all resize-none"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing & Stock */}
                <Card className="border-border/80 bg-card/40">
                  <CardContent className="pt-6">
                    <SectionHeader icon={BarChart3} title="Pricing & Stock Levels" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label htmlFor="prod-pp" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Purchase Price (₹) <span className="text-destructive">*</span>
                        </label>
                        <Input
                          id="prod-pp"
                          type="number"
                          step="any"
                          min="0"
                          {...register('purchasePrice', { valueAsNumber: true })}
                          placeholder="e.g. 25000"
                          className="bg-background border-border/80"
                          aria-invalid={!!errors.purchasePrice}
                        />
                        <FieldError message={errors.purchasePrice?.message as string} />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="prod-sp" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Selling Price (₹) <span className="text-destructive">*</span>
                        </label>
                        <Input
                          id="prod-sp"
                          type="number"
                          step="any"
                          min="0"
                          {...register('sellingPrice', { valueAsNumber: true })}
                          placeholder="e.g. 35000"
                          className="bg-background border-border/80"
                          aria-invalid={!!errors.sellingPrice}
                        />
                        <FieldError message={errors.sellingPrice?.message as string} />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="prod-min" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Minimum Alert Level
                        </label>
                        <Input
                          id="prod-min"
                          type="number"
                          step="any"
                          min="0"
                          {...register('minimumStock', { valueAsNumber: true })}
                          placeholder="e.g. 5"
                          className="bg-background border-border/80"
                        />
                        <p className="text-xs text-muted-foreground">Trigger a low-stock warning when stock falls at or below this level.</p>
                        <FieldError message={errors.minimumStock?.message as string} />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="prod-os" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Opening Stock Quantity
                        </label>
                        <Input
                          id="prod-os"
                          type="number"
                          step="any"
                          min="0"
                          {...register('openingStock', { valueAsNumber: true })}
                          placeholder="e.g. 25"
                          className="bg-background border-border/80"
                        />
                        <p className="text-xs text-muted-foreground">Starting inventory count when this product is first cataloged.</p>
                        <FieldError message={errors.openingStock?.message as string} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right column — Image + Save */}
              <div className="space-y-6">
                {/* Image Upload */}
                <Card className="border-border/80 bg-card/40">
                  <CardContent className="pt-6">
                    <SectionHeader icon={Tag} title="Product Image" />
                    <Controller
                      name="imageUrl"
                      control={control}
                      render={({ field }) => (
                        <ImageUpload
                          value={field.value || null}
                          onChange={(url) => field.onChange(url || '')}
                          onUpload={handleImageUpload}
                          disabled={isSubmitting}
                        />
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Save Card */}
                <Card className="border-border/80 bg-card/40">
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">Ready to save?</p>
                      <p className="text-xs text-muted-foreground">
                        Review all fields before saving. SKU cannot be changed after creation.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Button
                        type="submit"
                        className="w-full gap-2"
                        disabled={isSubmitting}
                        isLoading={isSubmitting}
                      >
                        <Save className="h-4 w-4" aria-hidden="true" />
                        {isSubmitting ? 'Saving Product…' : 'Save Product'}
                      </Button>
                      <Link href="/inventory/products" className="block">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full border-border/80"
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
