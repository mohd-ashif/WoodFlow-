'use client';

import React, { useState } from 'react';
import { Navbar } from '../../../components/layout/Navbar';
import { Sidebar } from '../../../components/layout/Sidebar';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchasesService } from '../../../services/purchasesService';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import Link from 'next/link';
import {
  ShoppingBag,
  ArrowLeft,
  XCircle,
  CheckCircle,
  Truck,
  Calendar,
  AlertTriangle,
  Package,
} from 'lucide-react';

export default function PurchaseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const purchaseId = params.id as string;

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: purchaseData, isLoading, error } = useQuery({
    queryKey: ['purchase', purchaseId],
    queryFn: () => purchasesService.getPurchaseById(purchaseId),
    enabled: Boolean(purchaseId && purchaseId !== 'undefined'),
  });

  const purchase = (purchaseData as any)?.data || purchaseData;

  const confirmMutation = useMutation({
    mutationFn: () => purchasesService.confirmPurchase(purchaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase', purchaseId] });
      queryClient.invalidateQueries({ queryKey: ['purchases-list'] });
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-dashboard'] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to confirm purchase order');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => purchasesService.cancelPurchase(purchaseId, reason),
    onSuccess: () => {
      setCancelModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['purchase', purchaseId] });
      queryClient.invalidateQueries({ queryKey: ['purchases-list'] });
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-dashboard'] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to cancel purchase order');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8 space-y-6">
            <div className="h-32 bg-card/60 animate-pulse rounded-xl" />
            <div className="h-64 bg-card/60 animate-pulse rounded-xl" />
          </main>
        </div>
      </div>
    );
  }

  if (error || !purchase) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">Purchase order not found</h2>
            <Link href="/purchases">
              <Button size="sm">Back to Purchases</Button>
            </Link>
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
        <main className="flex-1 p-8 space-y-6 max-w-5xl mx-auto w-full">
          {/* Back button */}
          <div className="flex items-center justify-between">
            <Link href="/purchases">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                <ArrowLeft className="h-4 w-4" /> Purchases
              </Button>
            </Link>

            <div className="flex items-center gap-3">
              {purchase.status === 'DRAFT' && (
                <Button
                  size="sm"
                  disabled={confirmMutation.isPending}
                  onClick={() => confirmMutation.mutate()}
                >
                  {confirmMutation.isPending ? 'Confirming...' : 'Confirm & Record Stock IN'}
                </Button>
              )}

              {purchase.status !== 'CANCELLED' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/15 gap-1.5"
                  onClick={() => setCancelModalOpen(true)}
                >
                  <XCircle className="h-4 w-4" /> Cancel Purchase
                </Button>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-xs font-medium text-destructive">
              {errorMsg}
            </div>
          )}

          {/* Header Card */}
          <Card className="border-border/80 p-6 bg-gradient-to-r from-primary/5 via-card to-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold font-mono text-foreground">{purchase.purchaseNumber}</h1>
                  <Badge
                    variant={
                      purchase.status === 'CONFIRMED' || purchase.status === 'RECEIVED'
                        ? 'default'
                        : purchase.status === 'CANCELLED'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {purchase.status}
                  </Badge>
                  <Badge variant={purchase.paymentStatus === 'PAID' ? 'default' : 'secondary'}>
                    {purchase.paymentStatus}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                  <Calendar className="h-3.5 w-3.5" /> Date:{' '}
                  {new Date(purchase.purchaseDate || purchase.createdAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                  {purchase.referenceNumber && (
                    <span className="font-mono ml-2">Ref: {purchase.referenceNumber}</span>
                  )}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-muted-foreground font-medium">Grand Total Cost</p>
                <h2 className="text-3xl font-bold text-primary font-mono mt-0.5">
                  ₹{purchase.totalAmount.toLocaleString('en-IN')}
                </h2>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Supplier Details */}
            <Card className="border-border/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-primary" /> Supplier Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-xs">
                {purchase.supplier ? (
                  <>
                    <p className="font-semibold text-sm text-foreground">{purchase.supplier.name}</p>
                    <p className="text-muted-foreground">{purchase.supplier.phone}</p>
                    {purchase.supplier.email && <p className="text-muted-foreground">{purchase.supplier.email}</p>}
                    <p className="font-mono text-muted-foreground text-[11px]">Code: {purchase.supplier.supplierCode}</p>
                  </>
                ) : (
                  <p className="text-muted-foreground italic">Direct Purchase / Walk-in</p>
                )}
              </CardContent>
            </Card>

            {/* Stock IN Status */}
            <Card className="border-border/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-primary" /> Inventory Stock IN
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-xs">
                {purchase.status === 'CONFIRMED' || purchase.status === 'RECEIVED' ? (
                  <div className="flex items-center gap-2 text-emerald-500 font-semibold">
                    <CheckCircle className="h-4 w-4" /> Stock IN Recorded
                  </div>
                ) : purchase.status === 'CANCELLED' ? (
                  <div className="flex items-center gap-2 text-destructive font-semibold">
                    <XCircle className="h-4 w-4" /> Stock Reversed / Cancelled
                  </div>
                ) : (
                  <div className="text-amber-500 font-semibold">
                    Pending Stock IN (Confirm Order to Receive)
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Created By */}
            <Card className="border-border/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5 text-primary" /> Order Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-xs">
                <p className="text-muted-foreground">
                  Created By: <span className="font-semibold text-foreground">{purchase.creator?.name || 'System Admin'}</span>
                </p>
                <p className="text-muted-foreground">
                  Created At: {new Date(purchase.createdAt).toLocaleDateString('en-IN')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Items Table */}
          <Card className="border-border/80 overflow-hidden">
            <CardHeader className="border-b border-border/60 py-3">
              <CardTitle className="text-sm font-semibold">Purchase Line Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/40 text-muted-foreground uppercase tracking-wider border-b border-border/60">
                  <tr>
                    <th className="py-3 px-4">Item Snapshot</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4 text-center">Qty Received</th>
                    <th className="py-3 px-4 text-right">Unit Cost</th>
                    <th className="py-3 px-4 text-right">Discount</th>
                    <th className="py-3 px-4 text-right">GST Rate</th>
                    <th className="py-3 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {purchase.items?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-foreground">{item.productNameSnapshot}</td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">{item.skuSnapshot}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-semibold">{item.quantity}</td>
                      <td className="py-3.5 px-4 text-right font-mono">₹{item.unitCost.toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-muted-foreground">
                        ₹{item.discountAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-muted-foreground">{item.taxRate}%</td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-foreground">
                        ₹{item.totalAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Cost Breakdown Footer */}
              <div className="p-4 border-t border-border/60 bg-secondary/10 flex flex-col items-end space-y-1.5 text-xs font-mono">
                <div className="flex justify-between w-64">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>₹{purchase.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between w-64 text-muted-foreground">
                  <span>Total Discount:</span>
                  <span>- ₹{purchase.discountAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between w-64 text-muted-foreground">
                  <span>Total Tax (GST):</span>
                  <span>+ ₹{purchase.taxAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t border-border/60 pt-2 flex justify-between w-64 text-sm font-bold text-foreground font-sans">
                  <span>Grand Total Cost:</span>
                  <span className="text-primary font-mono">₹{purchase.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cancellation Modal */}
          {cancelModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
              <Card className="w-full max-w-md border-destructive/30 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg text-destructive flex items-center gap-2">
                    <XCircle className="h-5 w-5" /> Cancel Purchase #{purchase.purchaseNumber}?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Cancelling will reverse the stock quantities from active inventory and issue a stock adjustment entry.
                  </p>

                  <div className="space-y-1">
                    <label className="text-xs font-medium">Reason for Cancellation *</label>
                    <Input
                      placeholder="e.g. Order returned to supplier"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCancelModalOpen(false)}
                    >
                      Dismiss
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={!cancelReason.trim() || cancelMutation.isPending}
                      onClick={() => cancelMutation.mutate(cancelReason)}
                    >
                      {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
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
