'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '../../../components/layout/AppShell';
import { analyticsService } from '../../../services/analyticsService';
import { DateRangeFilter, PresetOption } from '../../../components/analytics/DateRangeFilter';
import { ExportButton } from '../../../components/analytics/ExportButton';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Receipt, BarChart3 } from 'lucide-react';

function formatCurrency(val: number) {
  return '₹' + (val || 0).toLocaleString('en-IN');
}

export default function ExpenseReportPage() {
  const [preset, setPreset] = useState<PresetOption>('this_month');

  const { data: expRes, isLoading } = useQuery({
    queryKey: ['expenses-report', preset],
    queryFn: async () => {
      return analyticsService.getExpenseReports({ preset });
    },
  });

  const report = expRes?.data || expRes;
  const totalExpenses = report?.totalExpenses || 0;
  const categoryBreakdown = report?.categoryBreakdown || [];
  const expenseList = report?.expenseList || [];

  return (
    <AppShell title="Expense Analytics & Category Reports">
      <div className="space-y-6 pb-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/60 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Receipt className="h-6 w-6 text-primary" />
              Business Expense Analytics
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Category expense allocation, largest expenditure drivers, and transaction logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <DateRangeFilter value={preset} onChange={(p) => setPreset(p)} />
            <ExportButton reportType="expenses" preset={preset} label="Export Expenses CSV" />
          </div>
        </div>

        {/* Total Expense Header */}
        <Card className="border-rose-500/20 bg-rose-500/5">
          <CardContent className="pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Total Business Outflow
              </div>
              <div className="text-3xl font-bold text-rose-600 dark:text-rose-400 mt-1">{formatCurrency(totalExpenses)}</div>
            </div>
            <div className="text-xs text-muted-foreground">
              {categoryBreakdown.length} Expense Categories Recorded
            </div>
          </CardContent>
        </Card>

        {/* Category Allocation Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Category Outflow Percentage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">No expenses recorded in this period.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Transaction Count</TableHead>
                    <TableHead className="text-right">Percentage</TableHead>
                    <TableHead className="text-right">Total Outflow</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryBreakdown.map((c: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-semibold text-foreground">{c.categoryName}</TableCell>
                      <TableCell className="text-right">{c.count}</TableCell>
                      <TableCell className="text-right font-medium text-primary">{c.percentage}%</TableCell>
                      <TableCell className="text-right font-bold text-rose-600 dark:text-rose-400">{formatCurrency(c.amount)}</TableCell>
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
