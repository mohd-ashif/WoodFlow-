'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { SearchInput } from '../../../components/ui/SearchInput';
import { financeService } from '../../../services/financeService';
import { salesService } from '../../../services/salesService';
import { crmService } from '../../../services/crmService';
import {
  DollarSign,
  Plus,
  ArrowDownRight,
  User,
  Calendar,
  CreditCard,
  CheckCircle2,
  FileText,
  X,
} from 'lucide-react';

export default function SalesPaymentsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['customer-payments-sales'],
    queryFn: async () => {
      const res = await financeService.getCustomerPayments();
      return (res as any)?.data || [];
    },
  });

  const { data: accountsData } = useQuery({
    queryKey: ['payment-accounts'],
    queryFn: async () => {
      const res = await financeService.getAccounts();
      return (res as any)?.data || [];
    },
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => crmService.getCustomers({ limit: 100 }),
  });

  const { data: salesData } = useQuery({
    queryKey: ['sales-list-unpaid'],
    queryFn: () => salesService.getSales({ limit: 100 }),
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (data: any) => financeService.recordCustomerPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-payments-sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payment-accounts'] });
      setIsRecordModalOpen(false);
      // Reset form
      setAmount('');
      setReferenceNumber('');
      setNotes('');
      alert('Payment recorded successfully!');
    },
    onError: (err: any) => {
      alert(err?.message || 'Failed to record payment');
    },
  });

  const paymentsList = (paymentsData || []).filter((p: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.customer?.name?.toLowerCase().includes(term) ||
      p.referenceNumber?.toLowerCase().includes(term) ||
      p.sale?.saleNumber?.toLowerCase().includes(term)
    );
  });

  const customersList = Array.isArray(customersData) ? customersData : (customersData as any)?.items || [];
  const accountsList = accountsData || [];
  const salesList = Array.isArray(salesData) ? salesData : (salesData as any)?.items || [];

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId || !amount || parseFloat(amount) <= 0) {
      alert('Please select a payment account and enter a valid amount.');
      return;
    }
    recordPaymentMutation.mutate({
      customerId: selectedCustomerId || undefined,
      saleId: selectedSaleId || undefined,
      paymentAccountId: selectedAccountId,
      amount: parseFloat(amount),
      paymentMethod,
      referenceNumber: referenceNumber || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <AppShell>
      <div className="h-full flex flex-col space-y-4 min-h-0">
        {/* Header */}
        <PageHeader
          icon={DollarSign}
          title="Customer Payments"
          description="Record customer payment receipts, manage collection history, and update invoice due balances."
          helpTopic="finance"
          actions={
            <Button
              size="md"
              onClick={() => setIsRecordModalOpen(true)}
              className="gap-2 shadow-lg shadow-primary/20 font-bold"
            >
              <Plus className="h-4 w-4" />
              <span>Record Customer Payment</span>
            </Button>
          }
        />

        {/* Filter Bar */}
        <Card className="p-3 border-border/80">
          <SearchInput
            placeholder="Search payment reference #, customer name, order number..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </Card>

        {/* Payments List */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              Loading payment receipts...
            </div>
          ) : paymentsList.length === 0 ? (
            <Card className="flex h-64 flex-col items-center justify-center p-6 text-center border-dashed">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 mb-3">
                <DollarSign className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-foreground text-base">No Customer Payments Recorded</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                Record payments received from customers via Cash, UPI, Cheque, or Bank Transfer.
              </p>
              <Button size="sm" onClick={() => setIsRecordModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                <span>Record First Payment</span>
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-hidden rounded-xl border border-border bg-card">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-secondary/40 text-muted-foreground uppercase font-semibold">
                    <tr>
                      <th className="p-3">Receipt Date</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Related Order</th>
                      <th className="p-3">Payment Account</th>
                      <th className="p-3">Method / Ref #</th>
                      <th className="p-3 text-right">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {paymentsList.map((p: any) => (
                      <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="p-3 text-muted-foreground font-medium">
                          {new Date(p.paymentDate || p.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="p-3 font-semibold text-foreground">
                          {p.customer?.name || 'Walk-in Customer'}
                        </td>
                        <td className="p-3 font-mono font-medium text-primary">
                          {p.sale?.saleNumber || '—'}
                        </td>
                        <td className="p-3 text-foreground">
                          {p.paymentAccount?.name || 'Cash Drawer'}
                        </td>
                        <td className="p-3 font-mono text-muted-foreground">
                          {p.paymentMethod} {p.referenceNumber ? `(${p.referenceNumber})` : ''}
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-500">
                          + ₹{(p.amount || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="block md:hidden space-y-3">
                {paymentsList.map((p: any) => (
                  <Card key={p.id} className="p-3.5 space-y-2.5 border-border">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-foreground">
                        {p.customer?.name || 'Walk-in Customer'}
                      </span>
                      <span className="font-bold text-sm text-emerald-500">
                        + ₹{(p.amount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground flex justify-between">
                      <span>{new Date(p.paymentDate || p.createdAt).toLocaleDateString('en-IN')}</span>
                      <span>{p.paymentMethod} {p.referenceNumber ? `(${p.referenceNumber})` : ''}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Record Payment Modal */}
        {isRecordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-background/80 backdrop-blur-xs"
              onClick={() => setIsRecordModalOpen(false)}
            />
            <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl p-5 z-10 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-500" />
                  <h3 className="font-bold text-sm text-foreground">Record Customer Payment</h3>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => setIsRecordModalOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleRecordSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Customer</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value="">Select Customer (Optional)</option>
                    {customersList.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Sales Order / Invoice</label>
                  <select
                    value={selectedSaleId}
                    onChange={(e) => setSelectedSaleId(e.target.value)}
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value="">Select Sales Order (Optional)</option>
                    {salesList.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.saleNumber} — ₹{s.totalAmount?.toLocaleString('en-IN')} ({s.paymentStatus})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Deposit To Payment Account *</label>
                  <select
                    required
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value="">Select Payment Account</option>
                    {accountsList.map((acc: any) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type}) — Balance: ₹{acc.currentBalance?.toLocaleString('en-IN')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold block mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                      <option value="CHEQUE">Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Reference Number / Transaction ID</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI Ref 304918239"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                  <Button variant="outline" size="sm" onClick={() => setIsRecordModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    type="submit"
                    disabled={recordPaymentMutation.isPending}
                    className="gap-1 font-bold shadow-md shadow-primary/20"
                  >
                    <span>Save Payment Receipt</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
