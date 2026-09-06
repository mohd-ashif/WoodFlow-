'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { SearchInput } from '../../../components/ui/SearchInput';
import { financeService } from '../../../services/financeService';
import { crmService } from '../../../services/crmService';
import { ArrowUpRight, Building2, Clock, CheckCircle2 } from 'lucide-react';

export default function PurchasePayablesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const { data: payablesData, isLoading } = useQuery({
    queryKey: ['purchase-payables-list'],
    queryFn: async () => {
      const res = await financeService.getPayables();
      return (res as any)?.data || [];
    },
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: () => crmService.getSuppliers({ limit: 100 }),
  });

  const rawList = payablesData || [];
  const suppliersList = Array.isArray(suppliersData) ? suppliersData : (suppliersData as any)?.items || [];

  const filteredList = rawList.filter((item: any) => {
    if (selectedSupplierId && item.supplierId !== selectedSupplierId) return false;
    if (selectedStatus && item.paymentStatus !== selectedStatus) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        item.supplierName?.toLowerCase().includes(term) ||
        item.purchaseNumber?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const totalOutstanding = filteredList.reduce((sum: number, item: any) => sum + (item.dueAmount || 0), 0);

  return (
    <AppShell>
      <div className="h-full flex flex-col space-y-4 min-h-0">
        {/* Header */}
        <PageHeader
          icon={ArrowUpRight}
          title="Supplier Payables"
          description="Manage supplier bills, track unpaid procurement orders, and monitor outgoing cash liabilities."
          helpTopic="purchases"
        />

        {/* Total Summary KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="p-3.5 border-rose-500/30 bg-rose-500/5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-500">Total Payables Due</span>
              <p className="text-xl font-extrabold text-foreground mt-0.5">
                ₹{totalOutstanding.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
              <Clock className="h-5 w-5" />
            </div>
          </Card>

          <Card className="p-3.5 border-primary/20 bg-primary/5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pending Bills</span>
              <p className="text-xl font-extrabold text-foreground mt-0.5">
                {filteredList.length} Orders
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-3 border-border/80">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <SearchInput
                placeholder="Search supplier name, purchase order number..."
                value={searchTerm}
                onChange={setSearchTerm}
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="h-9 rounded-lg border border-border bg-background px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Suppliers</option>
                {suppliersList.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-9 rounded-lg border border-border bg-background px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Payment Statuses</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Payables Table */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              Loading payables...
            </div>
          ) : filteredList.length === 0 ? (
            <Card className="flex h-48 flex-col items-center justify-center p-6 text-center border-dashed">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
              <h3 className="font-bold text-foreground text-sm">No Payables Pending</h3>
              <p className="text-xs text-muted-foreground mt-0.5">All supplier bills have been fully settled.</p>
            </Card>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-secondary/40 text-muted-foreground uppercase font-semibold">
                  <tr>
                    <th className="p-3">Supplier</th>
                    <th className="p-3">Purchase Order #</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Total Amount</th>
                    <th className="p-3">Paid Amount</th>
                    <th className="p-3">Outstanding</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredList.map((item: any) => {
                    const isUnpaid = item.paymentStatus === 'UNPAID';
                    const isPartial = item.paymentStatus === 'PARTIALLY_PAID';
                    return (
                      <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="p-3 font-semibold text-foreground">
                          {item.supplierName || 'General Supplier'}
                        </td>
                        <td className="p-3 font-mono text-primary font-medium">
                          {item.purchaseNumber}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(item.purchaseDate || item.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="p-3 font-bold text-foreground">
                          ₹{(item.totalAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-emerald-500 font-medium">
                          ₹{(item.paidAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 font-bold text-rose-500">
                          ₹{(item.dueAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isUnpaid
                                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                : isPartial
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-500'
                            }`}
                          >
                            {item.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
