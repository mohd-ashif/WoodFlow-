'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../../../services/inventoryService';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { Clock, Search, User, RefreshCw } from 'lucide-react';

import { useDebounce } from '../../../hooks/useDebounce';
import { useStockMovements } from '../../../hooks/useInventory';
import { AppShell } from '../../../components/layout/AppShell';
import { TableCard, TableCardBody, TableCardFooter } from '../../../components/ui/TableCard';
import { DataTablePagination } from '@/components/ui/DataTablePagination';
import { PageHeader } from '../../../components/ui/PageHeader';
import { SearchInput } from '../../../components/ui/SearchInput';
import { AppIcon } from '../../../components/ui/AppIcon';

export default function StockMovementsPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [movementType, setMovementType] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Query Movements via custom hook (uses keepPreviousData)
  const { data: moveData, isLoading, refetch } = useStockMovements({
    search: debouncedSearch,
    movementType,
    createdBy,
    startDate,
    endDate,
    page,
    limit,
  });

  const movements = (moveData as any)?.data || [];
  const pagination = (moveData as any)?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 };

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'OPENING_STOCK':
        return <Badge variant="default">Opening Stock</Badge>;
      case 'STOCK_ADJUSTMENT_IN':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Adjustment In</Badge>;
      case 'STOCK_ADJUSTMENT_OUT':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Adjustment Out</Badge>;
      case 'STOCK_CORRECTION':
        return <Badge variant="default">Correction</Badge>;
      case 'DAMAGE':
        return <Badge variant="danger">Damage</Badge>;
      case 'LOST':
        return <Badge variant="danger">Lost</Badge>;
      case 'INITIAL_IMPORT':
        return <Badge variant="default">Initial Import</Badge>;
      default:
        return <Badge variant="default">{type}</Badge>;
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setMovementType('');
    setCreatedBy('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <AppShell>
      <PageHeader
        icon={Clock}
        title="Stock Movements"
        description="Audit trail of all inventory changes, adjustments, and receipts."
        actions={
          <Button
            variant="outline"
            size="md"
            onClick={() => refetch()}
            className="gap-2 border-border/80"
          >
            <AppIcon icon={RefreshCw} size="sm" /> Refresh Logs
          </Button>
        }
      />

      {/* Filters Panel */}
      <div className="bg-card/40 border border-border p-3 sm:p-3.5 rounded-xl space-y-3 flex-shrink-0 min-w-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {/* Product search */}
          <div className="sm:col-span-2 lg:col-span-2">
            <SearchInput
              placeholder="Search product name or SKU…"
              value={search}
              onChange={(val) => { setSearch(val); setPage(1); }}
              onClear={() => { setSearch(''); setPage(1); }}
            />
          </div>

          {/* Movement Type */}
          <select
            value={movementType}
            onChange={(e) => { setMovementType(e.target.value); setPage(1); }}
            className="h-9 text-xs rounded-lg border border-border bg-background/50 px-3 text-foreground focus:outline-none"
          >
            <option value="">All Movement Types</option>
            <option value="OPENING_STOCK">Opening Stock</option>
            <option value="STOCK_ADJUSTMENT_IN">Adjustment In</option>
            <option value="STOCK_ADJUSTMENT_OUT">Adjustment Out</option>
            <option value="STOCK_CORRECTION">Correction</option>
            <option value="DAMAGE">Damage</option>
            <option value="LOST">Lost</option>
            <option value="INITIAL_IMPORT">Initial Import</option>
          </select>

          {/* Start Date */}
          <Input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="bg-background/50 border-border/80 text-xs h-9"
          />

          {/* End Date */}
          <Input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="bg-background/50 border-border/80 text-xs h-9"
          />
        </div>

        {(search || movementType || createdBy || startDate || endDate) && (
          <div className="flex items-center justify-end pt-1">
            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-xs text-muted-foreground hover:text-foreground h-7">
              Clear All Filters
            </Button>
          </div>
        )}
      </div>

      {/* Movements Table Card */}
      <TableCard>
        {isLoading ? (
          <TableCardBody className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-card/60 animate-pulse rounded-lg border border-border/40" />
            ))}
          </TableCardBody>
        ) : movements.length === 0 ? (
          <TableCardBody className="flex items-center justify-center p-16">
            <div className="text-center">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-sm font-semibold text-foreground">No stock movements found</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                No inventory adjustment or audit logs match your search filters.
              </p>
            </div>
          </TableCardBody>
        ) : (
          <>
            <TableCardBody>
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-secondary/95 backdrop-blur-md">
                  <TableRow className="bg-muted/30">
                    <TableHead>Date / Time</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="hidden sm:table-cell">SKU</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Qty Change</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Level Change</TableHead>
                    <TableHead className="hidden lg:table-cell">User</TableHead>
                    <TableHead className="hidden md:table-cell">Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((m: any) => {
                    const isQtyIn = m.movementType.includes('IN') || m.movementType === 'OPENING_STOCK' || m.movementType === 'INITIAL_IMPORT';
                    return (
                      <TableRow key={m.id} className="hover:bg-muted/20 text-xs">
                        <TableCell className="whitespace-nowrap">
                          {new Date(m.createdAt).toLocaleDateString()} {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">{m.product?.name}</TableCell>
                        <TableCell className="font-mono text-[11px] uppercase hidden sm:table-cell">{m.product?.sku}</TableCell>
                        <TableCell>{getMovementBadge(m.movementType)}</TableCell>
                        <TableCell className={`text-right font-semibold font-mono ${isQtyIn ? 'text-emerald-500' : 'text-red-500'}`}>
                          {isQtyIn ? '+' : '-'}{m.quantity}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground hidden md:table-cell">
                          {m.previousQuantity} → {m.newQuantity}
                        </TableCell>
                        <TableCell className="font-medium text-foreground flex items-center gap-1 hidden lg:table-cell">
                          <User className="h-3.5 w-3.5 text-muted-foreground" /> {m.user?.name || 'System'}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate hidden md:table-cell" title={m.reason}>
                          {m.reason}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
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
                itemLabel="stock movements"
              />
            </TableCardFooter>
          </>
        )}
      </TableCard>
    </AppShell>
  );
}
