'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Download, FileText, FileSpreadsheet, FileDown, Settings, Loader2, ChevronDown } from 'lucide-react';
import toast from '../ui/Toast';
import { analyticsService } from '../../services/analyticsService';
import { ColumnSelectorModal, ColumnOption } from '../export/ColumnSelectorModal';

interface ExportButtonProps {
  reportType: 'sales' | 'inventory' | 'purchases' | 'customers' | 'suppliers' | 'finance' | 'expenses' | 'cash-flow' | 'production';
  preset?: string;
  startDate?: string;
  endDate?: string;
  label?: string;
  columns?: { key: string; label: string }[];
}

export function ExportButton({
  reportType,
  preset,
  startDate,
  endDate,
  label = 'Export',
  columns: initialColumns = [],
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const defaultCols: ColumnOption[] = initialColumns.map((c) => ({
    key: c.key,
    label: c.label,
    visible: true,
  }));

  const [columnConfig, setColumnConfig] = useState<ColumnOption[]>(defaultCols);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      setIsExporting(true);
      setIsOpen(false);
      await analyticsService.downloadReport(reportType, format, { preset, startDate, endDate });
      toast.success(`${reportType.toUpperCase()} exported as ${format.toUpperCase()} successfully`);
    } catch (err: any) {
      toast.error(err?.message || `Failed to export report as ${format.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="gap-2 text-xs border-primary/30 text-primary hover:bg-primary/10 shadow-sm"
      >
        {isExporting ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <Download className="h-3.5 w-3.5" />
            <span>{label}</span>
            <ChevronDown className="h-3 w-3 opacity-70" />
          </>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95">
          <div className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Export Options
          </div>
          <button
            onClick={() => handleExport('pdf')}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-secondary/70 transition-colors"
          >
            <FileText className="h-4 w-4 text-red-400" />
            <span>Export as PDF</span>
          </button>

          <button
            onClick={() => handleExport('excel')}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-secondary/70 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            <span>Export as Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => handleExport('csv')}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-secondary/70 transition-colors"
          >
            <FileDown className="h-4 w-4 text-blue-400" />
            <span>Export as CSV</span>
          </button>

          {columnConfig.length > 0 && (
            <>
              <div className="my-1 border-t border-border/40" />
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsModalOpen(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary/70 hover:text-foreground transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Select Columns</span>
              </button>
            </>
          )}
        </div>
      )}

      {columnConfig.length > 0 && (
        <ColumnSelectorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          columns={columnConfig}
          onApply={(selectedKeys) => {
            setColumnConfig((prev) =>
              prev.map((col) => ({ ...col, visible: selectedKeys.includes(col.key) }))
            );
            toast.success('Column configuration applied');
          }}
        />
      )}
    </div>
  );
}
