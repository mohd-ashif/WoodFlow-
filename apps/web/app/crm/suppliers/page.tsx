'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../../../components/layout/Navbar';
import { Sidebar } from '../../../components/layout/Sidebar';
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
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { ImportButton } from '../../../components/import/ImportButton';

import { DataTablePagination } from '@/components/ui/DataTablePagination';

export default function SuppliersListPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'>('ALL');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [archiveModalSupplier, setArchiveModalSupplier] = useState<any | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: responseData, isLoading, error, refetch } = useQuery({
    queryKey: ['suppliers-list', page, limit, debouncedSearch, statusFilter],
    queryFn: () =>
      crmService.getSuppliers({
        page,
        limit,
        search: debouncedSearch,
        status: statusFilter,
      }),
  });

  const suppliers = (responseData as any)?.data || (Array.isArray(responseData) ? responseData : []);
  const pagination = (responseData as any)?.pagination || { page: 1, totalPages: 1, total: suppliers.length };

  const archiveMutation = useMutation({
    mutationFn: (id: string) => crmService.archiveSupplier(id),
    onSuccess: () => {
      setArchiveModalSupplier(null);
      queryClient.invalidateQueries({ queryKey: ['suppliers-list'] });
      queryClient.invalidateQueries({ queryKey: ['crm-dashboard'] });
    },
  });

  const handleExportCSV = () => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    window.open(`${API_BASE}/suppliers/export?status=${statusFilter}`, '_blank');
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col p-6 space-y-4 overflow-hidden min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                <Building2 className="h-6 w-6 text-amber-500" />
                Suppliers
              </h1>
              <p className="text-xs text-muted-foreground">
                Manage timber, fabric, hardware, and raw material suppliers.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ImportButton
                module="SUPPLIERS"
                moduleTitle="Suppliers"
                onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ['crm-suppliers'] })}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="gap-2 border-border/80 text-xs"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Link href="/crm/suppliers/new">
                <Button size="sm" className="gap-2 shadow-sm text-xs">
                  <Plus className="h-4 w-4" />
                  Add Supplier
                </Button>
              </Link>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <Card className="border-border/80 p-3.5 flex-shrink-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, phone, email, code or GST..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-background text-xs h-9"
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Filter className="h-3.5 w-3.5" /> Filter:
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
                    className="h-8 text-xs capitalize"
                  >
                    {st.toLowerCase()}
                  </Button>
                ))}
              </div>
            </div>
          </Card>

          {/* Suppliers Table Card — Flex 1 to fill available resolution height */}
          <Card className="flex-1 flex flex-col min-h-0 border-border/80 overflow-hidden shadow-sm">
            <CardContent className="p-0 flex-1 flex flex-col min-h-0">
              {isLoading ? (
                <div className="p-8 space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 bg-card/60 animate-pulse rounded-lg border border-border/40" />
                  ))}
                </div>
              ) : error ? (
                <div className="p-8 text-center text-destructive">
                  <p className="text-sm font-medium">Unable to load suppliers list.</p>
                  <Button size="sm" onClick={() => refetch()} className="mt-4">
                    Try Again
                  </Button>
                </div>
              ) : suppliers.length === 0 ? (
                <div className="p-12 text-center space-y-4 flex-1 flex flex-col justify-center items-center">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto opacity-40" />
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground">No suppliers found</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      No suppliers match your search criteria. Add your first supplier to track your vendors.
                    </p>
                  </div>
                  <Link href="/crm/suppliers/new">
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Supplier
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  {/* Scrollable table container filling available height */}
                  <div className="flex-1 overflow-auto min-h-0">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 z-10 bg-secondary/95 backdrop-blur-md border-b border-border text-xs uppercase font-medium text-muted-foreground shadow-sm">
                        <tr>
                          <th className="py-3.5 px-4">Supplier</th>
                          <th className="py-3.5 px-4">Phone</th>
                          <th className="py-3.5 px-4">Email</th>
                          <th className="py-3.5 px-4">City</th>
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
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-1.5 text-xs text-foreground">
                                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                  <a href={`tel:${supp.phone}`} className="hover:underline">
                                    {supp.phone}
                                  </a>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-xs text-muted-foreground">
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
                              <td className="py-3.5 px-4 text-xs text-muted-foreground">
                                {cityDisplay}
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
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Link href={`/crm/suppliers/${supp.id}`}>
                                    <Button size="icon" variant="ghost" className="hover:bg-primary/20 hover:text-primary transition-colors" title="View Profile">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                  <Link href={`/crm/suppliers/${supp.id}/edit`}>
                                    <Button size="icon" variant="ghost" className="hover:bg-primary/20 hover:text-primary transition-colors" title="Edit Supplier">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                  {supp.status !== 'ARCHIVED' && (
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="text-destructive hover:bg-destructive/15 transition-colors"
                                      title="Archive Supplier"
                                      onClick={() => setArchiveModalSupplier(supp)}
                                    >
                                      <Archive className="h-4 w-4" />
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

                  {/* Always Visible Fixed Bottom Pagination */}
                  <div className="flex-shrink-0 border-t border-border/60">
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
                  </div>
                </>
              )}
            </CardContent>
          </Card>

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
        </main>
      </div>
    </div>
  );
}
