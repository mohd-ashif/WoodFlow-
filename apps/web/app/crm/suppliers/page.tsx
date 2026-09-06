'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmService } from '../../../services/crmService';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import Link from 'next/link';
import {
  Building2,
  Search,
  Plus,
  Filter,
  Download,
  Eye,
  Edit,
  Archive,
  Phone,
  Mail,
  AlertTriangle,
} from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { SearchInput } from '../../../components/ui/SearchInput';
import { AppIcon } from '../../../components/ui/AppIcon';
import { Tooltip } from '../../../components/ui/Tooltip';
import { ImportButton } from '../../../components/import/ImportButton';
import { DataTablePagination } from '@/components/ui/DataTablePagination';
import { TableCard, TableCardBody, TableCardFooter } from '../../../components/ui/TableCard';
import { useDebounce } from '../../../hooks/useDebounce';
import { useSuppliers } from '../../../hooks/useCRM';

export default function SuppliersListPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'>('ALL');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [archiveModalSupplier, setArchiveModalSupplier] = useState<any | null>(null);

  const { data: responseData, isLoading, error, refetch } = useSuppliers({
    page,
    limit,
    search: debouncedSearch,
    status: statusFilter,
  });

  const suppliers = (responseData as any)?.data || (Array.isArray(responseData) ? responseData : []);
  const pagination = (responseData as any)?.pagination || { page: 1, totalPages: 1, total: suppliers.length };

  const archiveMutation = useMutation({
    mutationFn: (id: string) => crmService.archiveSupplier(id),
    onSuccess: () => {
      setArchiveModalSupplier(null);
      queryClient.invalidateQueries({ queryKey: ['crm'] });
    },
  });

  const handleExportCSV = () => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    window.open(`${API_BASE}/suppliers/export?status=${statusFilter}`, '_blank');
  };

  return (
    <AppShell>
      <PageHeader
        title="Suppliers"
        description="Manage timber, fabric, hardware, and raw material suppliers."
        icon={Building2}
        actions={
          <>
            <ImportButton
              module="SUPPLIERS"
              moduleTitle="Suppliers"
              onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ['crm'] })}
            />
            <Button
              variant="outline"
              size="md"
              onClick={handleExportCSV}
            >
              <AppIcon name="Download" size="sm" />
              Export CSV
            </Button>
            <Link href="/crm/suppliers/new">
              <Button size="md">
                <AppIcon name="Plus" size="sm" />
                Add Supplier
              </Button>
            </Link>
          </>
        }
      />

      {/* Search and Filters Bar */}
      <Card className="border-border/80 p-3 sm:p-3.5 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <SearchInput
            placeholder="Search name, contact, phone, email, code or GST..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1 shrink-0">
              <AppIcon name="Filter" size="sm" /> Filter:
            </span>
            {(['ALL', 'ACTIVE', 'INACTIVE', 'ARCHIVED'] as const).map((st) => (
              <Button
                key={st}
                size="sm"
                variant={statusFilter === st ? 'default' : 'outline'}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className="h-8 text-xs capitalize shrink-0"
              >
                {st.toLowerCase()}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Suppliers Table Card */}
      <TableCard>
        {isLoading ? (
          <TableCardBody className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-card/60 animate-pulse rounded-lg border border-border/40" />
            ))}
          </TableCardBody>
        ) : error ? (
          <TableCardBody className="p-8 text-center text-destructive flex flex-col items-center justify-center">
            <p className="text-sm font-medium">Unable to load suppliers list.</p>
            <Button size="sm" onClick={() => refetch()} className="mt-4">
              Try Again
            </Button>
          </TableCardBody>
        ) : suppliers.length === 0 ? (
          <TableCardBody className="p-12 text-center space-y-4 flex flex-col justify-center items-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto opacity-40" />
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">No suppliers found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No suppliers match your search criteria or status filter. Add your first supplier to track purchases.
              </p>
            </div>
            <Link href="/crm/suppliers/new">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Supplier
              </Button>
            </Link>
          </TableCardBody>
        ) : (
          <>
            <TableCardBody>
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-secondary/95 backdrop-blur-md border-b border-border text-xs uppercase font-medium text-muted-foreground shadow-sm">
                  <tr>
                    <th className="py-3.5 px-4">Supplier</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">Contact Person</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4 hidden lg:table-cell">Email</th>
                    <th className="py-3.5 px-4 hidden sm:table-cell">City</th>
                    <th className="py-3.5 px-4">Outstanding</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {suppliers.map((supp: any) => {
                    const defaultAddress = supp.addresses?.[0];
                    const cityDisplay = defaultAddress ? `${defaultAddress.city}, ${defaultAddress.state}` : '—';
                    return (
                      <tr key={supp.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <Link
                              href={`/crm/suppliers/${supp.id}`}
                              className="font-semibold text-foreground hover:underline"
                            >
                              {supp.name}
                            </Link>
                            <span className="text-xs font-mono text-muted-foreground">
                              {supp.supplierCode}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-foreground hidden md:table-cell">
                          {supp.contactPerson || '—'}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-xs text-foreground">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            <a href={`tel:${supp.phone}`} className="hover:underline">
                              {supp.phone}
                            </a>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-muted-foreground hidden lg:table-cell">
                          {supp.email ? (
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              <a href={`mailto:${supp.email}`} className="hover:underline">
                                {supp.email}
                              </a>
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-muted-foreground hidden sm:table-cell">
                          {cityDisplay}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono">
                          {supp.outstandingBalanceDisplay || '₹0.00'}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              supp.status === 'ACTIVE'
                                ? 'default'
                                : supp.status === 'ARCHIVED'
                                ? 'destructive'
                                : 'secondary'
                            }
                            className="text-[11px]"
                          >
                            {supp.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right min-w-[120px] pr-4">
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            <Tooltip content="View Profile">
                              <Link href={`/crm/suppliers/${supp.id}`}>
                                <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/20 hover:text-primary transition-colors" aria-label={`View ${supp.name} profile`}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                            </Tooltip>
                            <Tooltip content="Edit supplier">
                              <Link href={`/crm/suppliers/${supp.id}/edit`}>
                                <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/20 hover:text-primary transition-colors" aria-label={`Edit ${supp.name}`}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                            </Tooltip>
                            {supp.status !== 'ARCHIVED' && (
                              <Tooltip content="Archive supplier">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-destructive hover:bg-destructive/15 transition-colors"
                                  aria-label={`Archive ${supp.name}`}
                                  onClick={() => setArchiveModalSupplier(supp)}
                                >
                                  <Archive className="h-4 w-4" />
                                </Button>
                              </Tooltip>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableCardBody>

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
                itemLabel="suppliers"
              />
            </TableCardFooter>
          </>
        )}
      </TableCard>

      {/* Archive Dialog */}
      {archiveModalSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md border-destructive/30 shadow-xl">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <div className="p-2.5 rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Archive Supplier?</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {archiveModalSupplier.name} ({archiveModalSupplier.supplierCode})
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                This supplier will be removed from active lists. Historical purchase records associated with this supplier will remain available.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setArchiveModalSupplier(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={archiveMutation.isPending}
                  onClick={() => archiveMutation.mutate(archiveModalSupplier.id)}
                >
                  {archiveMutation.isPending ? 'Archiving...' : 'Archive Supplier'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
