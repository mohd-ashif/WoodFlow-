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
  Trash2,
  Pencil,
} from 'lucide-react';
import { RecordPaymentModal } from '../../../components/sales/RecordPaymentModal';

export default function SalesPaymentsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<any | null>(null);
  const [deleteConfirmPayment, setDeleteConfirmPayment] = useState<any | null>(null);

  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['customer-payments-sales'],
    queryFn: async () => {
      const res = await financeService.getCustomerPayments();
      return Array.isArray(res) ? res : (res as any)?.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => financeService.deleteCustomerPayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-payments-sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales-list'] });
      queryClient.invalidateQueries({ queryKey: ['sales-receivables-list'] });
      queryClient.invalidateQueries({ queryKey: ['payment-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
      setDeleteConfirmPayment(null);
    },
    onError: (err: any) => {
      alert(err?.message || 'Failed to delete payment receipt');
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
              onClick={() => {
                setPaymentToEdit(null);
                setIsRecordModalOpen(true);
              }}
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
              <Button
                size="sm"
                onClick={() => {
                  setPaymentToEdit(null);
                  setIsRecordModalOpen(true);
                }}
                className="gap-2"
              >
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
                      <th className="p-3 text-right">Actions</th>
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
                          {p.sale?.saleNumber ? `#${p.sale.saleNumber}` : '—'}
                        </td>
                        <td className="p-3 text-foreground">
                          {p.paymentAccount?.name || 'Cash Drawer'}
                        </td>
                        <td className="p-3 font-mono text-muted-foreground">
                          {p.paymentMethod} {p.referenceNumber ? `(${p.referenceNumber})` : ''}
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-500 font-mono">
                          + ₹{(p.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
                              onClick={() => {
                                setPaymentToEdit(p);
                                setIsRecordModalOpen(true);
                              }}
                              title="Edit Payment Receipt"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:bg-destructive/15 transition-colors"
                              onClick={() => setDeleteConfirmPayment(p)}
                              title="Delete Payment Receipt"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="block md:hidden space-y-2.5">
                {paymentsList.map((p: any) => (
                  <Card key={p.id} className="p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{p.customer?.name || 'Walk-in Customer'}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-emerald-500 font-mono">+ ₹{(p.amount || 0).toLocaleString('en-IN')}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                          onClick={() => {
                            setPaymentToEdit(p);
                            setIsRecordModalOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:bg-destructive/15"
                          onClick={() => setDeleteConfirmPayment(p)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                      <span>Order {p.sale?.saleNumber ? `#${p.sale.saleNumber}` : '—'}</span>
                      <span>{p.paymentAccount?.name || 'Cash'}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground text-[11px] pt-1 border-t border-border/40">
                      <span>{new Date(p.paymentDate || p.createdAt).toLocaleDateString('en-IN')}</span>
                      <span>{p.paymentMethod} {p.referenceNumber ? `(${p.referenceNumber})` : ''}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Record/Edit Payment Modal */}
        <RecordPaymentModal
          isOpen={isRecordModalOpen}
          paymentToEdit={paymentToEdit}
          onClose={() => {
            setIsRecordModalOpen(false);
            setPaymentToEdit(null);
          }}
        />


        {/* Delete Confirmation Modal */}
        {deleteConfirmPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4">
            <Card className="w-full max-w-md border-destructive/30 shadow-2xl space-y-4 p-5">
              <div className="flex items-center gap-3 text-destructive">
                <div className="p-2 rounded-xl bg-destructive/10">
                  <Trash2 className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-base">Delete Payment Receipt?</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Deleting this payment receipt of <strong className="text-foreground">₹{(deleteConfirmPayment.amount || 0).toLocaleString('en-IN')}</strong> will revert the deposited balance from <strong className="text-foreground">{deleteConfirmPayment.paymentAccount?.name || 'Payment Account'}</strong>
                {deleteConfirmPayment.sale?.saleNumber ? ` and update Sales Order #${deleteConfirmPayment.sale.saleNumber} balance.` : '.'}
              </p>
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => setDeleteConfirmPayment(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(deleteConfirmPayment.id)}
                  className="font-bold"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete & Revert Balance'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
