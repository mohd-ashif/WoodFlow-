'use client';

import React, { useState } from 'react';
import { Navbar } from '../../../components/layout/Navbar';
import { Sidebar } from '../../../components/layout/Sidebar';
import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../../../services/inventoryService';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { Clock, Search, ChevronLeft, ChevronRight, User, SlidersHorizontal, RefreshCw } from 'lucide-react';

import { useDebounce } from '../../../hooks/useDebounce';
import { useStockMovements } from '../../../hooks/useInventory';

export default function StockMovementsPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [movementType, setMovementType] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Query Movements via custom hook (uses keepPreviousData)
  const { data: moveData, isLoading, refetch } = useStockMovements({
    search: debouncedSearch,
    movementType,
    createdBy,
    startDate,
    endDate,
    page,
    limit: 20,
  });

  const movements = (moveData as any)?.data || [];
  const pagination = (moveData as any)?.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 };

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
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex flex-1 min-h-0 w-full max-w-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 overflow-y-auto custom-scrollbar min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" /> Stock Movements
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Audit trail of all inventory changes, adjustments, and receipts.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2 border-border/80"
            >
              <RefreshCw className="h-4 w-4" /> Refresh Logs
            </Button>
          </div>

          {/* Filters Panel */}
          <div className="bg-card/40 border border-border p-4 rounded-xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Product search */}
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search product name, SKU..."
                  value={search}
                  onChange={(e: any) => setSearch(e.target.value)}
                  className="pl-9 bg-background/50 border-border/80"
                />
              </div>

              {/* Movement Type dropdown */}
              <select
                value={movementType}
                onChange={(e: any) => {
                  setMovementType(e.target.value);
                  setPage(1);
                }}
                className="h-10 text-sm rounded-lg border border-border bg-background px-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/80"
              >
                <option value="">All Movement Types</option>
                <option value="OPENING_STOCK">Opening Stock</option>
                <option value="STOCK_ADJUSTMENT_IN">Adjustment In (+)</option>
                <option value="STOCK_ADJUSTMENT_OUT">Adjustment Out (-)</option>
                <option value="STOCK_CORRECTION">Stock Correction</option>
                <option value="DAMAGE">Damage</option>
                <option value="LOST">Lost</option>
                <option value="INITIAL_IMPORT">Initial Import</option>
              </select>

              {/* Start Date */}
              <Input
                type="date"
                value={startDate}
                onChange={(e: any) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="bg-background/50 border-border/80 text-sm"
                placeholder="Start Date"
              />

              {/* End Date */}
              <Input
                type="date"
                value={endDate}
                onChange={(e: any) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="bg-background/50 border-border/80 text-sm"
                placeholder="End Date"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4.5 w-4.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Use filters above to narrow logs.</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleClearFilters} className="text-xs h-8 border-border/80">
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Table display */}
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-10 bg-card rounded-lg" />
              <div className="h-20 bg-card rounded-lg" />
            </div>
          ) : movements.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/85 p-16 text-center">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground/60" />
              <h3 className="mt-4 text-sm font-semibold text-foreground">No stock movements yet</h3>
              <p className="mt-1 text-xs text-muted-foreground">Adjust filters or record stock changes to populate this table.</p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-border bg-card/30 overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Date / Time</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Qty Change</TableHead>
                      <TableHead className="text-right">Level Change</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Reason</TableHead>
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
                          <TableCell className="font-mono text-[11px] uppercase">{m.product?.sku}</TableCell>
                          <TableCell>{getMovementBadge(m.movementType)}</TableCell>
                          <TableCell className={`text-right font-semibold font-mono ${isQtyIn ? 'text-emerald-500' : 'text-red-500'}`}>
                            {isQtyIn ? '+' : '-'}{m.quantity}
                          </TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground">
                            {m.previousQuantity} → {m.newQuantity}
                          </TableCell>
                          <TableCell className="font-medium text-foreground flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-muted-foreground" /> {m.user?.name || 'System'}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[200px] truncate" title={m.reason}>
                            {m.reason}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <span className="text-xs text-muted-foreground">
                    Showing {(page - 1) * 20 + 1} - {Math.min(page * 20, pagination.total)} of {pagination.total} movements
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1} className="border-border/80">
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    <span className="text-xs font-semibold">
                      Page {page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
                      disabled={page === pagination.totalPages}
                      className="border-border/80"
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
