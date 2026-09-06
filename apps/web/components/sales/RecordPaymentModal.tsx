'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeService } from '../../services/financeService';
import { salesService } from '../../services/salesService';
import { crmService } from '../../services/crmService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { DollarSign, X, CheckCircle2, AlertCircle } from 'lucide-react';

import { useSales } from '../../hooks/useSales';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale?: any; // Optional target sale order
  paymentToEdit?: any; // Optional existing payment receipt to edit
  onSuccess?: () => void;
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  sale: initialSale,
  paymentToEdit,
  onSuccess,
}: RecordPaymentModalProps) {
  const queryClient = useQueryClient();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedSaleId, setSelectedSaleId] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // 1. Fetch Accounts
  const { data: accountsRaw, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['payment-accounts'],
    queryFn: async () => {
      const res = await financeService.getAccounts();
      return Array.isArray(res) ? res : (res as any)?.data || [];
    },
    enabled: isOpen,
  });

  // 2. Fetch Customers
  const { data: customersRaw } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const res = await crmService.getCustomers({ limit: 100 });
      return Array.isArray(res) ? res : (res as any)?.data || (res as any)?.items || [];
    },
    enabled: isOpen,
  });

  // 3. Fetch Sales via useSales hook
  const { data: salesResponse } = useSales({ limit: 100 });

  const accountsList: any[] = Array.isArray(accountsRaw)
    ? accountsRaw
    : (accountsRaw as any)?.data || (accountsRaw as any)?.items || [];

  const customersList: any[] = Array.isArray(customersRaw)
    ? customersRaw
    : (customersRaw as any)?.data || (customersRaw as any)?.items || [];

  const allSales: any[] = React.useMemo(() => {
    const list =
      (salesResponse as any)?.data ||
      (salesResponse as any)?.items ||
      (Array.isArray(salesResponse) ? salesResponse : []);
    const res = Array.isArray(list) ? [...list] : [];
    if (initialSale && !res.some((s: any) => s.id === initialSale.id)) {
      res.unshift(initialSale);
    }
    return res;
  }, [salesResponse, initialSale]);

  const displaySalesList = React.useMemo(() => {
    if (!selectedCustomerId) return allSales;
    const filtered = allSales.filter(
      (s: any) =>
        s.customerId === selectedCustomerId || s.customer?.id === selectedCustomerId
    );
    return filtered.length > 0 ? filtered : allSales;
  }, [allSales, selectedCustomerId]);

  // Pre-fill initial sale or payment data if provided
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      if (paymentToEdit) {
        setSelectedCustomerId(paymentToEdit.customerId || paymentToEdit.customer?.id || '');
        setSelectedSaleId(paymentToEdit.saleId || paymentToEdit.sale?.id || '');
        setSelectedAccountId(paymentToEdit.paymentAccountId || paymentToEdit.paymentAccount?.id || '');
        setAmount((paymentToEdit.amount || 0).toString());
        setPaymentMethod(paymentToEdit.paymentMethod || 'CASH');
        setReferenceNumber(paymentToEdit.referenceNumber || '');
        setNotes(paymentToEdit.notes || '');
      } else if (initialSale) {
        setSelectedSaleId(initialSale.id || '');
        setSelectedCustomerId(initialSale.customerId || initialSale.customer?.id || '');
        const due = (initialSale.totalAmount || 0) - (initialSale.paidAmount || 0);
        setAmount(due > 0 ? due.toString() : (initialSale.totalAmount || 0).toString());
        setReferenceNumber('');
        setNotes('');
      } else {
        setSelectedSaleId('');
        setSelectedCustomerId('');
        setAmount('');
        setReferenceNumber('');
        setNotes('');
      }
    }
  }, [isOpen, initialSale, paymentToEdit]);

  // Auto-select first payment account if not selected
  useEffect(() => {
    if (accountsList.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accountsList[0].id);
    }
  }, [accountsList, selectedAccountId]);

  // Auto-select customer's sale order when customer is selected
  useEffect(() => {
    if (selectedCustomerId && displaySalesList.length > 0 && !selectedSaleId && !paymentToEdit) {
      const matched = displaySalesList.find(
        (s: any) => s.customerId === selectedCustomerId || s.customer?.id === selectedCustomerId
      );
      if (matched) {
        setSelectedSaleId(matched.id);
        const due = (matched.totalAmount || 0) - (matched.paidAmount || 0);
        setAmount(due > 0 ? due.toString() : (matched.totalAmount || 0).toString());
      }
    }
  }, [selectedCustomerId, displaySalesList, selectedSaleId, paymentToEdit]);

  // Handle Sales Order selection change
  const handleSaleChange = (saleId: string) => {
    setSelectedSaleId(saleId);
    if (saleId && !paymentToEdit) {
      const found = allSales.find((s: any) => s.id === saleId);
      if (found) {
        if (found.customerId || found.customer?.id) {
          setSelectedCustomerId(found.customerId || found.customer?.id);
        }
        const due = (found.totalAmount || 0) - (found.paidAmount || 0);
        setAmount(due > 0 ? due.toString() : (found.totalAmount || 0).toString());
      }
    }
  };

  const recordMutation = useMutation({
    mutationFn: (data: any) =>
      paymentToEdit
        ? financeService.updateCustomerPayment(paymentToEdit.id, data)
        : financeService.recordCustomerPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-payments-sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales-list'] });
      queryClient.invalidateQueries({ queryKey: ['sale'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice'] });
      queryClient.invalidateQueries({ queryKey: ['payment-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err?.message || 'Failed to save payment receipt');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (recordMutation.isPending) return;
    setErrorMsg('');

    if (!selectedAccountId) {
      setErrorMsg('Please select a payment account.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid payment amount greater than ₹0.');
      return;
    }

    recordMutation.mutate({
      customerId: selectedCustomerId || undefined,
      saleId: selectedSaleId || undefined,
      paymentAccountId: selectedAccountId,
      amount: numAmount,
      paymentMethod,
      referenceNumber: referenceNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  if (!isOpen) return null;

  const currentSale = initialSale || allSales.find((s: any) => s.id === selectedSaleId);
  const remainingDue = currentSale
    ? Math.max(0, (currentSale.totalAmount || 0) - (currentSale.paidAmount || 0))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-border/80 bg-card p-6 shadow-2xl space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">
                {paymentToEdit ? 'Edit Customer Payment' : 'Record Customer Payment'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {paymentToEdit
                  ? `Updating payment receipt ${paymentToEdit.id}`
                  : currentSale
                  ? `Recording payment for Order #${currentSale.saleNumber}`
                  : 'Record a payment receipt & change status to Paid'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close modal">
            <X className="h-4 w-4" />
          </Button>
        </div>


        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-xs text-destructive font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Selected Order Summary Banner */}
        {currentSale && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-center justify-between text-xs">
            <div>
              <span className="text-muted-foreground font-medium">Sales Order: </span>
              <span className="font-mono font-bold text-foreground">#{currentSale.saleNumber}</span>
              {currentSale.customer?.name && (
                <span className="text-muted-foreground block text-[11px] mt-0.5">
                  Customer: <strong className="text-foreground">{currentSale.customer.name}</strong>
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-muted-foreground block text-[11px]">Remaining Due</span>
              <span className="font-mono font-bold text-emerald-500 text-sm">
                ₹{remainingDue !== null ? remainingDue.toLocaleString('en-IN') : (currentSale.totalAmount || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Customer Dropdown */}
          <div>
            <label className="font-semibold block mb-1 text-foreground">Customer</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="">Select Customer (Optional)</option>
              {customersList.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Sales Order Dropdown */}
          <div>
            <label className="font-semibold block mb-1 text-foreground">Sales Order / Invoice</label>
            <select
              value={selectedSaleId}
              onChange={(e) => handleSaleChange(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="">Select Sales Order (Optional)</option>
              {displaySalesList.map((s: any) => {
                const due = (s.totalAmount || 0) - (s.paidAmount || 0);
                return (
                  <option key={s.id} value={s.id}>
                    #{s.saleNumber} — {s.customer?.name || 'Walk-in'} (Due: ₹{due.toLocaleString('en-IN')} / Total: ₹{(s.totalAmount || 0).toLocaleString('en-IN')}) [{s.paymentStatus}]
                  </option>
                );
              })}
            </select>
          </div>

          {/* Payment Account Dropdown */}
          <div>
            <label className="font-semibold block mb-1 text-foreground">
              Deposit To Payment Account <span className="text-destructive">*</span>
            </label>
            <select
              required
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="">Select Payment Account</option>
              {accountsList.map((acc: any) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type}) — Balance: ₹{(acc.currentBalance || 0).toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method & Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1 text-foreground">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                <option value="CARD">Debit/Credit Card</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold block text-foreground">
                  Amount (₹) <span className="text-destructive">*</span>
                </label>
                {remainingDue !== null && remainingDue > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount(remainingDue.toString())}
                    className="text-[10px] text-primary hover:underline font-medium"
                  >
                    Full Balance (₹{remainingDue})
                  </button>
                )}
              </div>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono font-bold text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Reference Number */}
          <div>
            <label className="font-semibold block mb-1 text-foreground">Reference / Transaction ID (Optional)</label>
            <input
              type="text"
              placeholder="e.g. UPI Ref 304918239, UTR Number, Cheque No"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="font-semibold block mb-1 text-foreground">Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Paid in full on delivery"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-border/60">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={recordMutation.isPending}
              className="gap-1.5 font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{recordMutation.isPending ? 'Saving Payment...' : 'Save Payment Receipt'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
