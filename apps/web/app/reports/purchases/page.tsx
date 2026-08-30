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
import { ShoppingBag, Building2 } from 'lucide-react';

function formatCurrency(val: number) {
  return '₹' + (val || 0).toLocaleString('en-IN');
}

export default function PurchaseReportPage() {
  const [preset, setPreset] = useState<PresetOption>('this_month');

  const { data: purRes, isLoading } = useQuery({
    queryKey: ['purchases-report', preset],
    queryFn: async () => {
      return analyticsService.getPurchaseReports({ preset });
    },
  });

  const report = purRes?.data || purRes;
  const summary = report?.summary;
  const supplierPurchases = report?.supplierPurchases || [];
  const purchaseList = report?.purchaseList || [];

  return (
    <AppShell title="Purchase Analytics & Supplier Reports">
      <div className="space-y-6 pb-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/60 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-primary" />
              Purchase & Raw Material Procurement Reports
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Supplier expenditure analytics, outstanding purchase bills, and procurement order logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <DateRangeFilter value={preset} onChange={(p) => setPreset(p)} />
            <ExportButton reportType="purchases" preset={preset} label="Export Purchase CSV" />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-xs text-muted-foreground uppercase font-semibold">Total Purchases</div>
              <div className="text-2xl font-bold text-foreground mt-1">{formatCurrency(summary?.totalPurchasesAmount || 0)}</div>
              <div className="text-xs text-muted-foreground mt-1">{summary?.totalOrders || 0} Purchase Bills</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-xs text-muted-foreground uppercase font-semibold">Amount Paid</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(summary?.totalPaid || 0)}</div>
              <div className="text-xs text-muted-foreground mt-1">Paid to Suppliers</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-xs text-muted-foreground uppercase font-semibold">Outstanding Payables</div>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{formatCurrency(summary?.totalOutstanding || 0)}</div>
              <div className="text-xs text-muted-foreground mt-1">Pending Bill Payments</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-xs text-muted-foreground uppercase font-semibold">Active Vendors</div>
              <div className="text-2xl font-bold text-primary mt-1">{supplierPurchases.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Procurement Suppliers</div>
            </CardContent>
          </Card>
        </div>

        {/* Supplier Procurement Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Supplier Expenditure Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {supplierPurchases.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">No supplier procurement in this period.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier Name</TableHead>
                    <TableHead className="text-right">Orders Count</TableHead>
                    <TableHead className="text-right">Total Purchased</TableHead>
                    <TableHead className="text-right">Outstanding Payables</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplierPurchases.map((s: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-semibold text-foreground">{s.supplierName}</TableCell>
                      <TableCell className="text-right">{s.count}</TableCell>
                      <TableCell className="text-right font-bold text-foreground">{formatCurrency(s.totalAmount)}</TableCell>
                      <TableCell className="text-right font-bold text-rose-600 dark:text-rose-400">{formatCurrency(s.outstanding)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Purchase Orders Log */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Purchase Orders Log</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Due</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseList.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs font-semibold">{p.purchaseNumber}</TableCell>
                    <TableCell>{p.supplierName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(p.date).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(p.totalAmount)}</TableCell>
                    <TableCell className="text-right text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(p.paidAmount)}</TableCell>
                    <TableCell className="text-right text-rose-600 dark:text-rose-400 font-semibold">{formatCurrency(p.dueAmount)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={p.paymentStatus === 'PAID' ? 'default' : p.paymentStatus === 'PARTIALLY_PAID' ? 'outline' : 'destructive'}>
                        {p.paymentStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
