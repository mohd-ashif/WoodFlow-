'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { TableCard, TableCardBody, TableCardFooter } from '../../components/ui/TableCard';
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
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { AppIcon } from '../../components/ui/AppIcon';
import { Tooltip } from '../../components/ui/Tooltip';

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
    <AppShell>
      {/* Header */}
      <PageHeader
        icon={ShoppingCart}
        title="Sales & Orders"
        description="Manage sales orders, issue invoices, and track revenue."
        actions={
          <>
            <ImportButton
              module="SALES"
              moduleTitle="Sales"
              onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ['sales'] })}
            />
            <Link href="/sales/new">
              <Button size="md" className="gap-2 font-semibold">
                <AppIcon icon={Plus} size="sm" /> Create Sale
              </Button>
            </Link>
          </>
        }
      />

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 flex-shrink-0">
        <Card className="border-border/80 bg-card/60">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Orders</p>
              <h3 className="text-lg sm:text-xl font-bold mt-0.5 text-foreground">{totalCount}</h3>
            </div>
            <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
              <AppIcon icon={FileText} size="md" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/60">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Revenue</p>
              <h3 className="text-lg sm:text-xl font-bold mt-0.5 text-foreground font-mono">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg shrink-0">
              <AppIcon icon={DollarSign} size="md" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/60">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Today's Sales</p>
              <h3 className="text-lg sm:text-xl font-bold mt-0.5 text-foreground font-mono">
                ₹{todayTotal.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg shrink-0">
              <AppIcon icon={Calendar} size="md" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <Card className="border-border/80 p-3 flex-shrink-0 min-w-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
          <SearchInput
            placeholder="Search sale no., customer name, invoice..."
            value={searchTerm}
            onChange={(val) => { setSearchTerm(val); setPage(1); }}
            onClear={() => { setSearchTerm(''); setPage(1); }}
            wrapperClassName="flex-1 max-w-md"
          />

          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
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
                className="h-8 text-xs shrink-0 whitespace-nowrap"
              >
                {st.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Sales Table Card */}
      <TableCard>
        {isLoading ? (
          <TableCardBody className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-card/60 animate-pulse rounded-lg" />
            ))}
          </TableCardBody>
        ) : sales.length === 0 ? (
          <TableCardBody className="text-center py-12 space-y-3 flex flex-col justify-center items-center">
            <ShoppingCart className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <p className="text-base font-semibold text-foreground">No sales recorded yet</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Create your first sale to start tracking shop revenue and issuing invoices.
            </p>
            <Link href="/sales/new">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Create Sale
              </Button>
            </Link>
          </TableCardBody>
        ) : (
          <>
            <TableCardBody>
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-secondary/95 backdrop-blur-md border-b border-border text-xs uppercase font-medium text-muted-foreground shadow-sm">
                  <tr>
                    <th className="py-3 px-4">Sale Order #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4 hidden sm:table-cell">Date</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                    <th className="py-3 px-4">Order Status</th>
                    <th className="py-3 px-4 hidden md:table-cell">Payment</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {sales.map((sale: any) => (
                    <tr key={sale.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-foreground">
                        <Link href={`/sales/${sale.id}`} className="hover:underline">
                          #{sale.saleNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground">
                        {sale.customer?.name || 'Walk-in Customer'}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground hidden sm:table-cell">
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-foreground">
                        ₹{(sale.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            sale.status === 'CONFIRMED'
                              ? 'default'
                              : sale.status === 'CANCELLED'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="text-[11px]"
                        >
                          {sale.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <Badge
                          variant={
                            sale.paymentStatus === 'PAID'
                              ? 'default'
                              : sale.paymentStatus === 'PARTIAL'
                              ? 'secondary'
                              : 'outline'
                          }
                          className="text-[11px]"
                        >
                          {sale.paymentStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right min-w-[120px] pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Tooltip content="View Sale">
                            <Link href={`/sales/${sale.id}`}>
                              <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/20 hover:text-primary transition-colors" aria-label={`View sale ${sale.saleNumber}`}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </Tooltip>
                          {sale.invoices?.[0] && (
                            <Tooltip content="View Invoice">
                              <Link href={`/invoices/${sale.invoices[0].id}`}>
                                <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/20 hover:text-primary transition-colors" aria-label={`View invoice for sale ${sale.saleNumber}`}>
                                  <Printer className="h-4 w-4" />
                                </Button>
                              </Link>
                            </Tooltip>
                          )}
                          {sale.status === 'CONFIRMED' && (
                            <Tooltip content="Cancel Order">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:bg-destructive/15 transition-colors"
                                aria-label={`Cancel order ${sale.saleNumber}`}
                                onClick={() => setCancelModalSale(sale)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableCardBody>

            <TableCardFooter>
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
            </TableCardFooter>
          </>
        )}
      </TableCard>

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
    </AppShell>
  );
}
