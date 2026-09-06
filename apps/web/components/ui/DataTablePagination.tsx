'use client';

import React from 'react';
import { Button } from './Button';
import { AppIcon } from './AppIcon';

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
    <div className="px-4 py-3 border-t border-border/80 bg-card/80 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs w-full shrink-0">
      {/* Items range summary */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-muted-foreground w-full sm:w-auto">
        <span className="text-center sm:text-left">
          Showing <strong className="font-mono font-semibold text-foreground">{startItem}</strong>–
          <strong className="font-mono font-semibold text-foreground">{endItem}</strong> of{' '}
          <strong className="font-mono font-semibold text-foreground">{totalItems}</strong> {itemLabel}
        </span>

        {/* Rows per page selector */}
        {onLimitChange && (
          <div className="flex items-center gap-1.5 border-l border-border/60 pl-3">
            <span className="text-muted-foreground text-xs font-medium">Rows:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="bg-secondary/40 border border-border/80 rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
        <span className="text-muted-foreground text-xs font-medium">
          Page <strong className="font-mono font-semibold text-foreground">{currentPage}</strong> /{' '}
          <strong className="font-mono font-semibold text-foreground">{safeTotalPages}</strong>
        </span>

        <div className="flex items-center gap-1">
          <Button
            size="icon-sm"
            variant="outline"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(1)}
            title="First Page"
          >
            <AppIcon name="ChevronsLeft" size="sm" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <AppIcon name="ChevronLeft" size="sm" /> <span className="hidden xs:inline">Prev</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage >= safeTotalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <span className="hidden xs:inline">Next</span> <AppIcon name="ChevronRight" size="sm" />
          </Button>
          <Button
            size="icon-sm"
            variant="outline"
            disabled={currentPage >= safeTotalPages}
            onClick={() => onPageChange(safeTotalPages)}
            title="Last Page"
          >
            <AppIcon name="ChevronsRight" size="sm" />
          </Button>
        </div>
      </div>
    </div>
  );
}
