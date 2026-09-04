'use client';

import React from 'react';
import { Button } from './Button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  itemLabel?: string;
}

export function DataTablePagination({
  currentPage,
  totalPages,
  totalItems,
  limit,
  onPageChange,
  onLimitChange,
  itemLabel = 'items',
}: DataTablePaginationProps) {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalItems);

  return (
    <div className="p-3.5 border-t border-border/60 bg-card/40 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Items range summary */}
      <div className="flex items-center gap-3 text-muted-foreground">
        <span>
          Showing <strong className="font-mono text-foreground">{startItem}</strong> to{' '}
          <strong className="font-mono text-foreground">{endItem}</strong> of{' '}
          <strong className="font-mono text-foreground">{totalItems}</strong> {itemLabel}
        </span>

        {/* Rows per page selector */}
        {onLimitChange && (
          <div className="flex items-center gap-1.5 ml-2 border-l border-border/60 pl-3">
            <span className="text-muted-foreground/80">Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="bg-secondary/60 border border-border/80 rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}
      </div>

      {/* Page controls */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground mr-1">
          Page <strong className="font-mono text-foreground">{currentPage}</strong> of{' '}
          <strong className="font-mono text-foreground">{safeTotalPages}</strong>
        </span>

        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(1)}
            title="First Page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2.5 gap-1"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2.5 gap-1"
            disabled={currentPage >= safeTotalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={currentPage >= safeTotalPages}
            onClick={() => onPageChange(safeTotalPages)}
            title="Last Page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
