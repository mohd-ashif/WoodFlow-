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
    <div className="p-2.5 sm:p-3.5 border-t border-border/60 bg-card/40 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 text-xs w-full min-w-0">
      {/* Items range summary */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 text-muted-foreground w-full sm:w-auto">
        <span className="text-center sm:text-left">
          Showing <strong className="font-mono text-foreground">{startItem}</strong>–
          <strong className="font-mono text-foreground">{endItem}</strong> of{' '}
          <strong className="font-mono text-foreground">{totalItems}</strong> {itemLabel}
        </span>

        {/* Rows per page selector */}
        {onLimitChange && (
          <div className="flex items-center gap-1.5 border-l border-border/60 pl-2 sm:pl-3">
            <span className="text-muted-foreground/80 text-[11px] sm:text-xs">Rows:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="bg-secondary/60 border border-border/80 rounded px-1.5 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
      <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
        <span className="text-muted-foreground text-[11px] sm:text-xs">
          Page <strong className="font-mono text-foreground">{currentPage}</strong> /{' '}
          <strong className="font-mono text-foreground">{safeTotalPages}</strong>
        </span>

        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7 sm:h-8 sm:w-8"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(1)}
            title="First Page"
          >
            <ChevronsLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs sm:h-8 sm:px-2.5 gap-1"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden xs:inline">Prev</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs sm:h-8 sm:px-2.5 gap-1"
            disabled={currentPage >= safeTotalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <span className="hidden xs:inline">Next</span> <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7 sm:h-8 sm:w-8"
            disabled={currentPage >= safeTotalPages}
            onClick={() => onPageChange(safeTotalPages)}
            title="Last Page"
          >
            <ChevronsRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
