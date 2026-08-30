'use client';

import React, { useState, useMemo } from 'react';
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
import { Tooltip } from '../../../components/ui/Tooltip';
import toast from '../../../components/ui/Toast';
import {
  Wallet,
  Landmark,
  Plus,
  ArrowLeftRight,
  History,
  AlertCircle,
  Loader2,
  Edit2,
  Trash2,
  Search,
  CreditCard,
  QrCode,
} from 'lucide-react';

export default function PaymentAccountsPage() {
  const queryClient = useQueryClient();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Account Create / Edit Modal State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'CASH' | 'BANK' | 'UPI' | 'CREDIT_CARD'>('CASH');
  const [accountNumber, setAccountNumber] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [accountErrorMsg, setAccountErrorMsg] = useState<string | null>(null);

  // Delete Confirm Modal State
  const [accountToDelete, setAccountToDelete] = useState<any | null>(null);

  // Transfer Modal State
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferErrorMsg, setTransferErrorMsg] = useState<string | null>(null);

  // Ledger History Modal State
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // ─── Data Fetching ────────────────────────────────────────────────────────
  const { data: accounts = [], isLoading, refetch } = useQuery({
    queryKey: ['payment-accounts'],
    queryFn: async () => {
      const res = await financeService.getAccounts();
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      return list;
    },
  });

  const { data: ledgerData, isLoading: isLedgerLoading } = useQuery({
    queryKey: ['account-ledger', selectedAccountId],
    queryFn: async () => {
      if (!selectedAccountId) return null;
      return financeService.getAccountTransactions(selectedAccountId);
    },
    enabled: !!selectedAccountId,
  });

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc: any) => {
      const accName = acc?.name || '';
      const accNum = acc?.accountNumber || acc?.accountnumber || '';
      const matchesSearch =
        accName.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        accNum.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchesType = typeFilter === 'ALL' || acc?.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [accounts, searchQuery, typeFilter]);

  // ─── Mutations ────────────────────────────────────────────────────────────
  const createAccountMutation = useMutation({
    mutationFn: async () => {
      return financeService.createAccount({
        name,
        type,
        accountNumber: accountNumber || undefined,
        openingBalance: Number(openingBalance) || 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-accounts'] });
      queryClient.refetchQueries({ queryKey: ['payment-accounts'] });
      setIsAccountModalOpen(false);
      resetAccountForm();
      setSearchQuery('');
      setTypeFilter('ALL');
      toast.success('Payment account created successfully');
    },
    onError: (err: any) => {
      const msg = err?.message || 'Failed to create payment account';
      setAccountErrorMsg(msg);
      toast.error(msg);
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async () => {
      if (!editingAccount) return;
      return financeService.updateAccount(editingAccount.id, {
        name,
        type,
        accountNumber: accountNumber || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-accounts'] });
      setIsAccountModalOpen(false);
      resetAccountForm();
      toast.success('Payment account updated successfully');
    },
    onError: (err: any) => {
      const msg = err?.message || 'Failed to update payment account';
      setAccountErrorMsg(msg);
      toast.error(msg);
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      return financeService.deleteAccount(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-accounts'] });
      setAccountToDelete(null);
      toast.success('Payment account removed');
    },
    onError: (err: any) => {
      setAccountToDelete(null);
      toast.error(err?.message || 'Failed to delete payment account');
    },
  });

  const transferMutation = useMutation({
    mutationFn: async () => {
      return financeService.recordTransfer({
        fromAccountId,
        toAccountId,
        amount: Number(transferAmount),
        notes: transferNotes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
      setIsTransferOpen(false);
      setFromAccountId('');
      setToAccountId('');
      setTransferAmount('');
      setTransferNotes('');
      setTransferErrorMsg(null);
      toast.success('Internal money transfer completed successfully');
    },
    onError: (err: any) => {
      const msg = err?.message || 'Failed to process account transfer';
      setTransferErrorMsg(msg);
      toast.error(msg);
    },
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const resetAccountForm = () => {
    setEditingAccount(null);
    setName('');
    setType('CASH');
    setAccountNumber('');
    setOpeningBalance('');
    setAccountErrorMsg(null);
  };

  const handleOpenTransfer = () => {
    setTransferAmount('');
    setTransferNotes('');
    setTransferErrorMsg(null);
    if (accounts.length > 0) {
      setFromAccountId(accounts[0].id);
      if (accounts.length > 1) {
        setToAccountId(accounts[1].id);
      } else {
        setToAccountId(accounts[0].id);
      }
    }
    setIsTransferOpen(true);
  };

  const handleOpenCreate = () => {
    resetAccountForm();
    setIsAccountModalOpen(true);
  };

  const handleOpenEdit = (acc: any) => {
    setEditingAccount(acc);
    setName(acc.name || '');
    setType(acc.type || 'CASH');
    setAccountNumber(acc.accountNumber || acc.accountnumber || '');
    setOpeningBalance((acc.openingBalance ?? acc.openingbalance) ? String(acc.openingBalance ?? acc.openingbalance) : '');
    setAccountErrorMsg(null);
    setIsAccountModalOpen(true);
  };

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAccountErrorMsg(null);
    if (editingAccount) {
      updateAccountMutation.mutate();
    } else {
      createAccountMutation.mutate();
    }
  };

  const formatCurrency = (val: number = 0) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const getAccountIcon = (accType: string) => {
    switch (accType) {
      case 'CASH':
        return <Wallet className="h-5 w-5 text-amber-500" />;
      case 'BANK':
        return <Landmark className="h-5 w-5 text-blue-500" />;
      case 'UPI':
        return <QrCode className="h-5 w-5 text-emerald-500" />;
      case 'CREDIT_CARD':
        return <CreditCard className="h-5 w-5 text-purple-500" />;
      default:
        return <Landmark className="h-5 w-5 text-primary" />;
    }
  };

  const isSavingAccount = createAccountMutation.isPending || updateAccountMutation.isPending;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Payment Accounts</h1>
            <p className="text-sm text-muted-foreground">
              Manage Cash in Hand, Bank & UPI accounts for your workspace.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleOpenTransfer} className="gap-2">
              <ArrowLeftRight className="h-4 w-4" /> Internal Transfer
            </Button>
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Create Account
            </Button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between bg-card/45 border border-border p-4 rounded-xl">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by name or A/C number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 border-border/85"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {['ALL', 'CASH', 'BANK', 'UPI', 'CREDIT_CARD'].map((t) => (
              <Button
                key={t}
                variant={typeFilter === t ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter(t)}
                className="text-xs uppercase"
              >
                {t === 'ALL' ? 'All Types' : t.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </div>

        {/* Accounts Cards List */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full py-12 text-center text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading payment accounts...
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="col-span-full py-16 text-center text-muted-foreground border border-dashed border-border rounded-xl">
              <p className="text-base font-semibold text-foreground">No accounts found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery || typeFilter !== 'ALL'
                  ? 'Try matching different search query or filters.'
                  : 'Click "Create Account" above to add your first payment account.'}
              </p>
            </div>
          ) : (
            filteredAccounts.map((acc: any) => (
              <Card
                key={acc.id}
                className="relative overflow-hidden border-border/80 hover:border-primary/50 transition-all shadow-sm group"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/80 border border-border">
                      {getAccountIcon(acc.type)}
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">{acc.name}</CardTitle>
                      <Badge variant="outline" className="text-[10px] uppercase mt-0.5">
                        {acc.type ? acc.type.replace('_', ' ') : 'CASH'}
                      </Badge>
                    </div>
                  </div>

                  {/* Card Quick Actions */}
                  <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Tooltip content="Edit Account">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(acc)}
                        className="h-8 w-8 p-0 hover:bg-secondary text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Delete Account">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAccountToDelete(acc)}
                        className="h-8 w-8 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </Tooltip>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Current Balance</p>
                    <p className="text-2xl font-bold text-foreground tracking-tight">
                      {formatCurrency(acc.currentBalance ?? acc.currentbalance ?? 0)}
                    </p>
                  </div>
                  {(acc.accountNumber || acc.accountnumber) ? (
                    <p className="text-xs text-muted-foreground truncate">A/C: {acc.accountNumber || acc.accountnumber}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No account number recorded</p>
                  )}
                  <div className="pt-3 border-t border-border flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAccountId(acc.id)}
                      className="gap-1.5 text-xs text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <History className="h-3.5 w-3.5" /> Ledger History
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Create / Edit Account Modal */}
      <Dialog
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        title={editingAccount ? 'Edit Payment Account' : 'Create Payment Account'}
        description={
          editingAccount
            ? 'Modify account details like name, type, or account number.'
            : 'Add a new bank, cash, or UPI payment account to track balances.'
        }
      >
        <form onSubmit={handleAccountSubmit} className="space-y-4 pt-2">
          {accountErrorMsg && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{accountErrorMsg}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-foreground">Account Name *</label>
            <Input
              required
              placeholder="e.g. HDFC Bank, Main Cash, GooglePay UPI"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Account Type *</label>
            <select
              value={type}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setType(e.target.value as any)}
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
            >
              <option value="CASH">Cash in Hand</option>
              <option value="BANK">Bank Account</option>
              <option value="UPI">UPI Account</option>
              <option value="CREDIT_CARD">Credit Card</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Account Number / UPI ID (Optional)</label>
            <Input
              placeholder="e.g. 5010023456789 or shopname@upi"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="mt-1"
            />
          </div>

          {!editingAccount && (
            <div>
              <label className="text-xs font-semibold text-foreground">Opening Balance (₹)</label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="mt-1"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Initial starting cash or balance for this account.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAccountModalOpen(false)}
              disabled={isSavingAccount}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSavingAccount} disabled={isSavingAccount}>
              {editingAccount ? 'Save Changes' : 'Create Account'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Internal Account Transfer Modal */}
      <Dialog isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} title="Internal Money Transfer">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            transferMutation.mutate();
          }}
          className="space-y-4 pt-2"
        >
          {transferErrorMsg && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{transferErrorMsg}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-foreground">From Account *</label>
            <select
              required
              value={fromAccountId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFromAccountId(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
            >
              <option value="">Select source account...</option>
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

          <div>
            <label className="text-xs font-semibold text-foreground">To Account *</label>
            <select
              required
              value={toAccountId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setToAccountId(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
            >
              <option value="">Select destination account...</option>
              {accounts
                .filter((acc: any) => acc.id !== fromAccountId)
                .map((acc: any) => {
                  const bal = acc.currentBalance ?? acc.currentbalance ?? 0;
                  return (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatCurrency(bal)})
                    </option>
                  );
                })}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Transfer Amount (₹) *</label>
            <Input
              required
              type="number"
              min="1"
              step="any"
              placeholder="e.g. 10000"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Notes / Reference (Optional)</label>
            <Input
              placeholder="e.g. Bank deposit from Cash in Hand"
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTransferOpen(false)}
              disabled={transferMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={transferMutation.isPending} disabled={transferMutation.isPending}>
              Process Transfer
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Account Ledger History Modal */}
      <Dialog
        isOpen={!!selectedAccountId}
        onClose={() => setSelectedAccountId(null)}
        title={`Ledger History — ${ledgerData?.account?.name || ''}`}
        description={`Current Balance: ${formatCurrency(ledgerData?.account?.currentBalance)}`}
      >
        <div className="space-y-4 pt-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {isLedgerLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading transactions...
            </div>
          ) : ledgerData?.data?.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No ledger transactions recorded yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Direction</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerData?.data?.map((tx: any) => {
                  const isCredit = tx.direction === 'CREDIT';
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs font-medium text-muted-foreground">
                        {new Date(tx.transactionDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs font-semibold">
                        <Badge variant="outline" className="text-[10px]">
                          {tx.type ? tx.type.replace(/_/g, ' ') : 'TX'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-foreground">{tx.description || '-'}</TableCell>
                      <TableCell className="text-right text-xs font-semibold">
                        <span className={isCredit ? 'text-emerald-500' : 'text-rose-500'}>
                          {tx.direction}
                        </span>
                      </TableCell>
                      <TableCell
                        className={`text-right text-xs font-bold ${
                          isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isCredit ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!accountToDelete}
        onClose={() => setAccountToDelete(null)}
        onConfirm={() => {
          if (accountToDelete) deleteAccountMutation.mutate(accountToDelete.id);
        }}
        title="Remove Payment Account?"
        description={`Are you sure you want to remove "${accountToDelete?.name}"? It will be deactivated and hidden from account dropdowns.`}
        confirmLabel="Remove Account"
        confirmingLabel="Removing..."
        isLoading={deleteAccountMutation.isPending}
      />
    </AppShell>
  );
}
