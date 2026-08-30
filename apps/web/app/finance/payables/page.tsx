'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '../../../components/layout/AppShell';
import { financeService } from '../../../services/financeService';
import { crmService } from '../../../services/crmService';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { Input } from '../../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import toast from '../../../components/ui/Toast';
import {
  ArrowUpRight,
  Plus,
  AlertCircle,
  CheckCircle,
  Loader2,
  DollarSign,
} from 'lucide-react';

export default function SupplierPayablesPage() {
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'OTHER'>('CASH');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ─── Data Queries ─────────────────────────────────────────────────────────
  const { data: accounts = [] } = useQuery({
    queryKey: ['payment-accounts'],
    queryFn: async () => {
      const res = await financeService.getAccounts();
      return res.data || [];
    },
  });

  const { data: allSuppliers = [] } = useQuery({
    queryKey: ['crm-suppliers-list'],
    queryFn: async () => {
      try {
        const res = await crmService.getSuppliers();
        return (res as any)?.data || res || [];
      } catch {
        return [];
      }
    },
  });

  const { data: payablesResponse, isLoading } = useQuery({
    queryKey: ['supplier-payables'],
    queryFn: async () => {
      const res = await financeService.getPayables();
      return res;
    },
  });

  const payablesData = (payablesResponse as any)?.data || payablesResponse;
  const payablesList: any[] = payablesData?.payables || (Array.isArray(payablesData) ? payablesData : []);
  const totalPayables: number = payablesData?.totalPayables ?? 0;

  // Auto pre-select default account when accounts finish loading or modal opens
  useEffect(() => {
    if (isOpen && accounts.length > 0 && !paymentAccountId) {
      setPaymentAccountId(accounts[0].id);
    }
  }, [isOpen, accounts, paymentAccountId]);

  const recordPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSupplierId) {
        throw new Error('Please select a supplier.');
      }
      if (!paymentAccountId) {
        throw new Error('Please select a payment account. If none exists, create one under Finance > Accounts.');
      }
      return financeService.recordSupplierPayment({
        supplierId: selectedSupplierId,
        paymentAccountId,
        amount: Number(amount),
        paymentMethod,
        referenceNumber: referenceNumber || undefined,
        notes: notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-payables'] });
      queryClient.invalidateQueries({ queryKey: ['payment-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
      setIsOpen(false);
      setSelectedSupplierId('');
      setAmount('');
      setReferenceNumber('');
      setNotes('');
      setErrorMsg(null);
      toast.success('Supplier payment recorded successfully');
    },
    onError: (err: any) => {
      const msg = err?.message || 'Failed to record supplier payment';
      setErrorMsg(msg);
      toast.error(msg);
    },
  });

  const formatCurrency = (val: number = 0) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  // Combine payables suppliers and CRM suppliers so dropdown always has ALL suppliers
  const supplierOptions = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; due: number }>();

    if (Array.isArray(payablesList)) {
      payablesList.forEach((item: any) => {
        if (item.supplier?.id) {
          map.set(item.supplier.id, {
            id: item.supplier.id,
            name: item.supplier.name,
            due: item.outstanding || 0,
          });
        }
      });
    }

    if (Array.isArray(allSuppliers)) {
      allSuppliers.forEach((s: any) => {
        if (s?.id && !map.has(s.id)) {
          map.set(s.id, {
            id: s.id,
            name: s.name,
            due: 0,
          });
        }
      });
    }

    return Array.from(map.values());
  }, [payablesList, allSuppliers]);

  const handleOpenPayModal = (supplierId?: string, dueAmount?: number) => {
    if (supplierId) {
      setSelectedSupplierId(supplierId);
    } else if (supplierOptions.length > 0) {
      setSelectedSupplierId(supplierOptions[0].id);
    }
    if (dueAmount && dueAmount > 0) {
      setAmount(dueAmount.toString());
    } else {
      setAmount('');
    }
    if (accounts.length > 0) {
      setPaymentAccountId(accounts[0].id);
    }
    setErrorMsg(null);
    setIsOpen(true);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Supplier Payables</h1>
            <p className="text-sm text-muted-foreground">
              Manage money owed to timber, fabric, hardware & raw material suppliers.
            </p>
          </div>
          <Button onClick={() => handleOpenPayModal()} className="gap-2">
            <DollarSign className="h-4 w-4" /> Pay Supplier
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Payables Directory</CardTitle>
            <div className="text-sm font-semibold text-rose-600 dark:text-rose-400">
              Total Outstanding Payables: {formatCurrency(totalPayables)}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading payables...
              </div>
            ) : payablesList.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">No supplier payables recorded.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Total Purchased</TableHead>
                    <TableHead className="text-right">Total Paid</TableHead>
                    <TableHead className="text-right">Outstanding Payable</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payablesList.map((item: any) => (
                    <TableRow key={item.supplier.id}>
                      <TableCell>
                        <div className="font-semibold text-foreground">{item.supplier.name}</div>
                        <div className="text-xs text-muted-foreground">{item.supplier.supplierCode}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.supplier.phone} {item.supplier.email && `• ${item.supplier.email}`}
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.totalPurchases)}</TableCell>
                      <TableCell className="text-right text-emerald-600 dark:text-emerald-400 font-medium">
                        {formatCurrency(item.totalPaid)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-rose-600 dark:text-rose-400">
                        {formatCurrency(item.outstanding)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.outstanding > 0 ? (
                          <Button
                            size="sm"
                            onClick={() => handleOpenPayModal(item.supplier.id, item.outstanding)}
                            className="gap-1.5 text-xs"
                          >
                            <DollarSign className="h-3.5 w-3.5" /> Make Payment
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                            FULLY PAID
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pay Supplier Modal */}
      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Make Supplier Payment">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            recordPaymentMutation.mutate();
          }}
          className="space-y-4 pt-2"
        >
          {errorMsg && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {accounts.length === 0 && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>No payment accounts found. Please add a Cash or Bank account in <strong>Finance &gt; Accounts</strong> first.</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-foreground">Select Supplier *</label>
            <select
              required
              value={selectedSupplierId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedSupplierId(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
            >
              <option value="">Choose supplier...</option>
              {supplierOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.due > 0 ? `(Due: ${formatCurrency(s.due)})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Pay From Payment Account *</label>
            <select
              required
              value={paymentAccountId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPaymentAccountId(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
            >
              <option value="">Select account...</option>
              {accounts.map((acc: any) => {
                const bal = acc.currentBalance ?? acc.currentbalance ?? 0;
                return (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatCurrency(bal)})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-foreground">Amount (₹) *</label>
              <Input
                required
                type="number"
                min="0.01"
                step="any"
                placeholder="e.g. 15000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPaymentMethod(e.target.value as any)}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="CHEQUE">Cheque</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Reference / Cheque No (Optional)</label>
            <Input
              placeholder="e.g. NEFT-8831920 or Cheque #00451"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Notes / Remarks</label>
            <Input
              placeholder="e.g. Timber batch payment"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={recordPaymentMutation.isPending}>
              Record Payment
            </Button>
          </div>
        </form>
      </Dialog>
    </AppShell>
  );
}
