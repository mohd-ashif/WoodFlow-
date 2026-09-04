'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Sidebar } from '../../components/layout/Sidebar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchasesService } from '../../services/purchasesService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import Link from 'next/link';
import { ImportButton } from '../../components/import/ImportButton';
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  Eye,
  XCircle,
  TrendingUp,
  FileText,
  Clock,
  ChevronLeft,
  ChevronRight,
  Truck,
  LayoutDashboard,
} from 'lucide-react';

import { DataTablePagination } from '@/components/ui/DataTablePagination';

import { useDebounce } from '../../hooks/useDebounce';
import { usePurchases } from '../../hooks/usePurchases';

export default function PurchasesListPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [cancelModalPurchase, setCancelModalPurchase] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const { data: responseData, isLoading } = usePurchases({
    page,
    limit,
    search: debouncedSearch,
    status: statusFilter || undefined,
  });

  const rawPurchases = (responseData as any)?.data || (Array.isArray(responseData) ? responseData : []);
  const purchases = rawPurchases;
  const pagination = (responseData as any)?.pagination || { page: 1, totalPages: 1, total: purchases.length };

  const cancelMutation = useMutation({
    mutationFn: (payload: { id: string; reason: string }) =>
      purchasesService.cancelPurchase(payload.id, payload.reason),
    onSuccess: () => {
      setCancelModalPurchase(null);
      setCancelReason('');
      queryClient.invalidateQueries({ queryKey: ['purchases-list'] });
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-dashboard'] });
    },
  });

  const confirmedPurchases = purchases.filter((p: any) => p.status === 'CONFIRMED' || p.status === 'RECEIVED');
  const pageTotal = confirmedPurchases.reduce((acc: number, p: any) => acc + (p.totalAmount || 0), 0);
  const totalCount = pagination.total || purchases.length;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex flex-1 min-h-0 w-full max-w-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 overflow-hidden min-w-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 flex-shrink-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
                Purchase Orders
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage supplier purchases, track stock acquisitions, and record Stock IN movements.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <ImportButton
                module="PURCHASES"
                moduleTitle="Purchases"
                onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ['purchases'] })}
              />
              <Link href="/purchases/overview">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                  <LayoutDashboard className="h-4 w-4" /> Overview
                </Button>
              </Link>
              <Link href="/purchases/new">
                <Button size="sm" className="gap-2 font-semibold text-xs">
                  <Plus className="h-4 w-4" /> Create PO
                </Button>
              </Link>
            </div>
          </div>

          {/* Metrics Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 flex-shrink-0">
            <Card className="border-border/80 bg-card/60">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Orders</p>
                  <h3 className="text-lg sm:text-xl font-bold mt-0.5 text-foreground">{totalCount}</h3>
                </div>
                <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/60">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Inflow Value</p>
                  <h3 className="text-lg sm:text-xl font-bold mt-0.5 text-foreground font-mono">₹{pageTotal.toLocaleString('en-IN')}</h3>
                </div>
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg shrink-0">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/60">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Active Supplier Count</p>
                  <h3 className="text-lg sm:text-xl font-bold mt-0.5 text-amber-500 font-mono">
                    {Array.from(new Set(purchases.map((p: any) => p.supplierId).filter(Boolean))).length}
                  </h3>
                </div>
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg shrink-0">
                  <ShoppingBag className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search & Filter Bar */}
          <Card className="border-border/80 p-3 flex-shrink-0 min-w-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search purchase no., reference, supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-background text-xs h-9"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1 shrink-0">
                  <Filter className="h-3.5 w-3.5" /> Filter:
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="bg-secondary/60 border border-border/80 rounded px-2.5 py-1 text-xs text-foreground focus:outline-none w-full md:w-auto"
                >
                  <option value="">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="CONFIRMED">Confirmed / Received</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Purchases Table Card — Flex 1 to fill available resolution height */}
          <Card className="flex-1 flex flex-col min-h-0 border-border/80 overflow-hidden shadow-sm">
            <CardContent className="p-0 flex-1 flex flex-col min-h-0">
              {isLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 bg-card/60 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : purchases.length === 0 ? (
                <div className="text-center py-12 space-y-3 flex-1 flex flex-col justify-center items-center">
                  <ShoppingBag className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                  <p className="text-base font-semibold text-foreground">No purchase orders recorded yet</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Create your first purchase order to track incoming inventory and update product acquisition stock.
                  </p>
                  <Link href="/purchases/new">
                    <Button size="sm" className="mt-2">
                      + Create First Purchase Order
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-auto min-h-0">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 z-10 bg-secondary/95 backdrop-blur-md text-muted-foreground text-xs uppercase tracking-wider border-b border-border/60 shadow-sm">
                        <tr>
                          <th className="py-3 px-4">Purchase No.</th>
                          <th className="py-3 px-4">Supplier</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4 text-right">Cost Total</th>
                          <th className="py-3 px-4">Payment</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {purchases.map((purchase: any) => (
                          <tr key={purchase.id} className="hover:bg-secondary/20 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-semibold text-foreground">
                              <Link href={`/purchases/${purchase.id}`} className="hover:underline text-primary">
                                {purchase.purchaseNumber}
                              </Link>
                              {purchase.referenceNumber && (
                                <p className="text-[11px] font-mono text-muted-foreground font-normal">
                                  Ref: {purchase.referenceNumber}
                                </p>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              {purchase.supplier ? (
                                <div>
                                  <p className="font-semibold text-foreground text-xs">{purchase.supplier.name}</p>
                                  <p className="text-[11px] text-muted-foreground">{purchase.supplier.phone}</p>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">Direct Purchase</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-muted-foreground">
                              {new Date(purchase.purchaseDate || purchase.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-semibold text-foreground text-sm">
                              ₹{purchase.totalAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3.5 px-4">
                              <Badge
                                variant={purchase.paymentStatus === 'PAID' ? 'default' : 'secondary'}
                                className="text-[10px]"
                              >
                                {purchase.paymentStatus}
                              </Badge>
                            </td>
                            <td className="py-3.5 px-4">
                              <Badge
                                variant={
                                  purchase.status === 'CONFIRMED' || purchase.status === 'RECEIVED'
                                    ? 'default'
                                    : purchase.status === 'CANCELLED'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                                className="text-[10px]"
                              >
                                {purchase.status}
                              </Badge>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link href={`/purchases/${purchase.id}`}>
                                  <Button size="icon" variant="ghost" className="hover:bg-primary/20 hover:text-primary transition-colors" title="View Purchase">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                                {purchase.status !== 'CANCELLED' && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-destructive hover:bg-destructive/15 transition-colors"
                                    title="Cancel Purchase"
                                    onClick={() => setCancelModalPurchase(purchase)}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
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
                      itemLabel="purchase orders"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Cancellation Confirmation Modal */}
          {cancelModalPurchase && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
              <Card className="w-full max-w-md border-destructive/30 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg text-destructive flex items-center gap-2">
                    <XCircle className="h-5 w-5" /> Cancel Purchase #{cancelModalPurchase.purchaseNumber}?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Cancelling this purchase will mark the order cancelled and reverse the stock quantities from active inventory.
                  </p>

                  <div className="space-y-1">
                    <label className="text-xs font-medium">Reason for Cancellation *</label>
                    <Input
                      placeholder="e.g. Returned to supplier, wrong order reference"
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
                        setCancelModalPurchase(null);
                        setCancelReason('');
                      }}
                    >
                      Dismiss
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={!cancelReason.trim() || cancelMutation.isPending}
                      onClick={() => cancelMutation.mutate({ id: cancelModalPurchase.id, reason: cancelReason })}
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
