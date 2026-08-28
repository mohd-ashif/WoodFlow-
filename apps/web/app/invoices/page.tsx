'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Sidebar } from '../../components/layout/Sidebar';
import { useQuery } from '@tanstack/react-query';
import { salesService } from '../../services/salesService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import Link from 'next/link';
import {
  FileText,
  Search,
  Printer,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function InvoicesListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: responseData, isLoading, refetch } = useQuery({
    queryKey: ['invoices-list', page, limit, debouncedSearch],
    queryFn: () =>
      salesService.getInvoices({
        page,
        limit,
        search: debouncedSearch,
      }),
  });

  const rawInvoices = (responseData as any)?.data || (Array.isArray(responseData) ? responseData : []);
  const invoices = rawInvoices;
  const pagination = (responseData as any)?.pagination || { page: 1, totalPages: 1, total: invoices.length };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <FileText className="h-7 w-7 text-primary" />
              Tax Invoices
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Issued customer invoices, printable receipts, and tax records.
            </p>
          </div>

          {/* Search Bar */}
          <Card className="border-border/80 p-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoice number, customer name, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 text-xs"
              />
            </div>
          </Card>

          {/* Invoices Table */}
          <Card className="border-border/80 overflow-hidden">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 bg-card/60 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                  <p className="text-base font-semibold text-foreground">No invoices generated yet</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Invoices are automatically issued whenever a sale order is confirmed.
                  </p>
                  <Link href="/sales/new">
                    <Button size="sm" className="mt-2">
                      + Create First Sale
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-secondary/40 text-muted-foreground text-xs uppercase tracking-wider border-b border-border/60">
                      <tr>
                        <th className="py-3 px-4">Invoice No.</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Issued Date</th>
                        <th className="py-3 px-4 text-right">Subtotal</th>
                        <th className="py-3 px-4 text-right">Tax (GST)</th>
                        <th className="py-3 px-4 text-right">Total Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {invoices.map((inv: any) => (
                        <tr key={inv.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-semibold text-foreground">
                            <Link href={`/invoices/${inv.id}`} className="hover:underline text-primary">
                              {inv.invoiceNumber}
                            </Link>
                          </td>
                          <td className="py-3.5 px-4">
                            <div>
                              <p className="font-semibold text-foreground text-xs">{inv.customerNameSnapshot}</p>
                              {inv.customerPhoneSnapshot && (
                                <p className="text-[11px] text-muted-foreground">{inv.customerPhoneSnapshot}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-muted-foreground">
                            {new Date(inv.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-xs">
                            ₹{inv.subtotal.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-xs text-muted-foreground">
                            ₹{inv.taxAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold text-foreground text-sm">
                            ₹{inv.totalAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge
                              variant={
                                inv.status === 'ISSUED'
                                  ? 'default'
                                  : inv.status === 'CANCELLED'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                              className="text-[10px]"
                            >
                              {inv.status}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link href={`/invoices/${inv.id}`}>
                                <Button size="icon" variant="ghost" className="hover:bg-primary/20 hover:text-primary transition-colors" title="Print Invoice">
                                  <Printer className="h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination footer */}
              {pagination.totalPages > 1 && (
                <div className="p-4 border-t border-border/60 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} total invoices)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
