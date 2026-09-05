'use client';

import React, { useState } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../components/providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../../services/analyticsService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Building2,
  AlertTriangle,
  Package,
  ShoppingCart,
  ShoppingBag,
  Users,
  Truck,
  Plus,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
  PieChart,
  BarChart3,
  ShieldAlert,
  ChevronRight,
  IndianRupee,
  Activity,
  CreditCard,
  Percent,
} from 'lucide-react';

/**
 * Format Indian Rupee currency with standard Indian Numbering (en-IN)
 * e.g. 845000 -> ₹ 8,45,000
 */
function formatRupee(amount: number = 0): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(Math.round(amount || 0));
  return `₹ ${formatted}`;
}

/**
 * Compact Indian Rupee notation (e.g. 8.45 L, 1.25 Cr)
 */
function formatRupeeCompact(val: number = 0): string {
  if (Math.abs(val) >= 10000000) {
    return `₹ ${(val / 10000000).toFixed(2)} Cr`;
  }
  if (Math.abs(val) >= 100000) {
    return `₹ ${(val / 100000).toFixed(2)} L`;
  }
  if (Math.abs(val) >= 1000) {
    return `₹ ${(val / 1000).toFixed(1)} k`;
  }
  return formatRupee(val);
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function OwnerDashboardPage() {
  const { user } = useAuth();
  const [preset, setPreset] = useState<string>('this_month');

  const company = user?.activeMembership?.company;
  const role = user?.activeMembership?.role;

  // Fetch real aggregated backend metrics
  const { data: rawData, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['owner-summary', preset],
    queryFn: () => analyticsService.getOwnerSummary({ preset }),
    staleTime: 60 * 1000,
  });

  const dashboardData = (rawData as any)?.data || rawData || {};

  const kpis = dashboardData.kpis || {
    sales: { current: 0, previous: 0, changePercent: 0, direction: 'NO_CHANGE' },
    purchases: { current: 0, previous: 0, changePercent: 0, direction: 'NO_CHANGE' },
    expenses: { current: 0, previous: 0, changePercent: 0, direction: 'NO_CHANGE' },
    grossProfit: { current: 0, marginPercent: 0 },
    netProfit: { current: 0, marginPercent: 0 },
    receivables: { current: 0 },
    payables: { current: 0 },
  };

  const cashAndBank = dashboardData.cashAndBank || { cashInHand: 0, bankBalance: 0, totalAvailable: 0 };
  const profitSummary = dashboardData.profitSummary || { revenue: 0, cogs: 0, grossProfit: 0, operatingExpenses: 0, netProfit: 0, grossMargin: 0, netMargin: 0 };
  const receivables = dashboardData.receivables || { total: 0, ageing: { current: 0, days1_30: 0, days31_60: 0, days60Plus: 0 }, topCustomers: [] };
  const payables = dashboardData.payables || { total: 0, ageing: { current: 0, days1_30: 0, days31_60: 0, days60Plus: 0 }, topSuppliers: [] };
  const expensesData = dashboardData.expenses || { total: 0, categories: [] };
  const inventory = dashboardData.inventory || { totalProducts: 0, totalStockValue: 0, lowStockCount: 0, outOfStockCount: 0, negativeStockCount: 0, todayMovementsCount: 0, lowStockItems: [] };
  const alerts = dashboardData.alerts || { overdueInvoicesCount: 0, overdueInvoicesAmount: 0, supplierDuesTodayCount: 0, supplierDuesTodayAmount: 0, outOfStockCount: 0, creditExceededCount: 0 };
  const recentTransactions = dashboardData.recentTransactions || [];
  const todayActivity = dashboardData.todayActivity || { salesAmount: 0, salesCount: 0, purchasesAmount: 0, purchasesCount: 0, paymentsReceived: 0, paymentsMade: 0, movementsCount: 0 };
  const paymentModeBreakdown = dashboardData.paymentModeBreakdown || [];
  const gstSummary = dashboardData.gstSummary || { outputGst: 0, inputGst: 0, netGstPayable: 0, cgst: 0, sgst: 0, igst: 0 };

  const periodOptions = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'This Week', value: 'this_week' },
    { label: 'This Month', value: 'this_month' },
    { label: 'Last Month', value: 'last_month' },
    { label: 'This Quarter', value: 'this_quarter' },
    { label: 'This Year', value: 'this_year' },
  ];

  return (
    <AppShell>
      <div className="space-y-4 sm:space-y-6">
        {/* ─── 1. COMPACT HEADER & PERIOD SELECTOR ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/60 p-4 rounded-xl border border-border/80 shadow-sm backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {getGreeting()}, {user?.name?.split(' ')[0] || 'Owner'}
              </h1>
              <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider ml-1">
                {role?.replace('_', ' ') || 'OWNER'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="font-semibold text-foreground">{company?.name || 'FurnitureOS SME'}</span>
              <span className="text-border">•</span>
              <span>Business Control Center</span>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="relative flex items-center">
              <Calendar className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <select
                value={preset}
                onChange={(e) => setPreset(e.target.value)}
                className="h-8 pl-8 pr-3 text-xs rounded-lg border border-border bg-background text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-ring transition-all cursor-pointer shadow-sm"
              >
                {periodOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-8 px-2.5 text-xs gap-1 border-border/80"
              title="Refresh Dashboard Data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* ─── 2. QUICK ACTIONS BAR ───────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0 pr-1 flex items-center gap-1">
            <Activity className="h-3.5 w-3.5 text-primary" /> Quick Actions:
          </span>
          <Link href="/sales/new" className="shrink-0">
            <Button size="sm" variant="default" className="h-7 text-xs gap-1 shadow-sm">
              <Plus className="h-3.5 w-3.5" /> New Sale
            </Button>
          </Link>
          <Link href="/purchases/new" className="shrink-0">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-border/80">
              <Plus className="h-3.5 w-3.5" /> New Purchase
            </Button>
          </Link>
          <Link href="/finance" className="shrink-0">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-border/80">
              <Plus className="h-3.5 w-3.5" /> Record Expense
            </Button>
          </Link>
          <Link href="/crm/customers" className="shrink-0">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-border/80">
              <Plus className="h-3.5 w-3.5" /> Receive Payment
            </Button>
          </Link>
          <Link href="/crm/suppliers" className="shrink-0">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-border/80">
              <Plus className="h-3.5 w-3.5" /> Make Payment
            </Button>
          </Link>
          <Link href="/inventory/products/new" className="shrink-0">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-border/80">
              <Plus className="h-3.5 w-3.5" /> Add Product
            </Button>
          </Link>
          <Link href="/inventory/movements" className="shrink-0">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-border/80">
              <Plus className="h-3.5 w-3.5" /> Stock Adjust
            </Button>
          </Link>
        </div>

        {/* ─── ERROR STATE DISPLAY ────────────────────────────────────────────────────────────── */}
        {error && (
          <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-xs font-medium text-destructive flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Unable to load latest dashboard metrics. Showing fallback records.</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => refetch()} className="h-7 text-xs border-destructive/40">
              Retry
            </Button>
          </div>
        )}

        {/* ─── 3. TOP 6 FINANCIAL KPI CARDS ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 lg:gap-4">
          {/* Sales KPI */}
          <Link href="/sales" className="block group">
            <Card className="p-3 sm:p-4 border-border/80 hover:border-primary/50 transition-all duration-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Total Sales</span>
                <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                  <ShoppingCart className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="text-base sm:text-xl font-bold tracking-tight text-foreground font-mono">
                {isLoading ? '...' : formatRupee(kpis.sales.current)}
              </div>
              <div className="flex items-center justify-between mt-1.5 text-[10px] sm:text-xs">
                <span className={`font-semibold flex items-center gap-0.5 ${kpis.sales.direction === 'DECREASE' ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {kpis.sales.direction === 'DECREASE' ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                  {kpis.sales.changePercent}%
                </span>
                <span className="text-muted-foreground truncate">vs last period</span>
              </div>
            </Card>
          </Link>

          {/* Purchases KPI */}
          <Link href="/purchases" className="block group">
            <Card className="p-3 sm:p-4 border-border/80 hover:border-primary/50 transition-all duration-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Purchases</span>
                <div className="p-1 rounded-md bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                  <ShoppingBag className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="text-base sm:text-xl font-bold tracking-tight text-foreground font-mono">
                {isLoading ? '...' : formatRupee(kpis.purchases.current)}
              </div>
              <div className="flex items-center justify-between mt-1.5 text-[10px] sm:text-xs">
                <span className="font-semibold text-amber-400 flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" /> {kpis.purchases.changePercent}%
                </span>
                <span className="text-muted-foreground truncate">vs last period</span>
              </div>
            </Card>
          </Link>

          {/* Expenses KPI */}
          <Link href="/finance" className="block group">
            <Card className="p-3 sm:p-4 border-border/80 hover:border-primary/50 transition-all duration-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Expenses</span>
                <div className="p-1 rounded-md bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20 transition-colors">
                  <CreditCard className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="text-base sm:text-xl font-bold tracking-tight text-foreground font-mono">
                {isLoading ? '...' : formatRupee(kpis.expenses.current)}
              </div>
              <div className="flex items-center justify-between mt-1.5 text-[10px] sm:text-xs">
                <span className={`font-semibold flex items-center gap-0.5 ${kpis.expenses.direction === 'DECREASE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {kpis.expenses.direction === 'DECREASE' ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                  {kpis.expenses.changePercent}%
                </span>
                <span className="text-muted-foreground truncate">vs last period</span>
              </div>
            </Card>
          </Link>

          {/* Gross Profit KPI */}
          <Link href="/reports" className="block group">
            <Card className="p-3 sm:p-4 border-border/80 hover:border-primary/50 transition-all duration-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Gross Profit</span>
                <div className="p-1 rounded-md bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20 transition-colors">
                  <Percent className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="text-base sm:text-xl font-bold tracking-tight text-foreground font-mono text-sky-400">
                {isLoading ? '...' : formatRupee(kpis.grossProfit.current)}
              </div>
              <div className="flex items-center justify-between mt-1.5 text-[10px] sm:text-xs">
                <span className="text-muted-foreground font-mono">Margin:</span>
                <span className="font-semibold text-sky-400">{kpis.grossProfit.marginPercent}%</span>
              </div>
            </Card>
          </Link>

          {/* Receivables KPI */}
          <Link href="/crm/customers" className="block group">
            <Card className="p-3 sm:p-4 border-border/80 hover:border-primary/50 transition-all duration-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Receivables</span>
                <div className="p-1 rounded-md bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                  <Users className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="text-base sm:text-xl font-bold tracking-tight text-purple-300 font-mono">
                {isLoading ? '...' : formatRupee(kpis.receivables.current)}
              </div>
              <div className="flex items-center justify-between mt-1.5 text-[10px] sm:text-xs text-muted-foreground">
                <span className="truncate">Customer dues</span>
                <ArrowUpRight className="h-3 w-3 text-purple-400 shrink-0" />
              </div>
            </Card>
          </Link>

          {/* Payables KPI */}
          <Link href="/crm/suppliers" className="block group">
            <Card className="p-3 sm:p-4 border-border/80 hover:border-primary/50 transition-all duration-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Payables</span>
                <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                  <Truck className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="text-base sm:text-xl font-bold tracking-tight text-indigo-300 font-mono">
                {isLoading ? '...' : formatRupee(kpis.payables.current)}
              </div>
              <div className="flex items-center justify-between mt-1.5 text-[10px] sm:text-xs text-muted-foreground">
                <span className="truncate">Supplier dues</span>
                <ArrowDownRight className="h-3 w-3 text-indigo-400 shrink-0" />
              </div>
            </Card>
          </Link>
        </div>

        {/* ─── 4. CASH & BANK POSITION + PROFIT SUMMARY ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Cash & Bank Position Card (7 Columns) */}
          <Card className="lg:col-span-7 border-border/80 bg-card/60 backdrop-blur-md p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border/50 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Cash & Bank Position</h3>
                    <p className="text-[11px] text-muted-foreground">Actual liquid balances across payment accounts & cash registers.</p>
                  </div>
                </div>
                <Link href="/finance">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary hover:text-primary/80">
                    Cash & Bank Ledger <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-secondary/30 border border-border/60">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <IndianRupee className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Cash in Hand</span>
                  </div>
                  <div className="text-lg font-bold text-foreground font-mono">
                    {formatRupee(cashAndBank.cashInHand)}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Counter cash & register</p>
                </div>

                <div className="p-3 rounded-xl bg-secondary/30 border border-border/60">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Building2 className="h-3.5 w-3.5 text-sky-400" />
                    <span>Bank Balance</span>
                  </div>
                  <div className="text-lg font-bold text-foreground font-mono">
                    {formatRupee(cashAndBank.bankBalance)}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Checking & current accounts</p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-1">
                    <Wallet className="h-3.5 w-3.5" />
                    <span>Total Liquid Available</span>
                  </div>
                  <div className="text-xl font-bold text-emerald-300 font-mono">
                    {formatRupee(cashAndBank.totalAvailable)}
                  </div>
                  <p className="text-[10px] text-emerald-400/80 mt-0.5">Ready working capital</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
              <span>Account balances updated in real-time.</span>
              <Link href="/finance" className="text-primary hover:underline text-[11px] font-medium">
                View Account Ledger →
              </Link>
            </div>
          </Card>

          {/* Profit Summary Card (5 Columns) */}
          <Card className="lg:col-span-5 border-border/80 bg-card/60 backdrop-blur-md p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border/50 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <PieChart className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Profit & Loss Summary</h3>
                    <p className="text-[11px] text-muted-foreground">ERP Accounting Costing Standard</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Net Margin: {profitSummary.netMargin}%
                </Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-border/30">
                  <span className="text-muted-foreground">Total Sales Revenue</span>
                  <span className="font-semibold font-mono text-foreground">{formatRupee(profitSummary.revenue)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/30">
                  <span className="text-muted-foreground">Cost of Goods Sold (COGS)</span>
                  <span className="font-mono text-rose-400">- {formatRupee(profitSummary.cogs)}</span>
                </div>
                <div className="flex justify-between items-center py-1 bg-secondary/20 px-2 rounded font-semibold">
                  <span className="text-sky-400">Gross Profit ({profitSummary.grossMargin}%)</span>
                  <span className="font-mono text-sky-400">{formatRupee(profitSummary.grossProfit)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/30">
                  <span className="text-muted-foreground">Operating Expenses</span>
                  <span className="font-mono text-amber-400">- {formatRupee(profitSummary.operatingExpenses)}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 bg-emerald-500/10 px-2.5 rounded-lg font-bold text-sm">
                  <span className="text-emerald-400">Net Profit</span>
                  <span className="font-mono text-emerald-300">{formatRupee(profitSummary.netProfit)}</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground/70 mt-3 italic">
              * Note: Gross Profit = Sales - COGS. Net Profit = Gross Profit - Operating Expenses.
            </p>
          </Card>
        </div>

        {/* ─── 5. ATTENTION REQUIRED / ALERTS + TREND BREAKDOWN ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Operational Alerts / Attention Required (6 Columns) */}
          <Card className="lg:col-span-6 border-border/80 bg-card/60 backdrop-blur-md p-4 sm:p-5">
            <div className="flex items-center justify-between pb-3 border-b border-border/50 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Attention Required Today</h3>
                  <p className="text-[11px] text-muted-foreground">Critical tasks needing immediate owner action.</p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {alerts.overdueInvoicesCount > 0 ? (
                <Link href="/crm/customers" className="block">
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/15 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-rose-300">
                          {alerts.overdueInvoicesCount} Overdue Customer Invoices
                        </p>
                        <p className="text-[10px] text-rose-300/80">
                          Total {formatRupee(alerts.overdueInvoicesAmount)} pending collection
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-rose-300 hover:text-white px-2">
                      Collect →
                    </Button>
                  </div>
                </Link>
              ) : (
                <div className="p-2.5 rounded-lg bg-secondary/30 border border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>No customer invoices currently overdue beyond credit terms.</span>
                </div>
              )}

              {alerts.supplierDuesTodayCount > 0 ? (
                <Link href="/crm/suppliers" className="block">
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-amber-300">
                          {alerts.supplierDuesTodayCount} Supplier Dues / Bills Pending
                        </p>
                        <p className="text-[10px] text-amber-300/80">
                          Total {formatRupee(alerts.supplierDuesTodayAmount)} payable
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-amber-300 hover:text-white px-2">
                      Pay →
                    </Button>
                  </div>
                </Link>
              ) : (
                <div className="p-2.5 rounded-lg bg-secondary/30 border border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>No supplier bills due today.</span>
                </div>
              )}

              {inventory.outOfStockCount > 0 ? (
                <Link href="/inventory/out-of-stock" className="block">
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/15 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Package className="h-4 w-4 text-rose-400 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-rose-300">
                          {inventory.outOfStockCount} Products Out of Stock
                        </p>
                        <p className="text-[10px] text-rose-300/80">Requires replenishment to avoid lost sales</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-rose-300 hover:text-white px-2">
                      Restock →
                    </Button>
                  </div>
                </Link>
              ) : (
                <div className="p-2.5 rounded-lg bg-secondary/30 border border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>All active products have positive stock balances.</span>
                </div>
              )}

              {alerts.creditExceededCount > 0 && (
                <Link href="/crm/customers" className="block">
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
                      <p className="text-xs font-semibold text-amber-300">
                        ⚠ {alerts.creditExceededCount} Customers Exceeded Credit Limit
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-amber-300 px-2">
                      Review →
                    </Button>
                  </div>
                </Link>
              )}
            </div>
          </Card>

          {/* Sales vs Expenses Financial Trend Breakdown (6 Columns) */}
          <Card className="lg:col-span-6 border-border/80 bg-card/60 backdrop-blur-md p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border/50 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Sales & Expense Distribution</h3>
                    <p className="text-[11px] text-muted-foreground">Comparison breakdown for selected period.</p>
                  </div>
                </div>
                <Link href="/reports">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary">
                    View Reports <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              <div className="space-y-3 pt-1">
                {/* Sales Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-foreground">Total Sales Revenue</span>
                    <span className="font-mono text-emerald-400">{formatRupee(kpis.sales.current)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-full" />
                  </div>
                </div>

                {/* Purchases Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Purchases Cost</span>
                    <span className="font-mono text-amber-400">{formatRupee(kpis.purchases.current)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${kpis.sales.current > 0 ? Math.min(100, Math.round((kpis.purchases.current / kpis.sales.current) * 100)) : 0}%` }}
                    />
                  </div>
                </div>

                {/* Expenses Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Operating Expenses</span>
                    <span className="font-mono text-rose-400">{formatRupee(kpis.expenses.current)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${kpis.sales.current > 0 ? Math.min(100, Math.round((kpis.expenses.current / kpis.sales.current) * 100)) : 0}%` }}
                    />
                  </div>
                </div>

                {/* Net Profit Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-sky-400">Net Profit Retained</span>
                    <span className="font-mono text-sky-300">{formatRupee(profitSummary.netProfit)}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full"
                      style={{ width: `${kpis.sales.current > 0 ? Math.max(0, Math.min(100, Math.round((profitSummary.netProfit / kpis.sales.current) * 100))) : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground mt-3">
              Period reporting: {preset.replace('_', ' ').toUpperCase()}
            </p>
          </Card>
        </div>

        {/* ─── 6. RECEIVABLES & PAYABLES AGEING ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Customer Receivables (6 Columns) */}
          <Card className="lg:col-span-6 border-border/80 bg-card/60 backdrop-blur-md p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border/50 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-400" /> Customer Receivables & Credit
                  </h3>
                  <p className="text-[11px] text-muted-foreground">Total Outstanding: <span className="font-bold text-purple-300 font-mono">{formatRupee(receivables.total)}</span></p>
                </div>
                <div className="flex gap-1.5">
                  <Link href="/crm/customers">
                    <Button size="sm" variant="outline" className="h-7 text-xs border-border/80">
                      View Dues
                    </Button>
                  </Link>
                  <Link href="/sales/new">
                    <Button size="sm" className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white">
                      Collect Payment
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Ageing Breakdown Bar */}
              <div className="space-y-1 mb-4">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Ageing: Current ({formatRupeeCompact(receivables.ageing.current)})</span>
                  <span>1-30d ({formatRupeeCompact(receivables.ageing.days1_30)})</span>
                  <span>31-60d ({formatRupeeCompact(receivables.ageing.days31_60)})</span>
                  <span>60+d ({formatRupeeCompact(receivables.ageing.days60Plus)})</span>
                </div>
                <div className="h-2.5 rounded-full bg-secondary flex overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${receivables.total > 0 ? (receivables.ageing.current / receivables.total) * 100 : 25}%` }} title="Current" />
                  <div className="bg-sky-500 h-full" style={{ width: `${receivables.total > 0 ? (receivables.ageing.days1_30 / receivables.total) * 100 : 25}%` }} title="1-30 Days" />
                  <div className="bg-amber-500 h-full" style={{ width: `${receivables.total > 0 ? (receivables.ageing.days31_60 / receivables.total) * 100 : 25}%` }} title="31-60 Days" />
                  <div className="bg-rose-500 h-full" style={{ width: `${receivables.total > 0 ? (receivables.ageing.days60Plus / receivables.total) * 100 : 25}%` }} title="60+ Days" />
                </div>
              </div>

              {/* Top Customers Due */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Top Outstanding Customers</p>
                {receivables.topCustomers.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2 text-center">No outstanding customer balances.</p>
                ) : (
                  receivables.topCustomers.map((cust: any) => (
                    <div key={cust.customerId} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 text-xs">
                      <div>
                        <Link href={`/crm/customers/${cust.customerId}`} className="font-semibold text-foreground hover:underline">
                          {cust.name}
                        </Link>
                        <span className="text-[10px] text-muted-foreground ml-2 font-mono">{cust.code}</span>
                        {cust.isCreditLimitExceeded && (
                          <span className="ml-2 text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                            ⚠ Credit Limit Exceeded
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-purple-300">{formatRupee(cust.outstanding)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>

          {/* Supplier Payables (6 Columns) */}
          <Card className="lg:col-span-6 border-border/80 bg-card/60 backdrop-blur-md p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border/50 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Truck className="h-4 w-4 text-indigo-400" /> Supplier Payables & Dues
                  </h3>
                  <p className="text-[11px] text-muted-foreground">Total Payable: <span className="font-bold text-indigo-300 font-mono">{formatRupee(payables.total)}</span></p>
                </div>
                <div className="flex gap-1.5">
                  <Link href="/crm/suppliers">
                    <Button size="sm" variant="outline" className="h-7 text-xs border-border/80">
                      View Payables
                    </Button>
                  </Link>
                  <Link href="/purchases/new">
                    <Button size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                      Make Payment
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Ageing Breakdown Bar */}
              <div className="space-y-1 mb-4">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Ageing: Current ({formatRupeeCompact(payables.ageing.current)})</span>
                  <span>1-30d ({formatRupeeCompact(payables.ageing.days1_30)})</span>
                  <span>31-60d ({formatRupeeCompact(payables.ageing.days31_60)})</span>
                  <span>60+d ({formatRupeeCompact(payables.ageing.days60Plus)})</span>
                </div>
                <div className="h-2.5 rounded-full bg-secondary flex overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${payables.total > 0 ? (payables.ageing.current / payables.total) * 100 : 25}%` }} title="Current" />
                  <div className="bg-sky-500 h-full" style={{ width: `${payables.total > 0 ? (payables.ageing.days1_30 / payables.total) * 100 : 25}%` }} title="1-30 Days" />
                  <div className="bg-amber-500 h-full" style={{ width: `${payables.total > 0 ? (payables.ageing.days31_60 / payables.total) * 100 : 25}%` }} title="31-60 Days" />
                  <div className="bg-rose-500 h-full" style={{ width: `${payables.total > 0 ? (payables.ageing.days60Plus / payables.total) * 100 : 25}%` }} title="60+ Days" />
                </div>
              </div>

              {/* Top Suppliers Due */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Top Suppliers Due</p>
                {payables.topSuppliers.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2 text-center">No outstanding supplier dues.</p>
                ) : (
                  payables.topSuppliers.map((supp: any) => (
                    <div key={supp.supplierId} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 text-xs">
                      <div>
                        <Link href={`/crm/suppliers/${supp.supplierId}`} className="font-semibold text-foreground hover:underline">
                          {supp.name}
                        </Link>
                        <span className="text-[10px] text-muted-foreground ml-2 font-mono">{supp.code}</span>
                      </div>
                      <span className="font-mono font-bold text-indigo-300">{formatRupee(supp.outstanding)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* ─── 7. INVENTORY HEALTH & LOW STOCK ITEMS + EXPENSE OVERVIEW ───────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Inventory Health & Reorder Table (7 Columns) */}
          <Card className="lg:col-span-7 border-border/80 bg-card/60 backdrop-blur-md p-4 sm:p-5">
            <div className="flex items-center justify-between pb-3 border-b border-border/50 mb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Package className="h-4 w-4 text-emerald-400" /> Stock Position & Reorder Alerts
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Valuation: <span className="font-bold text-foreground font-mono">{formatRupee(inventory.totalStockValue)}</span> • {inventory.totalProducts} Total Items
                </p>
              </div>
              <Link href="/inventory/low-stock">
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-border/80">
                  All Stock Alerts <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            {/* Negative stock warning banner if present */}
            {inventory.negativeStockCount > 0 && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                  <span>⚠ {inventory.negativeStockCount} products currently have negative stock balances.</span>
                </div>
                <Link href="/inventory/movements">
                  <Button size="sm" variant="outline" className="h-6 text-[10px] border-rose-500/40 text-rose-300">
                    Review Stock
                  </Button>
                </Link>
              </div>
            )}

            {/* Compact Reorder Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/50 text-[10px] uppercase text-muted-foreground">
                    <th className="py-2 px-2">Product</th>
                    <th className="py-2 px-2 font-mono">SKU</th>
                    <th className="py-2 px-2 text-right">Current</th>
                    <th className="py-2 px-2 text-right">Min Level</th>
                    <th className="py-2 px-2">Status</th>
                    <th className="py-2 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {inventory.lowStockItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-muted-foreground italic">
                        All stock levels healthy. No reorder warnings.
                      </td>
                    </tr>
                  ) : (
                    inventory.lowStockItems.map((item: any) => (
                      <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="py-2 px-2 font-medium text-foreground">{item.name}</td>
                        <td className="py-2 px-2 font-mono text-muted-foreground">{item.sku}</td>
                        <td className="py-2 px-2 font-mono text-right font-bold text-foreground">{item.currentStock}</td>
                        <td className="py-2 px-2 font-mono text-right text-muted-foreground">{item.minimumStock}</td>
                        <td className="py-2 px-2">
                          <Badge
                            variant={
                              item.status === 'NEGATIVE'
                                ? 'destructive'
                                : item.status === 'OUT_OF_STOCK'
                                ? 'danger'
                                : 'warning'
                            }
                            className="text-[9px] px-1.5 py-0"
                          >
                            {item.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-2 px-2 text-right">
                          <Link href={`/inventory/products/${item.id}`}>
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]">
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Expense Category Breakdown (5 Columns) */}
          <Card className="lg:col-span-5 border-border/80 bg-card/60 backdrop-blur-md p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border/50 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-rose-400" /> Expense Overview
                  </h3>
                  <p className="text-[11px] text-muted-foreground">Grouped by expense category</p>
                </div>
                <Link href="/finance">
                  <Button size="sm" variant="outline" className="h-7 text-xs border-border/80">
                    + Add Expense
                  </Button>
                </Link>
              </div>

              <div className="space-y-3 pt-1">
                {expensesData.categories.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-4">No recorded expenses for this period.</p>
                ) : (
                  expensesData.categories.map((cat: any) => (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-foreground font-medium">{cat.name}</span>
                        <span className="font-mono text-muted-foreground">
                          {formatRupee(cat.amount)} ({cat.percentage}%)
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${cat.percentage}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border/40 mt-3 text-right">
              <Link href="/finance" className="text-xs text-primary hover:underline font-medium">
                View Detailed Expense Report →
              </Link>
            </div>
          </Card>
        </div>

        {/* ─── 8. RECENT TRANSACTIONS + TODAY'S ACTIVITY & GST SUMMARY ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Recent Transactions Table (7 Columns) */}
          <Card className="lg:col-span-7 border-border/80 bg-card/60 backdrop-blur-md p-4 sm:p-5">
            <div className="flex items-center justify-between pb-3 border-b border-border/50 mb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-sky-400" /> Recent Business Transactions
                </h3>
                <p className="text-[11px] text-muted-foreground">Sales invoices, supplier bills, and payment vouchers</p>
              </div>
              <Link href="/sales">
                <Button size="sm" variant="ghost" className="h-7 text-xs text-primary">
                  All Sales →
                </Button>
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/50 text-[10px] uppercase text-muted-foreground">
                    <th className="py-2 px-2">Document</th>
                    <th className="py-2 px-2">Type</th>
                    <th className="py-2 px-2">Party</th>
                    <th className="py-2 px-2 text-right">Amount</th>
                    <th className="py-2 px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {recentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-muted-foreground italic">
                        No transactions found for this period.
                      </td>
                    </tr>
                  ) : (
                    recentTransactions.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="py-2 px-2 font-mono font-semibold text-foreground">
                          <Link href={tx.href} className="hover:underline">
                            {tx.docNumber}
                          </Link>
                        </td>
                        <td className="py-2 px-2">
                          <Badge variant={tx.type === 'SALE' ? 'default' : 'secondary'} className="text-[9px] px-1.5 py-0">
                            {tx.type}
                          </Badge>
                        </td>
                        <td className="py-2 px-2 text-foreground font-medium truncate max-w-[120px]">{tx.partyName}</td>
                        <td className="py-2 px-2 font-mono text-right font-bold text-foreground">{formatRupee(tx.amount)}</td>
                        <td className="py-2 px-2">
                          <Badge
                            variant={
                              tx.status === 'PAID'
                                ? 'success'
                                : tx.status === 'PARTIALLY_PAID'
                                ? 'warning'
                                : 'outline'
                            }
                            className="text-[9px] px-1.5 py-0"
                          >
                            {tx.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Today's Activity & GST Tax Summary (5 Columns) */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
            {/* Today's Activity */}
            <Card className="border-border/80 bg-card/60 backdrop-blur-md p-4 sm:p-5">
              <div className="flex items-center justify-between pb-2 border-b border-border/50 mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" /> Today's Activity
                </h3>
                <span className="text-[10px] text-muted-foreground font-mono">{new Date().toLocaleDateString('en-IN')}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-secondary/30 border border-border/40">
                  <span className="text-[10px] text-muted-foreground block">Today Sales</span>
                  <span className="font-bold font-mono text-emerald-400">{formatRupee(todayActivity.salesAmount)}</span>
                </div>
                <div className="p-2 rounded bg-secondary/30 border border-border/40">
                  <span className="text-[10px] text-muted-foreground block">Today Purchases</span>
                  <span className="font-bold font-mono text-amber-400">{formatRupee(todayActivity.purchasesAmount)}</span>
                </div>
                <div className="p-2 rounded bg-secondary/30 border border-border/40">
                  <span className="text-[10px] text-muted-foreground block">Payments Rec.</span>
                  <span className="font-bold font-mono text-purple-300">{formatRupee(todayActivity.paymentsReceived)}</span>
                </div>
                <div className="p-2 rounded bg-secondary/30 border border-border/40">
                  <span className="text-[10px] text-muted-foreground block">Stock Moves</span>
                  <span className="font-bold font-mono text-sky-400">{todayActivity.movementsCount} items</span>
                </div>
              </div>
            </Card>

            {/* Indian GST Tax Summary */}
            <Card className="border-border/80 bg-card/60 backdrop-blur-md p-4 sm:p-5">
              <div className="flex items-center justify-between pb-2 border-b border-border/50 mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-sky-400" /> Indian GST Tax Summary
                </h3>
                <Link href="/reports">
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] text-primary px-1.5">
                    GST Report →
                  </Button>
                </Link>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Output GST (Sales Tax)</span>
                  <span className="font-mono text-foreground">{formatRupee(gstSummary.outputGst)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Input GST (Purchase ITC)</span>
                  <span className="font-mono text-emerald-400">- {formatRupee(gstSummary.inputGst)}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-border/40">
                  <span className="text-sky-400">Net GST Payable</span>
                  <span className="font-mono text-sky-300">{formatRupee(gstSummary.netGstPayable)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
