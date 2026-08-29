'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { workOrderService } from '../../../services/workOrderService';
import { crmService } from '../../../services/crmService';
import { inventoryService } from '../../../services/inventoryService';
import { Navbar } from '../../../components/layout/Navbar';
import { Sidebar } from '../../../components/layout/Sidebar';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useToast } from '../../../components/ui/Toast';
import { Hammer, Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CreateWorkOrderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [dueDate, setDueDate] = useState('');

  // Items State
  const [items, setItems] = useState<any[]>([
    { productId: '', productNameSnapshot: '', customProductName: '', dimensions: '', specifications: '', quantity: 1, estimatedUnitCost: 0 },
  ]);

  const { data: customersData } = useQuery({
    queryKey: ['crmCustomersList'],
    queryFn: () => crmService.getCustomers(),
  });

  const { data: productsData } = useQuery({
    queryKey: ['productsListSelect'],
    queryFn: () => inventoryService.getProducts(),
  });

  const customers = Array.isArray(customersData) ? customersData : (customersData as any)?.data || [];
  const products = Array.isArray(productsData) ? productsData : (productsData as any)?.data?.products || (productsData as any)?.data || [];

  const createWoMutation = useMutation({
    mutationFn: (input: any) => workOrderService.createWorkOrder(input),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['workOrdersList'] });
      queryClient.invalidateQueries({ queryKey: ['productionDashboardStats'] });
      toast.success('Production Work Order created successfully!');
      if (res?.data?.id) {
        router.push(`/work-orders/${res.data.id}`);
      } else {
        router.push('/work-orders');
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to create Work Order');
    },
  });

  const handleAddItem = () => {
    setItems([
      ...items,
      { productId: '', productNameSnapshot: '', customProductName: '', dimensions: '', specifications: '', quantity: 1, estimatedUnitCost: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleProductSelect = (index: number, pId: string) => {
    const selected = products.find((p: any) => p.id === pId);
    const newItems = [...items];
    newItems[index].productId = pId;
    if (selected) {
      newItems[index].productNameSnapshot = selected.name;
      newItems[index].estimatedUnitCost = selected.purchasePrice || selected.sellingPrice || 0;
    }
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createWoMutation.mutate({
      title,
      description: description || undefined,
      customerId: customerId || undefined,
      priority: priority as any,
      dueDate: dueDate || undefined,
      items: items.map((i) => ({
        productId: i.productId || undefined,
        productNameSnapshot: i.productNameSnapshot || i.customProductName || 'Custom Furniture Product',
        customProductName: i.customProductName || undefined,
        dimensions: i.dimensions || undefined,
        specifications: i.specifications || undefined,
        quantity: Number(i.quantity) || 1,
        estimatedUnitCost: Number(i.estimatedUnitCost) || 0,
      })),
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 space-y-6 max-w-4xl">
          <div className="flex items-center gap-4">
            <Link href="/work-orders">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Work Orders</span>
              </Button>
            </Link>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Create Production Work Order</h2>
            <p className="text-sm text-muted-foreground">
              Define furniture manufacturing requirements, custom dimensions, products, and due date.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6 space-y-4">
              <h3 className="text-base font-bold text-foreground">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Work Order Title *</label>
                  <Input
                    value={title}
                    onChange={(e: any) => setTitle(e.target.value)}
                    placeholder="Custom Teak Wood Dining Set Production"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Customer (Optional)</label>
                    <select
                      value={customerId}
                      onChange={(e: any) => setCustomerId(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Internal / Walk-in Customer</option>
                      {customers.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.customerCode})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Priority</label>
                    <select
                      value={priority}
                      onChange={(e: any) => setPriority(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Due Date</label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e: any) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Description / Notes</label>
                  <Input
                    value={description}
                    onChange={(e: any) => setDescription(e.target.value)}
                    placeholder="Special requests, customer specifications, or finish requirements..."
                  />
                </div>
              </div>
            </Card>

            {/* Furniture Items & Custom Specs */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground">Furniture Products & Specifications</h3>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  <span>Add Item</span>
                </Button>
              </div>

              {items.map((item, index) => (
                <div key={index} className="p-4 bg-secondary/20 rounded-xl border border-border/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">Item #{index + 1}</span>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        className="text-rose-400 hover:text-rose-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Catalog Product (Optional)</label>
                      <select
                        value={item.productId}
                        onChange={(e: any) => handleProductSelect(index, e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm font-medium"
                      >
                        <option value="">Custom Furniture Item</option>
                        {products.map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Item Name / Title *</label>
                      <Input
                        value={item.productNameSnapshot || item.customProductName}
                        onChange={(e: any) => {
                          const newItems = [...items];
                          newItems[index].productNameSnapshot = e.target.value;
                          newItems[index].customProductName = e.target.value;
                          setItems(newItems);
                        }}
                        placeholder="6-Seater Dining Table"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Quantity *</label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e: any) => {
                          const newItems = [...items];
                          newItems[index].quantity = Number(e.target.value);
                          setItems(newItems);
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Dimensions (e.g. 180×90 cm)</label>
                      <Input
                        value={item.dimensions}
                        onChange={(e: any) => {
                          const newItems = [...items];
                          newItems[index].dimensions = e.target.value;
                          setItems(newItems);
                        }}
                        placeholder="180cm x 90cm x 75cm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Estimated Unit Cost (₹)</label>
                      <Input
                        type="number"
                        value={item.estimatedUnitCost}
                        onChange={(e: any) => {
                          const newItems = [...items];
                          newItems[index].estimatedUnitCost = Number(e.target.value);
                          setItems(newItems);
                        }}
                        placeholder="12000"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </Card>

            <div className="flex items-center justify-end gap-3">
              <Link href="/work-orders">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={createWoMutation.isPending} className="shadow-lg shadow-primary/20">
                {createWoMutation.isPending ? 'Creating Work Order...' : 'Create Production Order'}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
