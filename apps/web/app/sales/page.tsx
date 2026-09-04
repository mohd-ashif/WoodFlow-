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
import { ImportButton } from '../../components/import/ImportButton';
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
  Calendar,
  ChevronLeft,
  ChevronRight,
  Printer,
} from 'lucide-react';

import { DataTablePagination } from '@/components/ui/DataTablePagination';

import { useDebounce } from '../../hooks/useDebounce';
import { useSales } from '../../hooks/useSales';

export default function SalesListPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [cancelModalSale, setCancelModalSale] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const { data: responseData, isLoading, error, refetch } = useSales({
    page,
    limit,
    search: debouncedSearch,
    status: statusFilter,
    paymentStatus: paymentFilter,
  });

  const sales = (responseData as any)?.data || (Array.isArray(responseData) ? responseData : []);
  const pagination = (responseData as any)?.pagination || { page: 1, totalPages: 1, total: sales.length };

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => salesService.cancelSale(id, reason),
    onSuccess: () => {
      setCancelModalSale(null);
      setCancelReason('');
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
  });

  const confirmedSales = sales.filter((s: any) => s.status === 'CONFIRMED');
  const todayTotal = confirmedSales.reduce((acc: number, s: any) => acc + (s.totalAmount || 0), 0);
  const totalRevenue = sales.reduce((acc: number, s: any) => acc + (s.totalAmount || 0), 0);
  const totalCount = pagination.total || sales.length;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col p-6 space-y-4 overflow-hidden min-w-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                <ShoppingCart className="h-6 w-6 text-primary" />
                Sales & Orders
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage sales orders, issue invoices, and track revenue.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ImportButton
                module="SALES"
                moduleTitle="Sales"
                onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ['sales'] })}
              />
              <Link href="/sales/new">
                <Button size="sm" className="gap-2 font-semibold text-xs">
                  <Plus className="h-4 w-4" /> Create Sale
                </Button>
              </Link>
            </div>
          </div>

          {/* Metrics Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-shrink-0">
            <Card className="border-border/80 bg-card/60">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Orders</p>
                  <h3 className="text-xl font-bold mt-0.5 text-foreground">{totalCount}</h3>
                </div>
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <FileText className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/60">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Revenue</p>
                  <h3 className="text-xl font-bold mt-0.5 text-foreground font-mono">
                    ₹{totalRevenue.toLocaleString('en-IN')}
                  </h3>
                </div>
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                  <DollarSign className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/60">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Today's Sales</p>
                  <h3 className="text-xl font-bold mt-0.5 text-foreground font-mono">
                    ₹{todayTotal.toLocaleString('en-IN')}
                  </h3>
                </div>
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                  <Calendar className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search & Filter Bar */}
          <Card className="border-border/80 p-3 flex-shrink-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sale no., customer name, invoice..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto">
                {[
                  { label: 'All Status', value: '' },
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

          {/* Sales Table Card — Flex 1 to fill available resolution height */}
          <Card className="flex-1 flex flex-col min-h-0 border-border/80 overflow-hidden shadow-sm">
            <CardContent className="p-0 flex-1 flex flex-col min-h-0">
              {isLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 bg-card/60 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : sales.length === 0 ? (
                <div className="text-center py-12 space-y-3 flex-1 flex flex-col justify-center items-center">
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
                <>
                  <div className="flex-1 overflow-auto min-h-0">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 z-10 bg-secondary/95 backdrop-blur-md text-muted-foreground text-xs uppercase tracking-wider border-b border-border/60 shadow-sm">
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

                  {/* Always Visible Fixed Bottom Pagination */}
                  <div className="flex-shrink-0 border-t border-border/60">
                    <DataTablePagination
                      currentPage={page}
                      totalPages={pagination.totalPages}
                      totalItems={pagination.total}
                      limit={limit}
                      onPageChange={setPage}
                      onLimitChange={(l) => {
                        setLimit(l);
                        setPage(1);
                      }}
                      itemLabel="sales orders"
                    />
                  </div>
                </>
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
