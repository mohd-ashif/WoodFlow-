'use client';

import React from 'react';
import { ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';

export interface ColumnMappingItem {
  uploadedColumn: string;
  targetField: string;
  isRequired?: boolean;
}

interface ColumnMapperProps {
  mappings: ColumnMappingItem[];
  availableTargetFields: { field: string; label: string; required?: boolean }[];
  onMappingChange: (updatedMappings: ColumnMappingItem[]) => void;
}

export const ColumnMapper: React.FC<ColumnMapperProps> = ({
  mappings,
  availableTargetFields,
  onMappingChange,
}) => {
  const handleFieldSelect = (uploadedCol: string, newTargetField: string) => {
    const updated = mappings.map((m) =>
      m.uploadedColumn === uploadedCol
        ? {
            ...m,
            targetField: newTargetField,
            isRequired: availableTargetFields.find((f) => f.field === newTargetField)?.required,
          }
        : m
    );
    onMappingChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
        Review column mappings below. The system automatically matched columns from your spreadsheet. You can adjust any incorrect mappings.
      </div>

      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
              <th className="py-3 px-4">Spreadsheet Column Header</th>
              <th className="py-3 px-4 text-center w-12"></th>
              <th className="py-3 px-4">Database Target Field</th>
              <th className="py-3 px-4 text-right">Mapping Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {mappings.map((mapping, idx) => {
              const target = availableTargetFields.find((f) => f.field === mapping.targetField);
              const isMatched = Boolean(mapping.targetField);
              const isRequired = mapping.isRequired || target?.required;

              return (
                <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                    <span className="inline-block bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-xs font-mono">
                      {mapping.uploadedColumn}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-400">
                    <ArrowRight className="w-4 h-4 mx-auto" />
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={mapping.targetField}
                      onChange={(e) => handleFieldSelect(mapping.uploadedColumn, e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="">-- Do Not Import --</option>
                      {availableTargetFields.map((f) => (
                        <option key={f.field} value={f.field}>
                          {f.label} {f.required ? '*' : ''}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {isMatched ? (
                      <span className="inline-flex items-center space-x-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mapped</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Unmapped</span>
                      </span>
                    )}
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
