'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Sidebar } from '../../components/layout/Sidebar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesService } from '../../services/salesService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import Link from 'next/link';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Eye,
  XCircle,
  TrendingUp,
  FileText,
  DollarSign,
  Clock,
  ChevronLeft,
  ChevronRight,
  Printer,
} from 'lucide-react';

export default function SalesListPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const [cancelModalSale, setCancelModalSale] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: responseData, isLoading, error, refetch } = useQuery({
    queryKey: ['sales-list', page, limit, debouncedSearch, statusFilter, paymentFilter],
    queryFn: () =>
      salesService.getSales({
        page,
        limit,
        search: debouncedSearch,
        status: statusFilter || undefined,
        paymentStatus: paymentFilter || undefined,
      }),
  });

  const rawSales = (responseData as any)?.data || (Array.isArray(responseData) ? responseData : []);
  const sales = rawSales;
  const pagination = (responseData as any)?.pagination || { page: 1, totalPages: 1, total: sales.length };

  const cancelMutation = useMutation({
    mutationFn: (payload: { id: string; reason: string }) =>
      salesService.cancelSale(payload.id, payload.reason),
    onSuccess: () => {
      setCancelModalSale(null);
      setCancelReason('');
      queryClient.invalidateQueries({ queryKey: ['sales-list'] });
    },
  });

  // Calculate top summary metrics
  const confirmedSales = sales.filter((s: any) => s.status === 'CONFIRMED');
  const todayTotal = confirmedSales.reduce((acc: number, s: any) => acc + (s.totalAmount || 0), 0);
  const totalCount = pagination.total || sales.length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                <ShoppingCart className="h-7 w-7 text-primary" />
                Sales & Orders
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage sales orders, issue invoices, and track revenue.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/sales/new">
                <Button size="sm" className="gap-2 font-semibold">
                  <Plus className="h-4 w-4" /> Create Sale
                </Button>
              </Link>
            </div>
          </div>

          {/* Metrics Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-border/80 bg-card/60">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Orders</p>
                  <h3 className="text-2xl font-bold mt-1 text-foreground">{totalCount}</h3>
                </div>
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <FileText className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/60">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Page Sales Volume</p>
                  <h3 className="text-2xl font-bold mt-1 text-emerald-500">₹{todayTotal.toLocaleString('en-IN')}</h3>
                </div>
                <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/60">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Payment Status</p>
                  <h3 className="text-xl font-bold mt-1 text-amber-500">Unpaid / Deferred</h3>
                </div>
                <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
                  <Clock className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Toolbar */}
          <Card className="border-border/80 p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sale number, invoice, customer, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 text-xs"
                />
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Filter className="h-3.5 w-3.5" /> Status:
                </div>
                {[
                  { label: 'All Statuses', value: '' },
                  { label: 'Draft', value: 'DRAFT' },
                  { label: 'Confirmed', value: 'CONFIRMED' },
                  { label: 'Cancelled', value: 'CANCELLED' },
                ].map((st) => (
                  <Button
                    key={st.value}
                    size="sm"
                    variant={statusFilter === st.value ? 'default' : 'outline'}
                    onClick={() => {
                      setStatusFilter(st.value);
                      setPage(1);
                    }}
                    className="h-8 text-xs"
                  >
                    {st.label}
                  </Button>
                ))}
              </div>
            </div>
          </Card>

          {/* Sales Table */}
          <Card className="border-border/80 overflow-hidden">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 bg-card/60 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : sales.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <ShoppingCart className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                  <p className="text-base font-semibold text-foreground">No sales recorded yet</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Create your first sale to start tracking shop revenue and issuing invoices.
                  </p>
                  <Link href="/sales/new">
                    <Button size="sm" className="mt-2">
                      + Create First Sale
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-secondary/40 text-muted-foreground text-xs uppercase tracking-wider border-b border-border/60">
                      <tr>
                        <th className="py-3 px-4">Sale No.</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4">Payment</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {sales.map((sale: any) => {
                        const invoice = sale.invoices?.[0];
                        return (
                          <tr key={sale.id} className="hover:bg-secondary/20 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-semibold text-foreground">
                              <Link href={`/sales/${sale.id}`} className="hover:underline text-primary">
                                {sale.saleNumber}
                              </Link>
                              {invoice && (
                                <p className="text-[11px] font-mono text-muted-foreground font-normal">
                                  Inv: {invoice.invoiceNumber}
                                </p>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              {sale.customer ? (
                                <div>
                                  <p className="font-semibold text-foreground text-xs">{sale.customer.name}</p>
                                  <p className="text-[11px] text-muted-foreground">{sale.customer.phone}</p>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">Walk-in Customer</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-muted-foreground">
                              {new Date(sale.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-semibold text-foreground text-sm">
                              ₹{sale.totalAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3.5 px-4">
                              <Badge
                                variant={sale.paymentStatus === 'PAID' ? 'default' : 'secondary'}
                                className="text-[10px]"
                              >
                                {sale.paymentStatus}
                              </Badge>
                            </td>
                            <td className="py-3.5 px-4">
                              <Badge
                                variant={
                                  sale.status === 'CONFIRMED'
                                    ? 'default'
                                    : sale.status === 'CANCELLED'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                                className="text-[10px]"
                              >
                                {sale.status}
                              </Badge>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link href={`/sales/${sale.id}`}>
                                  <Button size="icon" variant="ghost" className="hover:bg-primary/20 hover:text-primary transition-colors" title="View Sale">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                                {invoice && (
                                  <Link href={`/invoices/${invoice.id}`}>
                                    <Button size="icon" variant="ghost" className="hover:bg-primary/20 hover:text-primary transition-colors" title="Print Invoice">
                                      <Printer className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                )}
                                {sale.status !== 'CANCELLED' && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-destructive hover:bg-destructive/15 transition-colors"
                                    title="Cancel Sale"
                                    onClick={() => setCancelModalSale(sale)}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination footer */}
              {pagination.totalPages > 1 && (
                <div className="p-4 border-t border-border/60 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} total sales)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cancellation Confirmation Modal */}
          {cancelModalSale && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
              <Card className="w-full max-w-md border-destructive/30 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg text-destructive flex items-center gap-2">
                    <XCircle className="h-5 w-5" /> Cancel Sale #{cancelModalSale.saleNumber}?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Cancelling this sale will mark the order cancelled, restore stock quantities to inventory, and issue a stock reversal log.
                  </p>

                  <div className="space-y-1">
                    <label className="text-xs font-medium">Reason for Cancellation *</label>
                    <Input
                      placeholder="e.g. Customer changed mind, incorrect item"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCancelModalSale(null);
                        setCancelReason('');
                      }}
                    >
                      Dismiss
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={!cancelReason.trim() || cancelMutation.isPending}
                      onClick={() => cancelMutation.mutate({ id: cancelModalSale.id, reason: cancelReason })}
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
