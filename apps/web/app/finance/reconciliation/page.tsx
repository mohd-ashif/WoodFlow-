'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '../../../components/layout/AppShell';
import { financeService } from '../../../services/financeService';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import toast from '../../../components/ui/Toast';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Scale,
  Wrench,
  Loader2,
  FileCheck2,
  Building2,
  ShoppingBag,
  Truck,
  Database,
} from 'lucide-react';

export default function FinancialReconciliationPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'health' | 'accounts' | 'sales' | 'purchases' | 'orphans'>('health');

  // ─── Data Queries ─────────────────────────────────────────────────────────
  const { data: healthData, isLoading: isHealthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['financial-health-check'],
    queryFn: async () => {
      const res = await financeService.getHealthCheck();
      return res.data;
    },
  });

  const { data: accountsRec, isLoading: isAccountsLoading, refetch: refetchAccounts } = useQuery({
    queryKey: ['reconciliation-accounts'],
    queryFn: async () => {
      const res = await financeService.reconcileAccounts();
      return res.data;
    },
  });

  const { data: salesRec, isLoading: isSalesLoading, refetch: refetchSales } = useQuery({
    queryKey: ['reconciliation-sales'],
    queryFn: async () => {
      const res = await financeService.reconcileSales();
      return res.data;
    },
  });

  const { data: purchasesRec, isLoading: isPurchasesLoading, refetch: refetchPurchases } = useQuery({
    queryKey: ['reconciliation-purchases'],
    queryFn: async () => {
      const res = await financeService.reconcilePurchases();
      return res.data;
    },
  });

  const { data: orphansRec, isLoading: isOrphansLoading, refetch: refetchOrphans } = useQuery({
    queryKey: ['reconciliation-orphans'],
    queryFn: async () => {
      const res = await financeService.auditOrphans();
      return res.data;
    },
  });

  // ─── Controlled Resync Mutations ──────────────────────────────────────────
  const fixAccountMutation = useMutation({
    mutationFn: (id: string) => financeService.fixAccountBalance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['financial-health-check'] });
      queryClient.invalidateQueries({ queryKey: ['payment-accounts'] });
      toast.success('Account balance resynced to transaction ledger');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to resync account balance');
    },
  });

  const fixSaleMutation = useMutation({
    mutationFn: (id: string) => financeService.fixSalePaymentStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-sales'] });
      queryClient.invalidateQueries({ queryKey: ['financial-health-check'] });
      toast.success('Sale payment status & outstanding balance updated');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to resync sale status');
    },
  });

  const fixPurchaseMutation = useMutation({
    mutationFn: (id: string) => financeService.fixPurchasePaymentStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-purchases'] });
      queryClient.invalidateQueries({ queryKey: ['financial-health-check'] });
      toast.success('Purchase payment status & outstanding balance updated');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to resync purchase status');
    },
  });

  const formatCurrency = (val: number = 0) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const getHealthBadge = (status?: string) => {
    switch (status) {
      case 'GREEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="h-4 w-4" /> Perfect Integrity (GREEN)
          </span>
        );
      case 'YELLOW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <AlertTriangle className="h-4 w-4" /> Minor Review Required (YELLOW)
          </span>
        );
      case 'RED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <XCircle className="h-4 w-4" /> Action Required (RED)
          </span>
        );
      default:
        return null;
    }
  };

  const handleRefreshAll = () => {
    refetchHealth();
    refetchAccounts();
    refetchSales();
    refetchPurchases();
    refetchOrphans();
    toast.success('Financial audit updated');
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Scale className="h-7 w-7 text-primary" /> Financial Audit & Reconciliation
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Phase 7.5 Ledger Integrity, Accounts Balance Matching & Anomaly Detection.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {getHealthBadge(healthData?.overallHealthStatus)}
            <Button variant="outline" onClick={handleRefreshAll} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Run Audit
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border space-x-4 overflow-x-auto">
          {[
            { id: 'health', label: 'Health Overview', icon: ShieldCheck },
            { id: 'accounts', label: 'Payment Accounts', icon: Building2 },
            { id: 'sales', label: 'Sales Receivables', icon: ShoppingBag },
            { id: 'purchases', label: 'Purchase Payables', icon: Truck },
            { id: 'orphans', label: 'Orphans & Duplicates', icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: HEALTH OVERVIEW */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase text-muted-foreground">Accounts Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {healthData?.accountReconciliation?.matchedCount} / {healthData?.accountReconciliation?.totalAccountsChecked} Matched
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {healthData?.accountReconciliation?.mismatchedCount === 0
                      ? '100% Account Balance Precision'
                      : `${healthData?.accountReconciliation?.mismatchedCount} account(s) mismatch`}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase text-muted-foreground">Sales Reconciled</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {healthData?.salesReconciliation?.matchedCount} / {healthData?.salesReconciliation?.totalSalesChecked} Matched
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Customer payment sums match sales</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase text-muted-foreground">Purchases Reconciled</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {healthData?.purchasesReconciliation?.matchedCount} / {healthData?.purchasesReconciliation?.totalPurchasesChecked} Matched
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Supplier payment sums match purchases</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase text-muted-foreground">Data Integrity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {healthData?.anomalyAudit?.totalOrphans} Orphans / {healthData?.anomalyAudit?.totalDuplicates} Dups
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {healthData?.anomalyAudit?.totalOrphans === 0 ? 'Zero missing financial links' : 'Orphan records detected'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <FileCheck2 className="h-5 w-5 text-primary" /> Phase 7.5 Financial System Health Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl border border-border bg-card/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Payment Account Balances Formula Audit</span>
                    <Badge variant={healthData?.accountReconciliation?.mismatchedCount === 0 ? 'success' : 'danger'}>
                      {healthData?.accountReconciliation?.mismatchedCount === 0 ? 'PASSED' : 'ACTION REQUIRED'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Customer Payment & Sale Outstanding Audit</span>
                    <Badge variant={healthData?.salesReconciliation?.mismatchedCount === 0 ? 'success' : 'warning'}>
                      {healthData?.salesReconciliation?.mismatchedCount === 0 ? 'PASSED' : 'MISMATCH DETECTED'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Supplier Payment & Purchase Payable Audit</span>
                    <Badge variant={healthData?.purchasesReconciliation?.mismatchedCount === 0 ? 'success' : 'warning'}>
                      {healthData?.purchasesReconciliation?.mismatchedCount === 0 ? 'PASSED' : 'MISMATCH DETECTED'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Orphan Financial Transactions Audit</span>
                    <Badge variant={healthData?.anomalyAudit?.totalOrphans === 0 ? 'success' : 'danger'}>
                      {healthData?.anomalyAudit?.totalOrphans === 0 ? 'CLEAN (0 ORPHANS)' : 'ORPHANS FOUND'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: PAYMENT ACCOUNTS RECONCILIATION */}
        {activeTab === 'accounts' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Payment Accounts Ledger Reconciliation</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Formula: Stored Current Balance = Opening Balance + Credits - Debits
                </p>
              </div>
              <Badge variant={accountsRec?.summary?.mismatchedCount === 0 ? 'success' : 'danger'}>
                {accountsRec?.summary?.reconciliationStatus}
              </Badge>
            </CardHeader>
            <CardContent>
              {isAccountsLoading ? (
                <div className="py-12 text-center text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Calculating transaction ledger...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Opening</TableHead>
                      <TableHead>Total Credits (+)</TableHead>
                      <TableHead>Total Debits (-)</TableHead>
                      <TableHead>Calculated Balance</TableHead>
                      <TableHead>Stored Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accountsRec?.accounts?.map((acc: any) => (
                      <TableRow key={acc.accountId}>
                        <TableCell className="font-semibold text-foreground">{acc.accountName}</TableCell>
                        <TableCell className="text-xs">{formatCurrency(acc.openingBalance)}</TableCell>
                        <TableCell className="text-xs text-emerald-500 font-medium">+{formatCurrency(acc.totalCredits)}</TableCell>
                        <TableCell className="text-xs text-rose-500 font-medium">-{formatCurrency(acc.totalDebits)}</TableCell>
                        <TableCell className="text-xs font-bold text-foreground">{formatCurrency(acc.calculatedBalance)}</TableCell>
                        <TableCell className="text-xs font-bold text-foreground">{formatCurrency(acc.storedBalance)}</TableCell>
                        <TableCell>
                          <Badge variant={acc.status === 'MATCHED' ? 'success' : 'danger'}>{acc.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {acc.status === 'MISMATCH' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => fixAccountMutation.mutate(acc.accountId)}
                              isLoading={fixAccountMutation.isPending}
                              className="gap-1 text-xs text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
                            >
                              <Wrench className="h-3.5 w-3.5" /> Fix Balance
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 3: SALES RECEIVABLES RECONCILIATION */}
        {activeTab === 'sales' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Sales & Customer Payments Reconciliation</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Formula: Outstanding Due = Sale Total - Sum(Customer Payments)
                </p>
              </div>
              <Badge variant={salesRec?.summary?.mismatchedCount === 0 ? 'success' : 'warning'}>
                {salesRec?.summary?.reconciliationStatus}
              </Badge>
            </CardHeader>
            <CardContent>
              {isSalesLoading ? (
                <div className="py-12 text-center text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Verifying sales payment ledger...
                </div>
              ) : salesRec?.sales?.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">No sales orders found to reconcile.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sale #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Calculated Paid</TableHead>
                      <TableHead>Expected Due</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesRec?.sales?.map((sale: any) => (
                      <TableRow key={sale.saleId}>
                        <TableCell className="font-semibold">{sale.saleNumber}</TableCell>
                        <TableCell className="text-xs">{sale.customerName}</TableCell>
                        <TableCell className="text-xs font-medium">{formatCurrency(sale.totalAmount)}</TableCell>
                        <TableCell className="text-xs text-emerald-500 font-semibold">{formatCurrency(sale.expectedPaidAmount)}</TableCell>
                        <TableCell className="text-xs text-amber-500 font-semibold">{formatCurrency(sale.expectedDueAmount)}</TableCell>
                        <TableCell>
                          <Badge variant={sale.status === 'MATCHED' ? 'success' : 'warning'}>{sale.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {sale.status === 'MISMATCH' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => fixSaleMutation.mutate(sale.saleId)}
                              isLoading={fixSaleMutation.isPending}
                              className="gap-1 text-xs text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
                            >
                              <Wrench className="h-3.5 w-3.5" /> Fix Status
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 4: PURCHASES PAYABLES RECONCILIATION */}
        {activeTab === 'purchases' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Purchases & Supplier Payments Reconciliation</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Formula: Payable Outstanding = Purchase Total - Sum(Supplier Payments)
                </p>
              </div>
              <Badge variant={purchasesRec?.summary?.mismatchedCount === 0 ? 'success' : 'warning'}>
                {purchasesRec?.summary?.reconciliationStatus}
              </Badge>
            </CardHeader>
            <CardContent>
              {isPurchasesLoading ? (
                <div className="py-12 text-center text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Verifying purchase payment ledger...
                </div>
              ) : purchasesRec?.purchases?.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">No purchase orders found to reconcile.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Purchase #</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Calculated Paid</TableHead>
                      <TableHead>Expected Due</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchasesRec?.purchases?.map((p: any) => (
                      <TableRow key={p.purchaseId}>
                        <TableCell className="font-semibold">{p.purchaseNumber}</TableCell>
                        <TableCell className="text-xs">{p.supplierName}</TableCell>
                        <TableCell className="text-xs font-medium">{formatCurrency(p.totalAmount)}</TableCell>
                        <TableCell className="text-xs text-rose-500 font-semibold">{formatCurrency(p.expectedPaidAmount)}</TableCell>
                        <TableCell className="text-xs text-amber-500 font-semibold">{formatCurrency(p.expectedDueAmount)}</TableCell>
                        <TableCell>
                          <Badge variant={p.status === 'MATCHED' ? 'success' : 'warning'}>{p.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {p.status === 'MISMATCH' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => fixPurchaseMutation.mutate(p.purchaseId)}
                              isLoading={fixPurchaseMutation.isPending}
                              className="gap-1 text-xs text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
                            >
                              <Wrench className="h-3.5 w-3.5" /> Fix Status
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 5: ORPHANS & DUPLICATES AUDIT */}
        {activeTab === 'orphans' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Orphan & Duplicate Financial Record Detection</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Identifies payments, expenses, or transfers missing double-entry financial transactions.
                </p>
              </div>
              <Badge variant={orphansRec?.status === 'CLEAN' ? 'success' : 'warning'}>
                {orphansRec?.status || 'CLEAN'}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              {isOrphansLoading ? (
                <div className="py-12 text-center text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Auditing database records...
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-4 rounded-xl border border-border bg-card/40 space-y-2">
                      <h4 className="text-sm font-semibold text-foreground">Orphan Customer Payments</h4>
                      <p className="text-xs text-muted-foreground">
                        {orphansRec?.orphanCustomerPayments?.length || 0} customer payment(s) without central financial entry
                      </p>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-card/40 space-y-2">
                      <h4 className="text-sm font-semibold text-foreground">Orphan Supplier Payments</h4>
                      <p className="text-xs text-muted-foreground">
                        {orphansRec?.orphanSupplierPayments?.length || 0} supplier payment(s) without central financial entry
                      </p>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-card/40 space-y-2">
                      <h4 className="text-sm font-semibold text-foreground">Orphan Expenses</h4>
                      <p className="text-xs text-muted-foreground">
                        {orphansRec?.orphanExpenses?.length || 0} expense(s) without central financial entry
                      </p>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-card/40 space-y-2">
                      <h4 className="text-sm font-semibold text-foreground">Broken Account Transfers</h4>
                      <p className="text-xs text-muted-foreground">
                        {orphansRec?.brokenAccountTransfers?.length || 0} transfer(s) missing credit/debit legs
                      </p>
                    </div>
                  </div>

                  {orphansRec?.totalOrphans === 0 && orphansRec?.totalDuplicates === 0 ? (
                    <div className="py-8 text-center text-sm text-emerald-500 font-medium border border-dashed border-emerald-500/30 rounded-xl bg-emerald-500/5">
                      ✓ Zero orphan or duplicate financial records detected in database.
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-500 space-y-1">
                      <p className="font-bold text-sm">Data Inconsistency Detected</p>
                      <p>Review orphan records above to preserve double-entry audit accuracy.</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
