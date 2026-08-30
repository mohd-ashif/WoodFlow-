'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '../../../components/layout/AppShell';
import { analyticsService } from '../../../services/analyticsService';
import { ExportButton } from '../../../components/analytics/ExportButton';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Building2 } from 'lucide-react';

function formatCurrency(val: number) {
  return '₹' + (val || 0).toLocaleString('en-IN');
}

export default function SupplierAnalyticsPage() {
  const { data: supRes, isLoading } = useQuery({
    queryKey: ['supplier-analytics'],
    queryFn: async () => {
      return analyticsService.getSupplierAnalytics();
    },
  });

  const report = supRes?.data || supRes;
  const topSuppliers = report?.topSuppliers || [];
  const suppliersWithDue = report?.suppliersWithDue || [];
  const allSuppliers = report?.allSuppliers || [];

  return (
    <AppShell title="Supplier Analytics & Payables">
      <div className="space-y-6 pb-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/60 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              Supplier Analytics & Vendor Performance
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Top procurement vendors, order history, and outstanding supplier payables.
            </p>
          </div>

          <ExportButton reportType="suppliers" label="Export Suppliers CSV" />
        </div>

        {/* Top Suppliers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Top Procurement Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Supplier Name</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Total Purchased</TableHead>
                  <TableHead className="text-right">Total Paid</TableHead>
                  <TableHead className="text-right">Outstanding Payables</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSuppliers.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{s.supplierCode || 'N/A'}</TableCell>
                    <TableCell className="font-semibold text-foreground">{s.name}</TableCell>
                    <TableCell className="text-right font-bold">{s.purchaseCount}</TableCell>
                    <TableCell className="text-right font-bold text-foreground">{formatCurrency(s.totalPurchased)}</TableCell>
                    <TableCell className="text-right text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(s.totalPaid)}</TableCell>
                    <TableCell className="text-right font-bold text-rose-600 dark:text-rose-400">{formatCurrency(s.outstanding)}</TableCell>
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
