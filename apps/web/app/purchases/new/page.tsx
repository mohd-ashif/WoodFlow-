'use client';

import React, { useState } from 'react';
import { Navbar } from '../../../components/layout/Navbar';
import { Sidebar } from '../../../components/layout/Sidebar';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchasesService } from '../../../services/purchasesService';
import { crmService } from '../../../services/crmService';
import { fetchApi } from '../../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import Link from 'next/link';
import {
  ShoppingBag,
  Search,
  Trash2,
  ArrowLeft,
  Package,
  Calculator,
  AlertCircle,
  Truck,
  Plus,
} from 'lucide-react';

export default function CreatePurchasePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [overallTaxRate, setOverallTaxRate] = useState<number>(18); // Default 18% GST

  // Cart State
  const [cart, setCart] = useState<
    Array<{
      productId: string;
      productName: string;
      sku: string;
      currentStock: number;
      unitCost: number;
      quantity: number;
      discountAmount: number;
      taxRate: number;
    }>
  >([]);

  // Search States
  const [productSearch, setProductSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Queries
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-all'],
    queryFn: () => crmService.getSuppliers({ limit: 100 }),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-search', productSearch],
    queryFn: () => fetchApi<any[]>(`/products?search=${productSearch}&limit=20`),
  });

  const rawSuppliers = (suppliersData as any)?.data || (Array.isArray(suppliersData) ? suppliersData : []);
  const suppliers = rawSuppliers;

  const rawProducts = (productsData as any)?.data || (Array.isArray(productsData) ? productsData : []);
  const products = rawProducts.filter((p: any) => p.isActive);

  // Create Purchase & Confirm Mutation
  const createPurchaseMutation = useMutation({
    mutationFn: async (shouldConfirm: boolean) => {
      if (cart.length === 0) {
        throw new Error('Please add at least one product item to the purchase order');
      }

      const payload = {
        supplierId: selectedSupplierId || undefined,
        referenceNumber: referenceNumber || undefined,
        notes: notes || undefined,
        discountAmount: overallDiscount,
        taxRate: overallTaxRate,
        items: cart.map((c) => ({
          productId: c.productId,
          quantity: c.quantity,
          unitCost: c.unitCost,
          discountAmount: c.discountAmount,
          taxRate: c.taxRate,
        })),
      };

      const purchase = await purchasesService.createPurchase(payload);
      const purchaseId = (purchase as any)?.id || (purchase as any)?.data?.id;

      if (shouldConfirm && purchaseId) {
        return purchasesService.confirmPurchase(purchaseId);
      }
      return purchase;
    },
    onSuccess: (res: any) => {
      const purchaseId = res?.id || res?.data?.id;
      queryClient.invalidateQueries({ queryKey: ['purchases-list'] });
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-dashboard'] });
      router.push(`/purchases/${purchaseId}`);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to create purchase order');
    },
  });

  // Add Product to Cart
  const handleAddToCart = (product: any) => {
    setErrorMsg('');
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          currentStock: product.currentStock,
          unitCost: product.costPrice || product.sellingPrice * 0.7 || 0,
          quantity: 1,
          discountAmount: 0,
          taxRate: 0,
        },
      ];
    });
  };

  // Update Cart Quantity or Unit Cost
  const handleUpdateItem = (productId: string, updates: Partial<{ quantity: number; unitCost: number }>) => {
    setErrorMsg('');
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const updated = { ...item, ...updates };
          if (updated.quantity <= 0) return item;
          return updated;
        }
        return item;
      })
    );
  };

  // Remove Item from Cart
  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Calculate Totals
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  const itemsDiscount = cart.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
  const totalDiscount = itemsDiscount + (overallDiscount || 0);
  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  const taxAmount = (taxableAmount * (overallTaxRate || 0)) / 100;
  const grandTotal = Math.max(0, taxableAmount + taxAmount);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex flex-1 min-h-0 w-full max-w-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full overflow-y-auto custom-scrollbar min-w-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <Link href="/purchases">
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground text-xs px-2">
                  <ArrowLeft className="h-4 w-4" /> Back to Purchases
                </Button>
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
                New Purchase Order
              </h1>
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Supplier & Product Selection */}
            <div className="lg:col-span-7 space-y-6">
              {/* Supplier Selector & Ref */}
              <Card className="border-border/80">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" />
                    Supplier Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Select Supplier</label>
                      <select
                        value={selectedSupplierId}
                        onChange={(e) => setSelectedSupplierId(e.target.value)}
                        className="w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">-- Direct / Walk-in Purchase --</option>
                        {suppliers.map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.phone}) {s.supplierCode ? `[${s.supplierCode}]` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Supplier Reference / Invoice #</label>
                      <Input
                        placeholder="e.g. SUP-INV-9921"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        className="h-10 text-xs font-mono"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Product Search & Selection */}
              <Card className="border-border/80">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    Product Search
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search product by name or SKU..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-9 h-10 text-xs"
                    />
                  </div>

                  <div className="divide-y divide-border/40 max-h-72 overflow-y-auto rounded-lg border border-border/60">
                    {products.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        No active products found matching search.
                      </p>
                    ) : (
                      products.map((prod: any) => (
                        <div
                          key={prod.id}
                          className="p-3 flex items-center justify-between hover:bg-secondary/20 transition-colors"
                        >
                          <div>
                            <p className="font-semibold text-xs text-foreground">{prod.name}</p>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 font-mono">
                              <span>SKU: {prod.sku}</span>
                              <span>•</span>
                              <span>Est. Cost: ₹{(prod.costPrice || prod.sellingPrice * 0.7 || 0).toLocaleString('en-IN')}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="text-[10px]">
                              Stock: {prod.currentStock}
                            </Badge>

                            <Button
                              size="sm"
                              onClick={() => handleAddToCart(prod)}
                              className="h-7 text-xs px-2.5"
                            >
                              + Add Item
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Purchase Cart & Calculation */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="border-border/80">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    Purchase Line Items ({cart.length})
                  </CardTitle>
                  {cart.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCart([])}
                      className="text-xs text-destructive hover:bg-destructive/10"
                    >
                      Clear Cart
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground space-y-2">
                      <ShoppingBag className="h-8 w-8 mx-auto text-muted-foreground/40" />
                      <p className="text-xs">No items added. Select products on the left to add to purchase order.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/40 space-y-3">
                      {cart.map((item) => (
                        <div key={item.productId} className="pt-3 first:pt-0 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-foreground">{item.productName}</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleRemoveFromCart(item.productId)}
                              className="h-6 w-6 text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="text-[10px] text-muted-foreground">Quantity</label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleUpdateItem(item.productId, { quantity: parseFloat(e.target.value) || 1 })
                                }
                                className="h-7 text-xs font-mono"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-muted-foreground">Unit Acquisition Cost (₹)</label>
                              <Input
                                type="number"
                                min="0"
                                value={item.unitCost}
                                onChange={(e) =>
                                  handleUpdateItem(item.productId, { unitCost: parseFloat(e.target.value) || 0 })
                                }
                                className="h-7 text-xs font-mono text-right"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end text-xs font-mono font-semibold text-foreground pt-1">
                            Subtotal: ₹{(item.quantity * item.unitCost).toLocaleString('en-IN')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Financial Summary */}
                  <div className="border-t border-border/80 pt-4 space-y-2 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Discount (₹)</span>
                      <Input
                        type="number"
                        min="0"
                        value={overallDiscount}
                        onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)}
                        className="w-28 h-7 text-xs text-right font-mono"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">GST Tax Rate (%)</span>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={overallTaxRate}
                        onChange={(e) => setOverallTaxRate(parseFloat(e.target.value) || 0)}
                        className="w-28 h-7 text-xs text-right font-mono"
                      />
                    </div>

                    <div className="flex justify-between text-muted-foreground">
                      <span>Estimated GST ({overallTaxRate}%)</span>
                      <span className="font-mono">₹{taxAmount.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="border-t border-border/80 pt-2 flex justify-between font-bold text-sm text-foreground">
                      <span>Grand Total Cost</span>
                      <span className="font-mono text-primary">₹{grandTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-1/2 text-xs"
                      disabled={cart.length === 0 || createPurchaseMutation.isPending}
                      onClick={() => createPurchaseMutation.mutate(false)}
                    >
                      Save Draft
                    </Button>
                    <Button
                      size="sm"
                      className="w-1/2 text-xs font-semibold"
                      disabled={cart.length === 0 || createPurchaseMutation.isPending}
                      onClick={() => createPurchaseMutation.mutate(true)}
                    >
                      {createPurchaseMutation.isPending ? 'Confirming...' : 'Confirm & Stock IN'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
