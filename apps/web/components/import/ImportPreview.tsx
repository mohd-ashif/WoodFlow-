'use client';

import React from 'react';
import { CheckCircle2, AlertOctagon, Copy, Layers, Sparkles, PlusCircle } from 'lucide-react';
export type DuplicateStrategy = 'SKIP' | 'UPDATE' | 'CREATE_NEW';

export interface MasterDataSummary {
  categories: {
    existingCount: number;
    toCreateCount: number;
    namesToCreate: string[];
    existingNames: string[];
  };
  units: {
    existingCount: number;
    toCreateCount: number;
    namesToCreate: string[];
    existingNames: string[];
  };
}

interface ImportPreviewProps {
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  duplicateRowsCount: number;
  duplicateStrategy: DuplicateStrategy;
  onStrategyChange: (strategy: DuplicateStrategy) => void;
  masterData?: MasterDataSummary;
  previewSample?: Record<string, any>[];
}

export const ImportPreview: React.FC<ImportPreviewProps> = ({
  totalRows,
  validRowsCount,
  invalidRowsCount,
  duplicateRowsCount,
  duplicateStrategy,
  onStrategyChange,
  masterData,
  previewSample = [],
}) => {
  const categoriesToCreate = masterData?.categories?.namesToCreate || [];
  const unitsToCreate = masterData?.units?.namesToCreate || [];
  const hasMastersToCreate = categoriesToCreate.length > 0 || unitsToCreate.length > 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl text-center">
          <div className="flex justify-center text-slate-500 mb-1">
            <Layers className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalRows}</div>
          <div className="text-xs text-slate-500 font-medium">Total Rows</div>
        </div>

        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 p-3.5 rounded-xl text-center">
          <div className="flex justify-center text-emerald-600 dark:text-emerald-400 mb-1">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{validRowsCount}</div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Valid Rows</div>
        </div>

        <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 p-3.5 rounded-xl text-center">
          <div className="flex justify-center text-rose-600 dark:text-rose-400 mb-1">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-rose-700 dark:text-rose-400">{invalidRowsCount}</div>
          <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">Invalid Rows</div>
        </div>

        <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-3.5 rounded-xl text-center">
          <div className="flex justify-center text-amber-600 dark:text-amber-400 mb-1">
            <Copy className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{duplicateRowsCount}</div>
          <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">Duplicates</div>
        </div>
      </div>

      {/* Smart Master Data Resolution Banner */}
      {hasMastersToCreate && (
        <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 p-4 rounded-xl space-y-3">
          <div className="flex items-center space-x-2 text-indigo-900 dark:text-indigo-200 font-semibold text-sm">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Smart Master Data Auto-Resolution</span>
          </div>
          <p className="text-xs text-indigo-700 dark:text-indigo-300">
            The smart import engine will automatically create missing master records in your catalog during import execution:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {categoriesToCreate.length > 0 && (
              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/50 space-y-1.5">
                <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center space-x-1">
                  <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Categories to be Created ({categoriesToCreate.length})</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {categoriesToCreate.map((cat, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300"
                    >
                      ✓ {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {unitsToCreate.length > 0 && (
              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/50 space-y-1.5">
                <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center space-x-1">
                  <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Units to be Created ({unitsToCreate.length})</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {unitsToCreate.map((u, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300"
                    >
                      ✓ {u}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Duplicate Strategy Selector */}
      {duplicateRowsCount > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-xl space-y-3">
          <div className="text-sm font-semibold text-amber-900 dark:text-amber-200 flex items-center space-x-2">
            <Copy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Duplicate Records Handling Strategy</span>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            We detected {duplicateRowsCount} record(s) matching existing data in your system. Choose how to handle them:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <label
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                duplicateStrategy === 'SKIP'
                  ? 'border-amber-500 bg-amber-100/60 dark:bg-amber-900/40 text-amber-950 dark:text-amber-100 font-semibold'
                  : 'border-amber-200 dark:border-amber-800/60 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-amber-50/50'
              }`}
            >
              <input
                type="radio"
                name="duplicateStrategy"
                value="SKIP"
                checked={duplicateStrategy === 'SKIP'}
                onChange={() => onStrategyChange('SKIP')}
                className="mr-2 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-xs">Skip Duplicates (Recommended)</span>
            </label>

            <label
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                duplicateStrategy === 'UPDATE'
                  ? 'border-amber-500 bg-amber-100/60 dark:bg-amber-900/40 text-amber-950 dark:text-amber-100 font-semibold'
                  : 'border-amber-200 dark:border-amber-800/60 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-amber-50/50'
              }`}
            >
              <input
                type="radio"
                name="duplicateStrategy"
                value="UPDATE"
                checked={duplicateStrategy === 'UPDATE'}
                onChange={() => onStrategyChange('UPDATE')}
                className="mr-2 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-xs">Update Existing Records</span>
            </label>

            <label
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                duplicateStrategy === 'CREATE_NEW'
                  ? 'border-amber-500 bg-amber-100/60 dark:bg-amber-900/40 text-amber-950 dark:text-amber-100 font-semibold'
                  : 'border-amber-200 dark:border-amber-800/60 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-amber-50/50'
              }`}
            >
              <input
                type="radio"
                name="duplicateStrategy"
                value="CREATE_NEW"
                checked={duplicateStrategy === 'CREATE_NEW'}
                onChange={() => onStrategyChange('CREATE_NEW')}
                className="mr-2 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-xs">Create New Entries</span>
            </label>
          </div>
        </div>
      )}

      {/* Sample Data Table Preview */}
      {previewSample.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase text-slate-500 tracking-wider flex justify-between items-center">
            <span>Sample Data Preview (First 5-10 Rows)</span>
            <span className="text-[11px] font-normal text-indigo-600 dark:text-indigo-400">
              Master Resolution Active
            </span>
          </div>
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                <tr>
                  {Object.keys(previewSample[0])
                    .filter((k) => !k.startsWith('_'))
                    .map((header) => (
                      <th key={header} className="py-2 px-3 font-semibold whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {previewSample.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    {Object.keys(row)
                      .filter((k) => !k.startsWith('_'))
                      .map((key) => {
                        const val = row[key] !== undefined ? String(row[key]) : '—';
                        const isCat = key.toLowerCase() === 'category';
                        const isUnit = key.toLowerCase() === 'unit';

                        const catRes = row._categoryResolution;
                        const unitRes = row._unitResolution;

                        return (
                          <td key={key} className="py-2 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                            <span>{val}</span>
                            {isCat && catRes && (
                              <span className={`ml-2 inline-flex items-center text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                catRes.created
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}>
                                {catRes.created ? 'Will Be Created' : 'Existing'}
                              </span>
                            )}
                            {isUnit && unitRes && (
                              <span className={`ml-2 inline-flex items-center text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                unitRes.created
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}>
                                {unitRes.created ? 'Will Be Created' : 'Existing'}
                              </span>
                            )}
                          </td>
                        );
                      })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
