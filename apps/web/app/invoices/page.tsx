'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { useQuery } from '@tanstack/react-query';
import { salesService } from '../../services/salesService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { TableCard, TableCardBody, TableCardFooter } from '../../components/ui/TableCard';
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
  Download,
} from 'lucide-react';
import { DataTablePagination } from '@/components/ui/DataTablePagination';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { AppIcon } from '../../components/ui/AppIcon';
import { Tooltip } from '../../components/ui/Tooltip';
import { InvoiceExportModal } from '../../components/invoices/InvoiceExportModal';

import { useDebounce } from '../../hooks/useDebounce';
import { useInvoices } from '../../hooks/useInvoices';

export default function InvoicesListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const { data: responseData, isLoading, refetch } = useInvoices({
    page,
    limit,
    search: debouncedSearch,
  });

  const rawInvoices = (responseData as any)?.data || (Array.isArray(responseData) ? responseData : []);
  const invoices = rawInvoices;
  const pagination = (responseData as any)?.pagination || { page: 1, totalPages: 1, total: invoices.length };

  return (
    <AppShell>
      <div className="h-full flex flex-col space-y-3 sm:space-y-4 min-h-0">
        {/* Header */}
        <PageHeader
          icon={FileText}
          title="Tax Invoices"
          description="Issued customer invoices, printable receipts, and tax records."
          helpTopic="finance"
          actions={
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsExportOpen(true)}
              className="gap-2 shadow-sm"
            >
              <Download className="h-4 w-4 text-primary" />
              <span>Export Invoices</span>
            </Button>
          }
        />

        {/* Search Bar */}
        <Card className="border-border/80 p-3 flex-shrink-0 min-w-0">
          <SearchInput
            placeholder="Search invoice number, customer name, phone..."
            value={searchTerm}
            onChange={(val) => { setSearchTerm(val); setPage(1); }}
            onClear={() => { setSearchTerm(''); setPage(1); }}
            wrapperClassName="max-w-md"
          />
        </Card>

        {/* Invoices Table Card — Flex 1 to fill available resolution height */}
        <TableCard>
          {isLoading ? (
            <TableCardBody className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-card/60 animate-pulse rounded-lg" />
              ))}
            </TableCardBody>
          ) : invoices.length === 0 ? (
            <TableCardBody className="text-center py-12 space-y-2 flex flex-col justify-center items-center">
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
            </TableCardBody>
          ) : (
            <>
              <TableCardBody>
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-secondary/95 backdrop-blur-md text-muted-foreground text-xs uppercase tracking-wider border-b border-border/60 shadow-sm">
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
                        <td className="py-3.5 px-4 text-right min-w-[120px] pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <Tooltip content="Print Invoice">
                              <Link href={`/invoices/${inv.id}`}>
                                <Button size="icon" variant="ghost" className="hover:bg-primary/20 hover:text-primary transition-colors" aria-label={`Print invoice ${inv.invoiceNumber}`}>
                                  <Printer className="h-4 w-4" />
                                </Button>
                              </Link>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableCardBody>

              {/* Always Visible Fixed Bottom Pagination */}
              <TableCardFooter>
                <DataTablePagination
                  currentPage={page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.total}
                  limit={limit}
                  onPageChange={setPage}
                  onLimitChange={(l) => {
                    setLimit(l);
                    setPage(1);
                  }}
                  itemLabel="invoices"
                />
              </TableCardFooter>
            </>
          )}
        </TableCard>
      </div>

      <InvoiceExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        initialFilters={{ search: searchTerm }}
      />
    </AppShell>
  );
}

