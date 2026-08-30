'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '../../../components/layout/AppShell';
import { financeService } from '../../../services/financeService';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import {
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  DollarSign,
} from 'lucide-react';

export default function PaymentHistoryPage() {
  const [tab, setTab] = useState<'customer' | 'supplier'>('customer');

  const { data: customerPayments, isLoading: isCustLoading } = useQuery({
    queryKey: ['customer-payments-list'],
    queryFn: async () => {
      const res = await financeService.getCustomerPayments();
      return res.data;
    },
    enabled: tab === 'customer',
  });

  const { data: supplierPayments, isLoading: isSuppLoading } = useQuery({
    queryKey: ['supplier-payments-list'],
    queryFn: async () => {
      const res = await financeService.getSupplierPayments();
      return res.data;
    },
    enabled: tab === 'supplier',
  });

  const formatCurrency = (val: number = 0) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Payment Activity History</h1>
            <p className="text-sm text-muted-foreground">
              Audit log of all payments received from customers and paid to suppliers.
            </p>
          </div>

          <div className="inline-flex rounded-lg border border-border bg-card p-1 text-xs">
            <button
              onClick={() => setTab('customer')}
              className={`rounded-md px-4 py-1.5 font-medium transition-all ${
                tab === 'customer' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Customer Payments (Received)
            </button>
            <button
              onClick={() => setTab('supplier')}
              className={`rounded-md px-4 py-1.5 font-medium transition-all ${
                tab === 'supplier' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Supplier Payments (Paid)
            </button>
          </div>
        </div>

        {tab === 'customer' ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <ArrowDownRight className="h-5 w-5" /> Customer Payments Received
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isCustLoading ? (
                <div className="py-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading payments...
                </div>
              ) : customerPayments?.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">No customer payments recorded.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Sale Order</TableHead>
                      <TableHead>Payment Account</TableHead>
                      <TableHead>Method & Ref</TableHead>
                      <TableHead className="text-right">Amount Received</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerPayments?.map((pay: any) => (
                      <TableRow key={pay.id}>
                        <TableCell className="text-xs font-medium text-muted-foreground">
                          {new Date(pay.paymentDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-foreground">{pay.customer?.name || 'General Customer'}</div>
                          {pay.customer?.customerCode && (
                            <div className="text-xs text-muted-foreground">{pay.customer.customerCode}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-primary">
                          {pay.sale ? pay.sale.saleNumber : 'Direct Payment'}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-foreground">
                          {pay.paymentAccount?.name}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {pay.paymentMethod} {pay.referenceNumber && `• Ref: ${pay.referenceNumber}`}
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                          +{formatCurrency(pay.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5" /> Supplier Payments Paid
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isSuppLoading ? (
                <div className="py-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading payments...
                </div>
              ) : supplierPayments?.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">No supplier payments recorded.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Purchase Order</TableHead>
                      <TableHead>Payment Account</TableHead>
                      <TableHead>Method & Ref</TableHead>
                      <TableHead className="text-right">Amount Paid</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierPayments?.map((pay: any) => (
                      <TableRow key={pay.id}>
                        <TableCell className="text-xs font-medium text-muted-foreground">
                          {new Date(pay.paymentDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-foreground">{pay.supplier?.name || 'General Supplier'}</div>
                          {pay.supplier?.supplierCode && (
                            <div className="text-xs text-muted-foreground">{pay.supplier.supplierCode}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-primary">
                          {pay.purchase ? pay.purchase.purchaseNumber : 'Direct Payment'}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-foreground">
                          {pay.paymentAccount?.name}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {pay.paymentMethod} {pay.referenceNumber && `• Ref: ${pay.referenceNumber}`}
                        </TableCell>
                        <TableCell className="text-right font-bold text-rose-600 dark:text-rose-400">
                          -{formatCurrency(pay.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
