'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesService } from '../../../services/salesService';
import { crmService } from '../../../services/crmService';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { SearchInput } from '../../../components/ui/SearchInput';
import { AppIcon } from '../../../components/ui/AppIcon';
import {
  FileText,
  Plus,
  ArrowRight,
  Eye,
} from 'lucide-react';
import Link from 'next/link';

export default function EstimatesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);

  // Fetch Sales (filtering for DRAFT / Estimates)
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['sales', 'estimates', { search: searchTerm, customerId: selectedCustomerId, status: selectedStatus, page }],
    queryFn: async () => {
      const res = await salesService.getSales({
        search: searchTerm,
        customerId: selectedCustomerId,
        status: selectedStatus || 'DRAFT',
        page,
        limit: 20,
      });
      return res as any;
    },
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => crmService.getCustomers({ limit: 100 }),
  });

  const confirmMutation = useMutation({
    mutationFn: (saleId: string) => salesService.confirmSale(saleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      alert('Estimate successfully converted to Sales Order & Invoice!');
    },
    onError: (err: any) => {
      alert(err?.message || 'Failed to convert estimate');
    },
  });

  const estimatesList = Array.isArray(salesData) ? salesData : salesData?.items || [];
  const customersList = Array.isArray(customersData) ? customersData : (customersData as any)?.items || [];

  return (
    <AppShell>
      <div className="h-full flex flex-col space-y-4 min-h-0">
        {/* Header */}
        <PageHeader
          icon={FileText}
          title="Quotations & Estimates"
          description="Create preliminary price estimates for customers, track status, and convert to confirmed Sales Orders."
          helpTopic="sales"
          actions={
            <Link href="/sales/new">
              <Button size="md" className="gap-2 shadow-lg shadow-primary/20">
                <AppIcon icon={Plus} size="sm" />
                <span>+ New Quotation</span>
              </Button>
            </Link>
          }
        />

        {/* Filter Controls */}
        <Card className="p-3 sm:p-4 space-y-3 border-border/80">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <SearchInput
                placeholder="Search quotation #, customer name..."
                value={searchTerm}
                onChange={setSearchTerm}
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
              {/* Customer Filter */}
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="h-9 rounded-lg border border-border bg-background px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Customers</option>
                {customersList.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-9 rounded-lg border border-border bg-background px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="DRAFT">Estimates / Drafts</option>
                <option value="CONFIRMED">Converted to Sales Order</option>
                <option value="CANCELLED">Cancelled / Rejected</option>
                <option value="">All Statuses</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Estimates Table / Cards */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              Loading quotations...
            </div>
          ) : estimatesList.length === 0 ? (
            <Card className="flex h-64 flex-col items-center justify-center p-6 text-center border-dashed">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-foreground text-base">No Quotations Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                Create preliminary price quotes for customers before confirming final sales.
              </p>
              <Link href="/sales/new">
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Create First Quotation</span>
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-hidden rounded-xl border border-border bg-card">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-secondary/40 text-muted-foreground uppercase font-semibold">
                    <tr>
                      <th className="p-3">Quotation #</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Total Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {estimatesList.map((est: any) => {
                      const isDraft = est.status === 'DRAFT';
                      const isConfirmed = est.status === 'CONFIRMED';
                      return (
                        <tr key={est.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="p-3 font-mono font-bold text-foreground">
                            {est.saleNumber}
                          </td>
                          <td className="p-3 font-medium text-foreground">
                            {est.customer?.name || est.customerNameSnapshot || 'Walk-in Customer'}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {new Date(est.saleDate || est.createdAt).toLocaleDateString('en-IN')}
                          </td>
                          <td className="p-3 font-bold text-foreground">
                            ₹{(est.totalAmount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                isDraft
                                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                  : isConfirmed
                                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {isDraft ? 'Estimate / Draft' : isConfirmed ? 'Converted' : est.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link href={`/sales/${est.id}`}>
                                <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  <span>View</span>
                                </Button>
                              </Link>
                              {isDraft && (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  className="h-7 px-2.5 text-xs gap-1"
                                  disabled={confirmMutation.isPending}
                                  onClick={() => {
                                    if (confirm('Convert this estimate to a confirmed Sales Order & Invoice?')) {
                                      confirmMutation.mutate(est.id);
                                    }
                                  }}
                                >
                                  <span>Convert</span>
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Stacked Card View */}
              <div className="block md:hidden space-y-3">
                {estimatesList.map((est: any) => {
                  const isDraft = est.status === 'DRAFT';
                  return (
                    <Card key={est.id} className="p-3.5 space-y-3 border-border">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-foreground">{est.saleNumber}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isDraft
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          }`}
                        >
                          {isDraft ? 'Estimate' : est.status}
                        </span>
                      </div>

                      <div className="text-xs space-y-1">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Customer:</span>
                          <span className="font-medium text-foreground">
                            {est.customer?.name || 'Walk-in Customer'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Total Amount:</span>
                          <span className="font-bold text-foreground">
                            ₹{(est.totalAmount || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                        <Link href={`/sales/${est.id}`} className="flex-1">
                          <Button size="sm" variant="outline" className="w-full text-xs">
                            View Details
                          </Button>
                        </Link>
                        {isDraft && (
                          <Button
                            size="sm"
                            className="flex-1 text-xs gap-1"
                            onClick={() => {
                              if (confirm('Convert this estimate to Sales Order & Invoice?')) {
                                confirmMutation.mutate(est.id);
                              }
                            }}
                          >
                            <span>Convert</span>
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
