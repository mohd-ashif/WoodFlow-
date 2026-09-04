'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../../../components/layout/Navbar';
import { Sidebar } from '../../../components/layout/Sidebar';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesService } from '../../../services/salesService';
import { crmService } from '../../../services/crmService';
import { fetchApi } from '../../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import Link from 'next/link';
import {
  ShoppingCart,
  Search,
  Plus,
  Trash2,
  ArrowLeft,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Package,
  Calculator,
} from 'lucide-react';

export default function CreateSalePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [billingAddress, setBillingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [overallTaxRate, setOverallTaxRate] = useState<number>(18); // Default 18% GST

  // Cart State: Array of items
  const [cart, setCart] = useState<
    Array<{
      productId: string;
      productName: string;
      sku: string;
      currentStock: number;
      unitPrice: number;
      quantity: number;
      discountAmount: number;
      taxRate: number;
    }>
  >([]);

  // Search States
  const [productSearch, setProductSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Quick Customer Creation Modal State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });
  const [customerCreateError, setCustomerCreateError] = useState('');

  // Queries
  const { data: customersData } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => crmService.getCustomers({ limit: 100 }),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-search', productSearch],
    queryFn: () => fetchApi<any[]>(`/products?search=${productSearch}&limit=20`),
  });

  const rawCustomers = (customersData as any)?.data || (Array.isArray(customersData) ? customersData : []);
  const customers = rawCustomers;

  const rawProducts = (productsData as any)?.data || (Array.isArray(productsData) ? productsData : []);
  const products = rawProducts.filter((p: any) => p.isActive);

  // Quick Create Customer Mutation
  const createCustomerMutation = useMutation({
    mutationFn: (data: any) => crmService.createCustomer(data),
    onSuccess: (res: any) => {
      const created = res?.data || res;
      setIsCustomerModalOpen(false);
      setNewCustomer({ name: '', phone: '', email: '' });
      queryClient.invalidateQueries({ queryKey: ['customers-all'] });
      if (created?.id) {
        setSelectedCustomerId(created.id);
      }
    },
    onError: (err: any) => {
      setCustomerCreateError(err.message || 'Failed to create customer');
    },
  });

  // Create Sale & Confirm Mutation
  const createSaleMutation = useMutation({
    mutationFn: async (shouldConfirm: boolean) => {
      if (cart.length === 0) {
        throw new Error('Please add at least one product to the cart');
      }

      const payload = {
        customerId: selectedCustomerId || undefined,
        billingAddress: billingAddress || undefined,
        notes: notes || undefined,
        discountAmount: overallDiscount,
        taxRate: overallTaxRate,
        items: cart.map((c) => ({
          productId: c.productId,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
          discountAmount: c.discountAmount,
          taxRate: c.taxRate,
        })),
      };

      const sale = await salesService.createSale(payload);
      const saleId = (sale as any)?.id || (sale as any)?.data?.id;

      if (shouldConfirm && saleId) {
        return salesService.confirmSale(saleId);
      }
      return sale;
    },
    onSuccess: (res: any) => {
      const saleId = res?.id || res?.data?.id;
      queryClient.invalidateQueries({ queryKey: ['sales-list'] });
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-dashboard'] });
      router.push(`/sales/${saleId}`);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to create sale');
    },
  });

  // Add Product to Cart
  const handleAddToCart = (product: any) => {
    if (product.currentStock <= 0) {
      setErrorMsg(`"${product.name}" is currently OUT OF STOCK.`);
      return;
    }

    setErrorMsg('');
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity + 1 > product.currentStock) {
          setErrorMsg(`Only ${product.currentStock} units available for "${product.name}".`);
          return prev;
        }
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
          unitPrice: product.sellingPrice,
          quantity: 1,
          discountAmount: 0,
          taxRate: 0,
        },
      ];
    });
  };

  // Update Cart Quantity
  const handleUpdateQty = (productId: string, delta: number) => {
    setErrorMsg('');
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const newQty = item.quantity + delta;
          if (newQty > item.currentStock) {
            setErrorMsg(`Only ${item.currentStock} units available in stock.`);
            return item;
          }
          if (newQty <= 0) return item;
          return { ...item, quantity: newQty };
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
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
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
              <Link href="/sales">
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground text-xs px-2">
                  <ArrowLeft className="h-4 w-4" /> Back to Sales
                </Button>
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
                New Sale & Invoice
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
            {/* Left Column: Customer & Product Selection */}
            <div className="lg:col-span-7 space-y-6">
              {/* Customer Selector */}
              <Card className="border-border/80">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Select Customer</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="gap-1.5 text-xs border-primary/20 text-primary hover:bg-primary/10"
                  >
                    <UserPlus className="h-3.5 w-3.5" /> + Quick Add Customer
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">-- Walk-in Customer (No customer account) --</option>
                    {customers.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone}) {c.customerCode ? `[${c.customerCode}]` : ''}
                      </option>
                    ))}
                  </select>
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
                              <span>Price: ₹{prod.sellingPrice.toLocaleString('en-IN')}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Badge
                              variant={prod.currentStock > 0 ? 'default' : 'destructive'}
                              className="text-[10px]"
                            >
                              Stock: {prod.currentStock}
                            </Badge>

                            <Button
                              size="sm"
                              disabled={prod.currentStock <= 0}
                              onClick={() => handleAddToCart(prod)}
                              className="h-7 text-xs px-2.5"
                            >
                              + Add to Cart
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Cart & Summary */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="border-border/80">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    Sale Items Cart ({cart.length})
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
                      <ShoppingCart className="h-8 w-8 mx-auto text-muted-foreground/40" />
                      <p className="text-xs">Your cart is empty. Select products on the left.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/40 space-y-3">
                      {cart.map((item) => (
                        <div key={item.productId} className="pt-3 first:pt-0 space-y-1.5">
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

                          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0 text-xs"
                                onClick={() => handleUpdateQty(item.productId, -1)}
                              >
                                -
                              </Button>
                              <span className="text-foreground font-semibold px-1">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0 text-xs"
                                onClick={() => handleUpdateQty(item.productId, 1)}
                              >
                                +
                              </Button>
                              <span className="text-[11px] text-muted-foreground">× ₹{item.unitPrice}</span>
                            </div>

                            <span className="font-semibold text-foreground">
                              ₹{(item.quantity * item.unitPrice).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Calculations */}
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
                      <span>Grand Total</span>
                      <span className="font-mono text-primary">₹{grandTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-1/2 text-xs"
                      disabled={cart.length === 0 || createSaleMutation.isPending}
                      onClick={() => createSaleMutation.mutate(false)}
                    >
                      Save Draft
                    </Button>
                    <Button
                      size="sm"
                      className="w-1/2 text-xs font-semibold"
                      disabled={cart.length === 0 || createSaleMutation.isPending}
                      onClick={() => createSaleMutation.mutate(true)}
                    >
                      {createSaleMutation.isPending ? 'Confirming...' : 'Confirm & Issue Invoice'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick Add Customer Modal */}
          {isCustomerModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
              <Card className="w-full max-w-md shadow-xl border-border/80">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-primary" /> + Quick Add Customer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {customerCreateError && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs">
                      {customerCreateError}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-medium">Customer Name *</label>
                    <Input
                      placeholder="Full Name"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium">Primary Phone *</label>
                    <Input
                      placeholder="10-digit phone number"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium">Email Address</label>
                    <Input
                      placeholder="customer@email.com"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                      className="text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsCustomerModalOpen(false);
                        setCustomerCreateError('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={!newCustomer.name || !newCustomer.phone || createCustomerMutation.isPending}
                      onClick={() => createCustomerMutation.mutate(newCustomer)}
                    >
                      {createCustomerMutation.isPending ? 'Creating...' : 'Create & Select'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
