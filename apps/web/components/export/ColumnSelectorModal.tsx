'use client';

import React, { useState } from 'react';
import { Settings, Check, X } from 'lucide-react';

export interface ColumnOption {
  key: string;
  label: string;
  visible: boolean;
}

interface ColumnSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: ColumnOption[];
  onApply: (selectedKeys: string[]) => void;
}

export function ColumnSelectorModal({
  isOpen,
  onClose,
  columns: initialColumns,
  onApply,
}: ColumnSelectorModalProps) {
  const [columns, setColumns] = useState<ColumnOption[]>(initialColumns);

  if (!isOpen) return null;

  const toggleColumn = (key: string) => {
    setColumns((prev) =>
      prev.map((col) => (col.key === key ? { ...col, visible: !col.visible } : col))
    );
  };

  const handleSelectAll = () => {
    setColumns((prev) => prev.map((col) => ({ ...col, visible: true })));
  };

  const handleDeselectAll = () => {
    setColumns((prev) => prev.map((col) => ({ ...col, visible: false })));
  };

  const handleSave = () => {
    const selected = columns.filter((c) => c.visible).map((c) => c.key);
    onApply(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Configure Export Columns</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Select columns to include in exported file:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-primary hover:underline"
            >
              Select All
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="text-muted-foreground hover:underline"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2 pr-1">
          {columns.map((col) => (
            <label
              key={col.key}
              onClick={() => toggleColumn(col.key)}
              className="flex items-center justify-between rounded-lg border border-border/40 bg-secondary/20 p-2.5 text-sm cursor-pointer hover:bg-secondary/40 transition-colors"
            >
              <span className="font-medium text-foreground">{col.label}</span>
              <div
                className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                  col.visible
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background'
                }`}
              >
                {col.visible && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </div>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/40">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-colors"
          >
            Apply & Save
          </button>
        </div>
      </div>
    </div>
  );
}
