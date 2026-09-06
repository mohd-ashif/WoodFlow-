'use client';

import React from 'react';
import { AlertCircle, Download, CheckCircle2, AlertTriangle } from 'lucide-react';

export type IssueSeverity = 'BLOCKING_ERROR' | 'WARNING' | 'AUTO_RESOLVED';

export interface RowErrorItem {
  row: number;
  field: string;
  message: string;
  severity?: IssueSeverity;
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
  if (!errors || errors.length === 0) return null;

  const blockingErrors = errors.filter((e) => !e.severity || e.severity === 'BLOCKING_ERROR');
  const warnings = errors.filter((e) => e.severity === 'WARNING');
  const autoResolved = errors.filter((e) => e.severity === 'AUTO_RESOLVED');

  return (
    <div className="space-y-3">
      {/* Header Banner */}
      <div className={`flex items-center justify-between p-3 rounded-xl border ${
        blockingErrors.length > 0
          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
          : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
      }`}>
        <div className="flex items-center space-x-2 text-sm font-medium">
          {blockingErrors.length > 0 ? (
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          )}
          <span className={blockingErrors.length > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}>
            {blockingErrors.length > 0
              ? `${blockingErrors.length} blocking error(s) found. ${warnings.length} warning(s), ${autoResolved.length} auto-resolved.`
              : `All rows valid! ${warnings.length} warning(s), ${autoResolved.length} auto-resolved items.`}
          </span>
        </div>
        {onDownloadReport && (
          <button
            onClick={onDownloadReport}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Log</span>
          </button>
        )}
      </div>

      {/* Errors / Warnings List Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase">
            <tr>
              <th className="py-2.5 px-3 w-16">Row</th>
              <th className="py-2.5 px-3 w-28">Type</th>
              <th className="py-2.5 px-3 w-32">Field Name</th>
              <th className="py-2.5 px-3">Description</th>
              <th className="py-2.5 px-3 w-28">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {errors.map((err, idx) => {
              const sev = err.severity || 'BLOCKING_ERROR';
              return (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">#{err.row}</td>
                  <td className="py-2 px-3">
                    {sev === 'BLOCKING_ERROR' && (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded">
                        <AlertCircle className="w-3 h-3 mr-0.5" /> Error
                      </span>
                    )}
                    {sev === 'WARNING' && (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                        <AlertTriangle className="w-3 h-3 mr-0.5" /> Warning
                      </span>
                    )}
                    {sev === 'AUTO_RESOLVED' && (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3 mr-0.5" /> Auto-Resolved
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">{err.field}</td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-300 font-medium">{err.message}</td>
                  <td className="py-2 px-3 text-slate-500 font-mono">
                    {err.value !== undefined && err.value !== null ? String(err.value) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
