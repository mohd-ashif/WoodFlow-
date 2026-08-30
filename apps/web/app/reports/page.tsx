'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '../../components/layout/AppShell';
import { analyticsService } from '../../services/analyticsService';
import { DateRangeFilter, PresetOption } from '../../components/analytics/DateRangeFilter';
import { MetricCard } from '../../components/analytics/MetricCard';
import { InsightCard } from '../../components/analytics/InsightCard';
import { ExportButton } from '../../components/analytics/ExportButton';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  BarChart3,
  TrendingUp,
  ShoppingCart,
  ShoppingBag,
  Receipt,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
  Package,
  Users,
  Building2,
  Hammer,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

function formatCurrency(val: number) {
  return '₹' + (val || 0).toLocaleString('en-IN');
}

export default function BusinessOverviewReportsPage() {
  const [preset, setPreset] = useState<PresetOption>('this_month');

  const { data: overviewRes, isLoading } = useQuery({
    queryKey: ['executive-overview', preset],
    queryFn: async () => {
      return analyticsService.getExecutiveOverview({ preset });
    },
  });

  const overview = overviewRes?.data || overviewRes;
  const kpis = overview?.kpis;
  const topProducts = overview?.topProducts || [];
  const insights = overview?.insights || [];

  return (
    <AppShell title="Executive Business Dashboard">
      <div className="space-y-6 pb-12">
        {/* Header Bar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/60 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Business Overview & Analytics
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Real-time operational KPIs, sales performance, cash flow, and automated business insights.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <DateRangeFilter value={preset} onChange={(p) => setPreset(p)} />
            <ExportButton reportType="sales" preset={preset} label="Export Sales CSV" />
          </div>
        </div>

        {/* Top Navigation Shortcuts to Sub-Reports */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {[
            { label: 'Sales', href: '/reports/sales', icon: ShoppingCart },
            { label: 'Inventory', href: '/reports/inventory', icon: Package },
            { label: 'Purchases', href: '/reports/purchases', icon: ShoppingBag },
            { label: 'Customers', href: '/reports/customers', icon: Users },
            { label: 'Suppliers', href: '/reports/suppliers', icon: Building2 },
            { label: 'Cash Flow', href: '/reports/finance', icon: DollarSign },
            { label: 'Expenses', href: '/reports/expenses', icon: Receipt },
            { label: 'Production', href: '/reports/production', icon: Hammer },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href}>
                <div className="rounded-xl border border-border/60 bg-card/60 p-3 hover:bg-primary/5 hover:border-primary/30 transition-all flex flex-col items-center justify-center text-center gap-1.5 group cursor-pointer">
                  <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-xs font-semibold text-foreground group-hover:text-primary">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Executive KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Sales Revenue"
            value={formatCurrency(kpis?.totalSales?.current || 0)}
            comparison={kpis?.totalSales?.comparison}
            icon={ShoppingCart}
            variant="default"
          />
          <MetricCard
            title="Total Purchase Expenditure"
            value={formatCurrency(kpis?.totalPurchases?.current || 0)}
            comparison={kpis?.totalPurchases?.comparison}
            icon={ShoppingBag}
            variant="default"
          />
          <MetricCard
            title="Business Expenses"
            value={formatCurrency(kpis?.totalExpenses?.current || 0)}
            comparison={kpis?.totalExpenses?.comparison}
            icon={Receipt}
            variant="default"
          />
          <MetricCard
            title="Net Cash Flow"
            value={formatCurrency(kpis?.netCashFlow || 0)}
            subtitle={`In: ${formatCurrency(kpis?.totalMoneyReceived || 0)} | Out: ${formatCurrency(kpis?.totalMoneyPaid || 0)}`}
            icon={DollarSign}
            variant={(kpis?.netCashFlow || 0) >= 0 ? 'success' : 'danger'}
          />
          <MetricCard
            title="Customer Receivables"
            value={formatCurrency(kpis?.outstandingReceivables || 0)}
            subtitle="Money pending from customers"
            icon={ArrowDownRight}
            variant="warning"
          />
          <MetricCard
            title="Supplier Payables"
            value={formatCurrency(kpis?.outstandingPayables || 0)}
            subtitle="Money owed to suppliers"
            icon={ArrowUpRight}
            variant="danger"
          />
          <MetricCard
            title="Inventory Valuation"
            value={formatCurrency(kpis?.inventoryValuation || 0)}
            subtitle="Cost value of active stock"
            icon={Package}
            variant="default"
          />
          <MetricCard
            title="Available Liquid Cash"
            value={formatCurrency(kpis?.totalLiquidCash || 0)}
            subtitle="Total balance across accounts"
            icon={DollarSign}
            variant="success"
          />
        </div>

        {/* Automated Business Insights Engine Section */}
        {insights.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Automated Business Insights</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {insights.map((insight: any) => (
                <InsightCard
                  key={insight.id}
                  priority={insight.priority}
                  title={insight.title}
                  message={insight.message}
                  actionUrl={insight.actionUrl}
                  actionLabel={insight.actionLabel}
                />
              ))}
            </div>
          </div>
        )}

        {/* Top Selling Products & Operational Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Top Selling Products
              </CardTitle>
              <Link href="/reports/sales">
                <Button variant="ghost" size="sm" className="text-xs text-primary gap-1">
                  <span>View All Sales</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">No sales recorded in this period.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty Sold</TableHead>
                      <TableHead className="text-right">Total Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.map((p: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-semibold text-foreground">{p.name}</TableCell>
                        <TableCell className="text-right">{p.quantitySold} units</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(p.totalRevenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Package className="h-4 w-4 text-amber-500" /> Inventory Quick Health
              </CardTitle>
              <Link href="/reports/inventory">
                <Button variant="ghost" size="sm" className="text-xs text-primary gap-1">
                  <span>Full Inventory Report</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border p-3 bg-secondary/20">
                  <div className="text-xs text-muted-foreground">Stock Valuation</div>
                  <div className="text-lg font-bold text-foreground mt-1">{formatCurrency(kpis?.inventoryValuation || 0)}</div>
                </div>
                <div className="rounded-xl border border-border p-3 bg-secondary/20">
                  <div className="text-xs text-muted-foreground">Liquid Account Funds</div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(kpis?.totalLiquidCash || 0)}</div>
                </div>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-foreground">Need detailed reports?</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Export complete business datasets to CSV with one click.</div>
                </div>
                <ExportButton reportType="sales" preset={preset} label="Export Sales" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
