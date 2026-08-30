'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '../../../components/layout/AppShell';
import { analyticsService } from '../../../services/analyticsService';
import { DateRangeFilter, PresetOption } from '../../../components/analytics/DateRangeFilter';
import { ExportButton } from '../../../components/analytics/ExportButton';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { DollarSign, ArrowDownRight, ArrowUpRight, CreditCard } from 'lucide-react';

function formatCurrency(val: number) {
  return '₹' + (val || 0).toLocaleString('en-IN');
}

export default function FinanceReportPage() {
  const [preset, setPreset] = useState<PresetOption>('this_month');

  const { data: finRes, isLoading } = useQuery({
    queryKey: ['finance-report', preset],
    queryFn: async () => {
      return analyticsService.getFinanceReports({ preset });
    },
  });

  const report = finRes?.data || finRes;
  const summary = report?.summary;
  const accounts = report?.accounts || [];
  const customerPaymentsList = report?.customerPaymentsList || [];
  const supplierPaymentsList = report?.supplierPaymentsList || [];
  const expensesList = report?.expensesList || [];

  return (
    <AppShell title="Financial Reports & Cash Flow Statement">
      <div className="space-y-6 pb-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/60 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary" />
              Financial & Cash Flow Reports
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Money In vs Money Out statement, liquid account balances, and cash movement logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <DateRangeFilter value={preset} onChange={(p) => setPreset(p)} />
            <ExportButton reportType="cash-flow" preset={preset} label="Export Cash Flow CSV" />
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-1">
                <ArrowDownRight className="h-3.5 w-3.5 text-emerald-500" /> Money In (Collections)
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(summary?.totalMoneyIn || 0)}</div>
              <div className="text-xs text-muted-foreground mt-1">Customer Receipts</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-1">
                <ArrowUpRight className="h-3.5 w-3.5 text-rose-500" /> Money Out (Disbursements)
              </div>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{formatCurrency(summary?.totalMoneyOut || 0)}</div>
              <div className="text-xs text-muted-foreground mt-1">Suppliers + Expenses</div>
            </CardContent>
          </Card>

          <Card className={(summary?.netCashFlow || 0) >= 0 ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'}>
            <CardContent className="pt-6">
              <div className="text-xs text-muted-foreground uppercase font-semibold">Net Cash Flow</div>
              <div className="text-2xl font-bold text-foreground mt-1">{formatCurrency(summary?.netCashFlow || 0)}</div>
              <div className="text-xs text-muted-foreground mt-1">Money In - Money Out</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5 text-primary" /> Active Accounts
              </div>
              <div className="text-2xl font-bold text-primary mt-1">{accounts.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Cash & Bank Accounts</div>
            </CardContent>
          </Card>
        </div>

        {/* Account Balances Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Active Payment Account Balances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {accounts.map((acc: any) => (
                <div key={acc.id} className="rounded-xl border border-border p-3 bg-card">
                  <div className="text-xs text-muted-foreground font-medium">{acc.name} ({acc.type})</div>
                  <div className="text-lg font-bold text-foreground mt-1">{formatCurrency(acc.currentBalance)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Receipts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Customer Money In Receipts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerPaymentsList.map((cp: any) => (
                  <TableRow key={cp.id}>
                    <TableCell className="font-semibold text-foreground">{cp.customerName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{cp.accountName}</TableCell>
                    <TableCell className="text-xs">{cp.method}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(cp.date).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(cp.amount)}</TableCell>
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
