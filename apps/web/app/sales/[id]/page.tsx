'use client';

import React, { useState } from 'react';
import { Navbar } from '../../../components/layout/Navbar';
import { Sidebar } from '../../../components/layout/Sidebar';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesService } from '../../../services/salesService';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import Link from 'next/link';
import {
  ShoppingCart,
  ArrowLeft,
  Printer,
  XCircle,
  CheckCircle,
  FileText,
  User,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

export default function SaleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const saleId = params.id as string;

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: saleData, isLoading, error } = useQuery({
    queryKey: ['sale', saleId],
    queryFn: () => salesService.getSaleById(saleId),
    enabled: Boolean(saleId && saleId !== 'undefined'),
  });

  const sale = (saleData as any)?.data || saleData;
  const invoice = sale?.invoices?.[0];

  const confirmMutation = useMutation({
    mutationFn: () => salesService.confirmSale(saleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sale', saleId] });
      queryClient.invalidateQueries({ queryKey: ['sales-list'] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to confirm sale');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => salesService.cancelSale(saleId, reason),
    onSuccess: () => {
      setCancelModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['sale', saleId] });
      queryClient.invalidateQueries({ queryKey: ['sales-list'] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to cancel sale');
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

  if (error || !sale) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">Sale record not found</h2>
            <Link href="/sales">
              <Button size="sm">Back to Sales</Button>
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
            <Link href="/sales">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                <ArrowLeft className="h-4 w-4" /> Sales
              </Button>
            </Link>

            <div className="flex items-center gap-3">
              {invoice && (
                <Link href={`/invoices/${invoice.id}`}>
                  <Button size="sm" variant="outline" className="gap-2 border-primary/30 text-primary">
                    <Printer className="h-4 w-4" /> Print Invoice ({invoice.invoiceNumber})
                  </Button>
                </Link>
              )}

              {sale.status === 'DRAFT' && (
                <Button
                  size="sm"
                  disabled={confirmMutation.isPending}
                  onClick={() => confirmMutation.mutate()}
                >
                  {confirmMutation.isPending ? 'Confirming...' : 'Confirm & Issue Invoice'}
                </Button>
              )}

              {sale.status !== 'CANCELLED' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/15 gap-1.5"
                  onClick={() => setCancelModalOpen(true)}
                >
                  <XCircle className="h-4 w-4" /> Cancel Sale
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
                  <h1 className="text-2xl font-bold font-mono text-foreground">{sale.saleNumber}</h1>
                  <Badge
                    variant={
                      sale.status === 'CONFIRMED'
                        ? 'default'
                        : sale.status === 'CANCELLED'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {sale.status}
                  </Badge>
                  <Badge variant={sale.paymentStatus === 'PAID' ? 'default' : 'secondary'}>
                    {sale.paymentStatus}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                  <Calendar className="h-3.5 w-3.5" /> Created on{' '}
                  {new Date(sale.createdAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-muted-foreground font-medium">Grand Total Amount</p>
                <h2 className="text-3xl font-bold text-primary font-mono mt-0.5">
                  ₹{sale.totalAmount.toLocaleString('en-IN')}
                </h2>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Customer Details */}
            <Card className="border-border/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" /> Customer Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-xs">
                {sale.customer ? (
                  <>
                    <p className="font-semibold text-sm text-foreground">{sale.customer.name}</p>
                    <p className="text-muted-foreground">{sale.customer.phone}</p>
                    {sale.customer.email && <p className="text-muted-foreground">{sale.customer.email}</p>}
                  </>
                ) : (
                  <p className="text-muted-foreground italic">Walk-in Customer</p>
                )}
              </CardContent>
            </Card>

            {/* Invoice Info */}
            <Card className="border-border/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary" /> Invoice Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-xs">
                {invoice ? (
                  <>
                    <p className="font-mono font-semibold text-foreground text-sm">{invoice.invoiceNumber}</p>
                    <p className="text-muted-foreground">Status: {invoice.status}</p>
                    <p className="text-muted-foreground">
                      Issued: {new Date(invoice.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground italic">Draft order — Invoice not generated yet</p>
                )}
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card className="border-border/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                  <ShoppingCart className="h-3.5 w-3.5 text-primary" /> Payment Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid Amount:</span>
                  <span className="font-semibold text-emerald-500">₹{sale.paidAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Balance:</span>
                  <span className="font-semibold text-rose-500">₹{sale.dueAmount.toLocaleString('en-IN')}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Items Table */}
          <Card className="border-border/80 overflow-hidden">
            <CardHeader className="border-b border-border/60 py-3">
              <CardTitle className="text-sm font-semibold">Sale Line Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/40 text-muted-foreground uppercase tracking-wider border-b border-border/60">
                  <tr>
                    <th className="py-3 px-4">Item Snapshot</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Unit Price</th>
                    <th className="py-3 px-4 text-right">Discount</th>
                    <th className="py-3 px-4 text-right">Tax Rate</th>
                    <th className="py-3 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {sale.items?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-foreground">{item.productNameSnapshot}</td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">{item.skuSnapshot}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-semibold">{item.quantity}</td>
                      <td className="py-3.5 px-4 text-right font-mono">₹{item.unitPrice.toLocaleString('en-IN')}</td>
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

              {/* Price Breakdown Footer */}
              <div className="p-4 border-t border-border/60 bg-secondary/10 flex flex-col items-end space-y-1.5 text-xs font-mono">
                <div className="flex justify-between w-64">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>₹{sale.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between w-64 text-muted-foreground">
                  <span>Total Discount:</span>
                  <span>- ₹{sale.discountAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between w-64 text-muted-foreground">
                  <span>Total Tax (GST):</span>
                  <span>+ ₹{sale.taxAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t border-border/60 pt-2 flex justify-between w-64 text-sm font-bold text-foreground font-sans">
                  <span>Grand Total:</span>
                  <span className="text-primary font-mono">₹{sale.totalAmount.toLocaleString('en-IN')}</span>
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
                    <XCircle className="h-5 w-5" /> Cancel Sale #{sale.saleNumber}?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Cancelling will restore the products back to active inventory stock and mark associated invoices as cancelled.
                  </p>

                  <div className="space-y-1">
                    <label className="text-xs font-medium">Reason for Cancellation *</label>
                    <Input
                      placeholder="e.g. Order cancelled by customer"
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
