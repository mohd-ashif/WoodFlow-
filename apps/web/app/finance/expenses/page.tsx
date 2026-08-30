'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '../../../components/layout/AppShell';
import { financeService } from '../../../services/financeService';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Input } from '../../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import toast from '../../../components/ui/Toast';
import {
  Receipt,
  Plus,
  AlertCircle,
  CheckCircle,
  Ban,
  Calendar,
  Wallet,
  Loader2,
} from 'lucide-react';

export default function ExpensesPage() {
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'OTHER'>('CASH');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expenseToVoid, setExpenseToVoid] = useState<any | null>(null);

  // ─── Data Queries ─────────────────────────────────────────────────────────
  const { data: accounts = [] } = useQuery({
    queryKey: ['payment-accounts'],
    queryFn: async () => {
      const res = await financeService.getAccounts();
      return (res as any)?.data || (Array.isArray(res) ? res : []);
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const res = await financeService.getExpenseCategories();
      return (res as any)?.data || res || [];
    },
  });

  const DEFAULT_CATEGORIES = React.useMemo(
    () => [
      { id: 'Electricity', name: 'Electricity' },
      { id: 'Shop Rent', name: 'Shop Rent' },
      { id: 'Transportation', name: 'Transportation' },
      { id: 'Fuel', name: 'Fuel' },
      { id: 'Worker Salary', name: 'Worker Salary' },
      { id: 'Maintenance', name: 'Maintenance' },
      { id: 'Marketing', name: 'Marketing' },
      { id: 'Internet & Phone', name: 'Internet & Phone' },
      { id: 'Office Supplies', name: 'Office Supplies' },
      { id: 'Miscellaneous', name: 'Miscellaneous' },
    ],
    []
  );

  const categoryOptions = React.useMemo(() => {
    const rawList = Array.isArray(categories) && categories.length > 0 ? categories : DEFAULT_CATEGORIES;
    const map = new Map<string, { id: string; name: string }>();

    rawList.forEach((cat: any) => {
      const nameStr = (cat.name || cat.id || '').trim();
      const key = nameStr.toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, {
          id: cat.id || nameStr,
          name: nameStr,
        });
      }
    });

    return Array.from(map.values());
  }, [categories, DEFAULT_CATEGORIES]);

  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['expenses-list'],
    queryFn: async () => {
      const res = await financeService.getExpenses();
      return res;
    },
  });

  // Auto pre-select default account & category when modal opens
  useEffect(() => {
    if (isOpen) {
      if (accounts.length > 0 && !paymentAccountId) {
        setPaymentAccountId(accounts[0].id);
      }
      if (categoryOptions.length > 0 && !categoryId) {
        setCategoryId(categoryOptions[0].id);
      }
    }
  }, [isOpen, accounts, categoryOptions, paymentAccountId, categoryId]);

  const handleOpenAddModal = () => {
    setTitle('');
    setAmount('');
    setDescription('');
    setReferenceNumber('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    if (accounts.length > 0) setPaymentAccountId(accounts[0].id);
    if (categoryOptions.length > 0) setCategoryId(categoryOptions[0].id);
    setErrorMsg(null);
    setIsOpen(true);
  };

  const createExpenseMutation = useMutation({
    mutationFn: async () => {
      if (!title || !title.trim()) {
        throw new Error('Please enter an expense title.');
      }
      if (!paymentAccountId) {
        throw new Error('Please select a payment account. If none exists, create one under Finance > Accounts.');
      }

      const selectedAccount = accounts.find((a: any) => a.id === paymentAccountId);
      if (selectedAccount) {
        const bal = Number(selectedAccount.currentBalance ?? selectedAccount.currentbalance ?? 0);
        const expAmount = Number(amount) || 0;
        if (expAmount > bal) {
          throw new Error(`Insufficient balance in ${selectedAccount.name} (${formatCurrency(bal)}) for expense ${formatCurrency(expAmount)}.`);
        }
      }

      return financeService.createExpense({
        title: title.trim(),
        categoryId: categoryId || undefined,
        paymentAccountId,
        amount: Number(amount),
        paymentMethod,
        referenceNumber: referenceNumber || undefined,
        description: description || undefined,
        expenseDate: expenseDate || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses-list'] });
      queryClient.invalidateQueries({ queryKey: ['payment-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
      setIsOpen(false);
      setTitle('');
      setAmount('');
      setDescription('');
      setReferenceNumber('');
      setErrorMsg(null);
      toast.success('Business expense recorded successfully');
    },
    onError: (err: any) => {
      const msg = err?.message || 'Failed to record business expense';
      setErrorMsg(msg);
      toast.error(msg);
    },
  });

  const voidExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      return financeService.voidExpense(expenseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses-list'] });
      queryClient.invalidateQueries({ queryKey: ['payment-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
      toast.success('Expense voided and balance restored');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to void expense');
    },
  });

  const formatCurrency = (val: number = 0) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Business Expenses</h1>
            <p className="text-sm text-muted-foreground">
              Track rent, electricity, transportation, wages, and operational costs.
            </p>
          </div>
          <Button onClick={handleOpenAddModal} className="gap-2">
            <Plus className="h-4 w-4" /> Add Expense
          </Button>
        </div>

        {/* Expenses Table Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Expense Log</CardTitle>
            <div className="text-sm font-semibold text-rose-600 dark:text-rose-400">
              Total Expenses: {formatCurrency(expensesData?.totalExpensesAmount)}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading expenses...
              </div>
            ) : expensesData?.data?.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">No business expenses recorded yet.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Title & Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Payment Account</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Status / Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expensesData?.data?.map((exp: any) => {
                    const isVoid = exp.status === 'VOID';
                    return (
                      <TableRow key={exp.id} className={isVoid ? 'opacity-50 line-through bg-muted/20' : ''}>
                        <TableCell className="text-xs font-medium text-muted-foreground">
                          {new Date(exp.expenseDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-foreground">{exp.title}</div>
                          {exp.description && <div className="text-xs text-muted-foreground">{exp.description}</div>}
                        </TableCell>
                        <TableCell>
                          {exp.category ? (
                            <Badge variant="outline" className="text-[10px]">
                              {exp.category.name}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-foreground">
                          {exp.paymentAccount?.name || 'Cash in Hand'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {exp.paymentMethod}
                        </TableCell>
                        <TableCell className="text-right font-bold text-rose-600 dark:text-rose-400">
                          {formatCurrency(exp.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {isVoid ? (
                            <Badge variant="destructive" className="text-[10px]">
                              VOIDED
                            </Badge>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpenseToVoid(exp)}
                              className="text-xs text-destructive hover:bg-destructive/10 gap-1"
                            >
                              <Ban className="h-3.5 w-3.5" /> Void
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Expense Modal */}
      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Record Business Expense">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createExpenseMutation.mutate();
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
            <label className="text-xs font-semibold text-foreground">Expense Title *</label>
            <Input
              required
              placeholder="e.g. Workshop Shop Rent, Diesel for Delivery Truck"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-foreground">Category</label>
              <select
                value={categoryId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoryId(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
              >
                <option value="">Select category...</option>
                {categoryOptions.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Payment Account *</label>
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-foreground">Amount (₹) *</label>
              <Input
                required
                type="number"
                min="0.01"
                step="any"
                placeholder="e.g. 2500"
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-foreground">Date</label>
              <Input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Ref / Bill No (Optional)</label>
              <Input
                placeholder="e.g. BILL-9821"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Description / Notes</label>
            <Input
              placeholder="Additional notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createExpenseMutation.isPending}>
              Record Expense
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Void Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!expenseToVoid}
        onClose={() => setExpenseToVoid(null)}
        onConfirm={() => {
          if (expenseToVoid) {
            voidExpenseMutation.mutate(expenseToVoid.id);
            setExpenseToVoid(null);
          }
        }}
        title="Void Business Expense"
        description={`Are you sure you want to void expense "${expenseToVoid?.title}"? This will reverse the transaction and restore account balance.`}
        confirmLabel="Void Expense"
        variant="danger"
        isLoading={voidExpenseMutation.isPending}
      />
    </AppShell>
  );
}
