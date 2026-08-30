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
  ArrowDownRight,
  Plus,
  AlertCircle,
  CheckCircle,
  Loader2,
  DollarSign,
} from 'lucide-react';

export default function CustomerReceivablesPage() {
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
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

  const { data: allCustomers = [] } = useQuery({
    queryKey: ['crm-customers-list'],
    queryFn: async () => {
      try {
        const res = await crmService.getCustomers();
        return (res as any)?.data || res || [];
      } catch {
        return [];
      }
    },
  });

  const { data: receivablesResponse, isLoading } = useQuery({
    queryKey: ['customer-receivables'],
    queryFn: async () => {
      const res = await financeService.getReceivables();
      return res;
    },
  });

  const receivablesData = (receivablesResponse as any)?.data || receivablesResponse;
  const receivablesList: any[] = receivablesData?.receivables || (Array.isArray(receivablesData) ? receivablesData : []);
  const totalReceivables: number = receivablesData?.totalReceivables ?? 0;

  // Auto pre-select default account when accounts finish loading or modal opens
  useEffect(() => {
    if (isOpen && accounts.length > 0 && !paymentAccountId) {
      setPaymentAccountId(accounts[0].id);
    }
  }, [isOpen, accounts, paymentAccountId]);

  const recordPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCustomerId) {
        throw new Error('Please select a customer.');
      }
      if (!paymentAccountId) {
        throw new Error('Please select a payment account. If none exists, create one under Finance > Accounts.');
      }
      return financeService.recordCustomerPayment({
        customerId: selectedCustomerId,
        paymentAccountId,
        amount: Number(amount),
        paymentMethod,
        referenceNumber: referenceNumber || undefined,
        notes: notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-receivables'] });
      queryClient.invalidateQueries({ queryKey: ['payment-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
      setIsOpen(false);
      setSelectedCustomerId('');
      setAmount('');
      setReferenceNumber('');
      setNotes('');
      setErrorMsg(null);
      toast.success('Customer payment recorded successfully');
    },
    onError: (err: any) => {
      const msg = err?.message || 'Failed to record customer payment';
      setErrorMsg(msg);
      toast.error(msg);
    },
  });

  const formatCurrency = (val: number = 0) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  // Combine receivables customers and CRM customers so dropdown always has ALL customers
  const customerOptions = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; due: number }>();

    // Add customers with outstanding receivables
    if (Array.isArray(receivablesList)) {
      receivablesList.forEach((item: any) => {
        if (item.customer?.id) {
          map.set(item.customer.id, {
            id: item.customer.id,
            name: item.customer.name,
            due: item.outstanding || 0,
          });
        }
      });
    }

    // Add remaining CRM customers
    if (Array.isArray(allCustomers)) {
      allCustomers.forEach((cust: any) => {
        if (cust?.id && !map.has(cust.id)) {
          map.set(cust.id, {
            id: cust.id,
            name: cust.name,
            due: 0,
          });
        }
      });
    }

    return Array.from(map.values());
  }, [receivablesList, allCustomers]);

  const handleOpenCollectModal = (customerId?: string, dueAmount?: number) => {
    if (customerId) {
      setSelectedCustomerId(customerId);
    } else if (customerOptions.length > 0) {
      setSelectedCustomerId(customerOptions[0].id);
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
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Customer Receivables</h1>
            <p className="text-sm text-muted-foreground">
              Track outstanding customer dues and collect partial or full payments.
            </p>
          </div>
          <Button onClick={() => handleOpenCollectModal()} className="gap-2">
            <DollarSign className="h-4 w-4" /> Receive Payment
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Receivables Directory</CardTitle>
            <div className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              Total Outstanding: {formatCurrency(totalReceivables)}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading receivables...
              </div>
            ) : receivablesList.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">No customer receivables recorded.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Total Invoiced</TableHead>
                    <TableHead className="text-right">Total Paid</TableHead>
                    <TableHead className="text-right">Outstanding Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivablesList.map((item: any) => (
                    <TableRow key={item.customer.id}>
                      <TableCell>
                        <div className="font-semibold text-foreground">{item.customer.name}</div>
                        <div className="text-xs text-muted-foreground">{item.customer.customerCode}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.customer.phone} {item.customer.email && `• ${item.customer.email}`}
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.totalSales)}</TableCell>
                      <TableCell className="text-right text-emerald-600 dark:text-emerald-400 font-medium">
                        {formatCurrency(item.totalPaid)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-amber-600 dark:text-amber-400">
                        {formatCurrency(item.outstanding)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.outstanding > 0 ? (
                          <Button
                            size="sm"
                            onClick={() => handleOpenCollectModal(item.customer.id, item.outstanding)}
                            className="gap-1.5 text-xs"
                          >
                            <DollarSign className="h-3.5 w-3.5" /> Collect Payment
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

      {/* Receive Customer Payment Modal */}
      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Receive Customer Payment">
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
            <label className="text-xs font-semibold text-foreground">Select Customer *</label>
            <select
              required
              value={selectedCustomerId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCustomerId(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
            >
              <option value="">Choose customer...</option>
              {customerOptions.map((cust) => (
                <option key={cust.id} value={cust.id}>
                  {cust.name} {cust.due > 0 ? `(Due: ${formatCurrency(cust.due)})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Deposit to Payment Account *</label>
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
                placeholder="e.g. 10000"
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
            <label className="text-xs font-semibold text-foreground">Reference / Transaction No (Optional)</label>
            <Input
              placeholder="e.g. UPI Ref 983120 or Cheque #00123"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Notes / Remarks</label>
            <Input
              placeholder="e.g. Advance payment for sofa order"
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
