'use client';

import React, { useCallback, useEffect } from 'react';
import { Navbar } from '../../../../../components/layout/Navbar';
import { Sidebar } from '../../../../../components/layout/Sidebar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../../../../../services/inventoryService';
import { Button } from '../../../../../components/ui/Button';
import { Input } from '../../../../../components/ui/Input';
import { ImageUpload } from '../../../../../components/ui/ImageUpload';
import { Card, CardContent } from '../../../../../components/ui/Card';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProductSchema } from '@furniture-os/shared';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Package, Tag, BarChart3, AlertCircle, Lock } from 'lucide-react';
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

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5 opacity-70">
      <div className="flex items-center gap-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </label>
        <Lock className="h-3 w-3 text-muted-foreground/60" aria-hidden="true" />
      </div>
      <div className="flex h-10 items-center rounded-lg border border-border bg-muted/30 px-3 text-sm font-mono text-muted-foreground cursor-not-allowed select-none">
        {value}
      </div>
    </div>
  );
}

const selectClass =
  'w-full h-10 text-sm rounded-lg border border-border bg-background px-3 text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all disabled:opacity-50 disabled:cursor-not-allowed';

// Skeleton while loading
function EditProductSkeleton() {
  return (
    <div className="flex flex-1">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 space-y-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-9 w-9 rounded-lg bg-muted/50" />
          <div>
            <div className="h-7 w-48 rounded bg-muted/50 mb-2" />
            <div className="h-4 w-64 rounded bg-muted/50" />
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-6xl">
          <div className="xl:col-span-2 space-y-6">
            <div className="h-72 rounded-xl bg-card/40 border border-border/50" />
            <div className="h-56 rounded-xl bg-card/40 border border-border/50" />
          </div>
          <div className="space-y-6">
            <div className="h-64 rounded-xl bg-card/40 border border-border/50" />
            <div className="h-32 rounded-xl bg-card/40 border border-border/50" />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const queryClient = useQueryClient();

  // Fetch product data
  const { data: result, isLoading: isProdLoading, error } = useQuery({
    queryKey: ['product-edit-data', id],
    queryFn: () => inventoryService.getProductById(id),
  });

  // Fetch categories and units — share cache with other pages
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

  const product = result?.product;
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
    resolver: zodResolver(updateProductSchema),
  });

  // Preload form values when product data arrives
  useEffect(() => {
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

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (payload: any) => inventoryService.updateProduct(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['product-edit-data', id] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      toast.success('Product updated successfully');
      router.push(`/inventory/products/${id}`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save changes. Please try again.');
    },
  });

  // Image upload — proxied via backend
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const result = await inventoryService.uploadImage(file);
    toast.success('Image uploaded successfully');
    return result.url;
  }, []);

  const onSubmit = useCallback(
    (formData: any) => {
      updateMutation.mutate(formData);
    },
    [updateMutation]
  );

  const isSubmitting = updateMutation.isPending;

  // Loading state
  if (isProdLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <EditProductSkeleton />
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8 text-center">
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 max-w-lg mx-auto mt-16">
              <AlertCircle className="mx-auto h-12 w-12 text-destructive" aria-hidden="true" />
              <h3 className="mt-4 text-base font-semibold text-foreground">Failed to load product</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                The product may not exist or you may not have access.
              </p>
              <Link href="/inventory/products" className="mt-6 inline-block">
                <Button size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back to Products
                </Button>
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
        <main className="flex-1 p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href={`/inventory/products/${id}`}>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0 border-border/80 flex-shrink-0"
                aria-label="Back to product details"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                  Edit Product
                </h1>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border bg-blue-500/10 text-blue-400 border-blue-500/20">
                  Editing
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Modifying details for{' '}
                <span className="font-semibold text-foreground">{product.name}</span>
                <code className="ml-1.5 font-mono text-xs bg-secondary/60 px-1.5 py-0.5 rounded border border-border/40 text-muted-foreground uppercase">
                  {product.sku}
                </code>
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-6xl">
              {/* Left — editable fields */}
              <div className="xl:col-span-2 space-y-6">
                {/* Basic Information */}
                <Card className="border-border/80 bg-card/40">
                  <CardContent className="pt-6">
                    <SectionHeader icon={Package} title="Basic Information" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Product Name */}
                      <div className="space-y-1.5">
                        <label htmlFor="edit-name" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Product Name <span className="text-destructive">*</span>
                        </label>
                        <Input
                          id="edit-name"
                          {...register('name')}
                          className="bg-background border-border/80"
                          aria-invalid={!!errors.name}
                          autoComplete="off"
                        />
                        <FieldError message={errors.name?.message as string} />
                      </div>

                      {/* SKU — locked */}
                      <ReadOnlyField label="SKU Code (Locked)" value={product.sku} />

                      {/* Product Type — locked */}
                      <ReadOnlyField
                        label="Product Type (Locked)"
                        value={product.productType === 'FINISHED_PRODUCT' ? 'Finished Furniture Piece' : 'Raw Material Resource'}
                      />

                      {/* Current Stock — read-only */}
                      <div className="space-y-1.5">
                        <ReadOnlyField
                          label="Current Stock (Read-Only)"
                          value={`${product.currentStock} ${product.unit?.shortCode}`}
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Use "Adjust Stock" to update quantities.
                        </p>
                      </div>

                      {/* Category */}
                      <div className="space-y-1.5">
                        <label htmlFor="edit-cat" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Category
                        </label>
                        <select
                          id="edit-cat"
                          {...register('categoryId')}
                          className={selectClass}
                          disabled={isCatLoading}
                          aria-invalid={!!errors.categoryId}
                        >
                          {categories.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                        <FieldError message={errors.categoryId?.message as string} />
                      </div>

                      {/* Unit */}
                      <div className="space-y-1.5">
                        <label htmlFor="edit-unit" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Unit of Measurement
                        </label>
                        <select
                          id="edit-unit"
                          {...register('unitId')}
                          className={selectClass}
                          disabled={isUnitLoading}
                          aria-invalid={!!errors.unitId}
                        >
                          {units.map((unit: any) => (
                            <option key={unit.id} value={unit.id}>
                              {unit.name} ({unit.shortCode})
                            </option>
                          ))}
                        </select>
                        <FieldError message={errors.unitId?.message as string} />
                      </div>

                      {/* Catalog status */}
                      <div className="sm:col-span-2 flex items-center gap-3 p-3 rounded-lg bg-secondary/20 border border-border/40">
                        <input
                          type="checkbox"
                          id="edit-isActive"
                          {...register('isActive')}
                          className="h-4 w-4 rounded border-border bg-background text-primary focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                        />
                        <div>
                          <label htmlFor="edit-isActive" className="text-sm font-medium text-foreground cursor-pointer">
                            Active in catalog
                          </label>
                          <p className="text-xs text-muted-foreground">
                            Uncheck to hide this product from active inventory listings.
                          </p>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="sm:col-span-2 space-y-1.5">
                        <label htmlFor="edit-desc" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Description{' '}
                          <span className="text-muted-foreground/60 normal-case font-normal">(Optional)</span>
                        </label>
                        <textarea
                          id="edit-desc"
                          {...register('description')}
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div className="space-y-1.5">
                        <label htmlFor="edit-pp" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Purchase Price (₹)
                        </label>
                        <Input
                          id="edit-pp"
                          type="number"
                          step="any"
                          min="0"
                          {...register('purchasePrice', { valueAsNumber: true })}
                          className="bg-background border-border/80"
                          aria-invalid={!!errors.purchasePrice}
                        />
                        <FieldError message={errors.purchasePrice?.message as string} />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="edit-sp" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Selling Price (₹)
                        </label>
                        <Input
                          id="edit-sp"
                          type="number"
                          step="any"
                          min="0"
                          {...register('sellingPrice', { valueAsNumber: true })}
                          className="bg-background border-border/80"
                          aria-invalid={!!errors.sellingPrice}
                        />
                        <FieldError message={errors.sellingPrice?.message as string} />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="edit-min" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Minimum Alert Level
                        </label>
                        <Input
                          id="edit-min"
                          type="number"
                          step="any"
                          min="0"
                          {...register('minimumStock', { valueAsNumber: true })}
                          className="bg-background border-border/80"
                          aria-invalid={!!errors.minimumStock}
                        />
                        <FieldError message={errors.minimumStock?.message as string} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right — Image + Save */}
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
                    <div>
                      <p className="text-sm font-medium text-foreground">Save Changes</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        All changes take effect immediately. SKU and product type cannot be changed.
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
                        {isSubmitting ? 'Saving Changes…' : 'Save Changes'}
                      </Button>
                      <Link href={`/inventory/products/${id}`} className="block">
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
