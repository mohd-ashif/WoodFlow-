'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '../../../components/layout/AppShell';
import { analyticsService } from '../../../services/analyticsService';
import { ExportButton } from '../../../components/analytics/ExportButton';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Users, DollarSign, ArrowDownRight } from 'lucide-react';

function formatCurrency(val: number) {
  return '₹' + (val || 0).toLocaleString('en-IN');
}

export default function CustomerAnalyticsPage() {
  const { data: custRes, isLoading } = useQuery({
    queryKey: ['customer-analytics'],
    queryFn: async () => {
      return analyticsService.getCustomerAnalytics();
    },
  });

  const report = custRes?.data || custRes;
  const topCustomers = report?.topCustomers || [];
  const customersWithDue = report?.customersWithDue || [];
  const allCustomers = report?.allCustomers || [];

  return (
    <AppShell title="Customer Analytics & Receivables">
      <div className="space-y-6 pb-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/60 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Customer Analytics & Lifetime Value
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Top spending clients, order frequency, and outstanding customer receivables.
            </p>
          </div>

          <ExportButton reportType="customers" label="Export Customers CSV" />
        </div>

        {/* Top Spending Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Top 10 High-Value Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                  <TableHead className="text-right">Outstanding Dues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCustomers.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{c.customerCode || 'N/A'}</TableCell>
                    <TableCell className="font-semibold text-foreground">{c.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.phone || c.email || 'N/A'}</TableCell>
                    <TableCell className="text-right font-bold">{c.orderCount}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(c.totalSpent)}</TableCell>
                    <TableCell className="text-right font-bold text-amber-600 dark:text-amber-400">{formatCurrency(c.outstanding)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Customer Directory */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider">All Customer Accounts Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Total Purchased</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Outstanding Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allCustomers.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-semibold text-foreground">{c.name}</TableCell>
                    <TableCell className="text-right">{c.orderCount}</TableCell>
                    <TableCell className="text-right">{formatCurrency(c.totalSpent)}</TableCell>
                    <TableCell className="text-right text-emerald-600 font-medium">{formatCurrency(c.totalPaid)}</TableCell>
                    <TableCell className="text-right font-bold text-amber-600 dark:text-amber-400">{formatCurrency(c.outstanding)}</TableCell>
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
