'use client';

import React from 'react';
import { AlertCircle, Download } from 'lucide-react';

export interface RowErrorItem {
  row: number;
  field: string;
  message: string;
  value?: any;
}

interface ValidationErrorsProps {
  errors: RowErrorItem[];
  onDownloadReport?: () => void;
}

export const ValidationErrors: React.FC<ValidationErrorsProps> = ({
  errors,
  onDownloadReport,
}) => {
  if (errors.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-800">
        <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-300 text-sm font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
          <span>Found {errors.length} row validation issue(s). Please review below.</span>
        </div>
        {onDownloadReport && (
          <button
            onClick={onDownloadReport}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Error Report</span>
          </button>
        )}
      </div>

      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase">
            <tr>
              <th className="py-2.5 px-3 w-16">Row</th>
              <th className="py-2.5 px-3 w-32">Field Name</th>
              <th className="py-2.5 px-3">Validation Error Description</th>
              <th className="py-2.5 px-3 w-32">Value Provided</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {errors.map((err, idx) => (
              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">#{err.row}</td>
                <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">{err.field}</td>
                <td className="py-2 px-3 text-rose-600 dark:text-rose-400 font-medium">{err.message}</td>
                <td className="py-2 px-3 text-slate-500 font-mono">
                  {err.value !== undefined && err.value !== null ? String(err.value) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
