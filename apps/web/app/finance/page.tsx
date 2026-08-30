'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '../../components/layout/AppShell';
import { financeService } from '../../services/financeService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import Link from 'next/link';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
  DollarSign,
  CreditCard,
  Plus,
  RefreshCw,
  TrendingUp,
  ArrowRight,
  Landmark,
  Scale,
} from 'lucide-react';

export default function FinanceDashboardPage() {
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month'>('all');

  const getFilterDates = () => {
    const now = new Date();
    if (dateFilter === 'today') {
      const start = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      const end = new Date(now.setHours(23, 59, 59, 999)).toISOString();
      return { startDate: start, endDate: end };
    }
    if (dateFilter === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      return { startDate: firstDay };
    }
    return {};
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['finance-dashboard', dateFilter],
    queryFn: async () => {
      const dates = getFilterDates();
      const res = await financeService.getDashboard(dates);
      return res.data;
    },
  });

  const formatCurrency = (val: number = 0) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Finance & Cash Flow</h1>
            <p className="text-sm text-muted-foreground">
              Monitor business liquidity, customer receivables, supplier payables, and net cash flow.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-lg border border-border bg-card p-1 text-xs">
              <button
                onClick={() => setDateFilter('all')}
                className={`rounded-md px-3 py-1 font-medium transition-all ${
                  dateFilter === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setDateFilter('month')}
                className={`rounded-md px-3 py-1 font-medium transition-all ${
                  dateFilter === 'month' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setDateFilter('today')}
                className={`rounded-md px-3 py-1 font-medium transition-all ${
                  dateFilter === 'today' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Today
              </button>
            </div>
            <Link href="/finance/reconciliation">
              <Button variant="outline" size="sm" className="gap-2 text-xs border-primary/30 text-primary hover:bg-primary/10">
                <Scale className="h-4 w-4" /> Reconciliation Audit
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Liquid Cash & Bank
              </CardTitle>
              <Wallet className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {isLoading ? '...' : formatCurrency(data?.totalLiquidCash)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Available across cash & bank accounts</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Money Received
              </CardTitle>
              <ArrowDownRight className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {isLoading ? '...' : formatCurrency(data?.totalMoneyReceived)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total customer payments collected</p>
            </CardContent>
          </Card>

          <Card className="border-rose-500/20 bg-rose-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Money Paid
              </CardTitle>
              <ArrowUpRight className="h-5 w-5 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {isLoading ? '...' : formatCurrency(data?.totalMoneyPaid)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Supplier payments + Business expenses
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Net Cash Flow
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(data?.netCashFlow || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {isLoading ? '...' : formatCurrency(data?.netCashFlow)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Money In minus Money Out</p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Metric Cards (Receivables & Payables) */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Outstanding Customer Receivables</CardTitle>
                <p className="text-xs text-muted-foreground">Money customers still owe your furniture shop</p>
              </div>
              <Link href="/finance/receivables">
                <Button size="sm" variant="outline" className="gap-1 text-xs">
                  View Receivables <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {isLoading ? '...' : formatCurrency(data?.totalReceivables)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Outstanding Supplier Payables</CardTitle>
                <p className="text-xs text-muted-foreground">Money owed to raw material suppliers</p>
              </div>
              <Link href="/finance/payables">
                <Button size="sm" variant="outline" className="gap-1 text-xs">
                  View Payables <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-rose-600 dark:text-rose-400">
                {isLoading ? '...' : formatCurrency(data?.totalPayables)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accounts Overview & Recent Transactions */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Accounts List */}
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Payment Accounts</CardTitle>
              <Link href="/finance/accounts">
                <Button size="sm" variant="ghost" className="text-xs gap-1">
                  Manage <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Loading accounts...</div>
              ) : data?.accounts?.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">No accounts configured</div>
              ) : (
                data?.accounts?.map((acc: any) => (
                  <div key={acc.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                        {acc.type === 'CASH' ? <Wallet className="h-4 w-4" /> : <Landmark className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{acc.name}</p>
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {acc.type}
                        </Badge>
                      </div>
                    </div>
                    <span className="font-semibold text-foreground">{formatCurrency(acc.currentBalance)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Financial Activity Timeline */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Financial Transactions</CardTitle>
              <Link href="/finance/payments">
                <Button size="sm" variant="ghost" className="text-xs gap-1">
                  View All <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Loading activity feed...</div>
              ) : data?.recentTransactions?.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No financial transactions recorded yet.</div>
              ) : (
                <div className="space-y-3">
                  {data?.recentTransactions?.map((tx: any) => {
                    const isCredit = tx.direction === 'CREDIT';
                    return (
                      <div key={tx.id} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isCredit ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {isCredit ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{tx.description || tx.type.replace('_', ' ')}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(tx.transactionDate).toLocaleDateString()} • {tx.account?.name}
                            </p>
                          </div>
                        </div>
                        <span className={`text-sm font-bold ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
