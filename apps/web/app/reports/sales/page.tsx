'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '../../../components/layout/AppShell';
import { analyticsService } from '../../../services/analyticsService';
import { DateRangeFilter, PresetOption } from '../../../components/analytics/DateRangeFilter';
import { ExportButton } from '../../../components/analytics/ExportButton';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { ShoppingCart, TrendingUp, DollarSign } from 'lucide-react';

function formatCurrency(val: number) {
  return '₹' + (val || 0).toLocaleString('en-IN');
}

export default function SalesReportPage() {
  const [preset, setPreset] = useState<PresetOption>('this_month');

  const { data: salesRes, isLoading } = useQuery({
    queryKey: ['sales-report', preset],
    queryFn: async () => {
      return analyticsService.getSalesReports({ preset });
    },
  });

  const report = salesRes?.data || salesRes;
  const summary = report?.summary;
  const productSales = report?.productSales || [];
  const salesList = report?.salesList || [];

  return (
    <AppShell title="Sales Analytics & Reports">
      <div className="space-y-6 pb-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/60 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-primary" />
              Sales & Order Analytics
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Sales performance breakdown, top revenue products, and payment collection status.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <DateRangeFilter value={preset} onChange={(p) => setPreset(p)} />
            <ExportButton reportType="sales" preset={preset} label="Export Sales CSV" />
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-xs text-muted-foreground uppercase font-semibold">Total Revenue</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(summary?.totalRevenue || 0)}</div>
              <div className="text-xs text-muted-foreground mt-1">{summary?.totalOrders || 0} Total Orders</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-xs text-muted-foreground uppercase font-semibold">Average Order Value</div>
              <div className="text-2xl font-bold text-foreground mt-1">{formatCurrency(summary?.averageOrderValue || 0)}</div>
              <div className="text-xs text-muted-foreground mt-1">Per Order Average</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-xs text-muted-foreground uppercase font-semibold">Paid Amount</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{formatCurrency(summary?.totalPaid || 0)}</div>
              <div className="text-xs text-muted-foreground mt-1">{summary?.statusBreakdown?.paidCount || 0} Fully Paid Orders</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-xs text-muted-foreground uppercase font-semibold">Outstanding Dues</div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{formatCurrency(summary?.totalOutstanding || 0)}</div>
              <div className="text-xs text-muted-foreground mt-1">Pending Collections</div>
            </CardContent>
          </Card>
        </div>

        {/* Top Product Revenue Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Product Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {productSales.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">No product sales in this period.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="text-right">Units Sold</TableHead>
                    <TableHead className="text-right">Orders Count</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productSales.map((p: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-semibold text-foreground">{p.name}</TableCell>
                      <TableCell className="text-right">{p.quantity} units</TableCell>
                      <TableCell className="text-right">{p.ordersCount}</TableCell>
                      <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(p.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Sales List Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Order Transactions Log</CardTitle>
          </CardHeader>
          <CardContent>
            {salesList.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">No sales orders found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Paid Amount</TableHead>
                    <TableHead className="text-right">Due Amount</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesList.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs font-semibold">{s.saleNumber}</TableCell>
                      <TableCell>{s.customerName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(s.date).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(s.totalAmount)}</TableCell>
                      <TableCell className="text-right text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(s.paidAmount)}</TableCell>
                      <TableCell className="text-right text-amber-600 dark:text-amber-400 font-semibold">{formatCurrency(s.dueAmount)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={s.paymentStatus === 'PAID' ? 'default' : s.paymentStatus === 'PARTIALLY_PAID' ? 'outline' : 'destructive'}>
                          {s.paymentStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
