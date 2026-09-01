'use client';

import React, { useState } from 'react';
import { X, Download, ArrowRight, ArrowLeft, CheckCircle2, RefreshCw, Layers } from 'lucide-react';
import toast from '../ui/Toast';
import { FileUploader } from './FileUploader';
import { ColumnMapper, ColumnMappingItem } from './ColumnMapper';
import { ValidationErrors, RowErrorItem } from './ValidationErrors';
import { ImportPreview } from './ImportPreview';

export type ImportModule =
  | 'PRODUCTS'
  | 'CATEGORIES'
  | 'UNITS'
  | 'CUSTOMERS'
  | 'SUPPLIERS'
  | 'WORKERS'
  | 'INVENTORY'
  | 'PURCHASES'
  | 'SALES';

export type DuplicateStrategy = 'SKIP' | 'UPDATE' | 'CREATE_NEW';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: ImportModule;
  moduleTitle: string;
  onImportComplete?: () => void;
}

const MODULE_FIELDS: Record<ImportModule, { field: string; label: string; required?: boolean }[]> = {
  PRODUCTS: [
    { field: 'name', label: 'Product Name', required: true },
    { field: 'sku', label: 'SKU Code', required: true },
    { field: 'category', label: 'Category Name', required: true },
    { field: 'unit', label: 'Unit', required: true },
    { field: 'costPrice', label: 'Cost Price', required: true },
    { field: 'sellingPrice', label: 'Selling Price', required: true },
    { field: 'openingStock', label: 'Opening Stock' },
    { field: 'minimumStock', label: 'Minimum Stock' },
    { field: 'description', label: 'Description' },
  ],
  CATEGORIES: [
    { field: 'name', label: 'Category Name', required: true },
    { field: 'description', label: 'Description' },
  ],
  UNITS: [
    { field: 'name', label: 'Unit Name', required: true },
    { field: 'shortCode', label: 'Short Code', required: true },
  ],
  CUSTOMERS: [
    { field: 'name', label: 'Customer Name', required: true },
    { field: 'phone', label: 'Phone Number', required: true },
    { field: 'email', label: 'Email Address' },
    { field: 'customerCode', label: 'Customer Code' },
    { field: 'gstNumber', label: 'GST Number' },
    { field: 'address', label: 'Address' },
    { field: 'city', label: 'City' },
    { field: 'state', label: 'State' },
    { field: 'postalCode', label: 'Postal Code' },
  ],
  SUPPLIERS: [
    { field: 'name', label: 'Supplier Name', required: true },
    { field: 'phone', label: 'Phone Number', required: true },
    { field: 'email', label: 'Email Address' },
    { field: 'supplierCode', label: 'Supplier Code' },
    { field: 'gstNumber', label: 'GST Number' },
    { field: 'address', label: 'Address' },
    { field: 'city', label: 'City' },
    { field: 'state', label: 'State' },
    { field: 'postalCode', label: 'Postal Code' },
  ],
  WORKERS: [
    { field: 'employeeCode', label: 'Employee Code', required: true },
    { field: 'firstName', label: 'First Name', required: true },
    { field: 'lastName', label: 'Last Name' },
    { field: 'phone', label: 'Phone Number' },
    { field: 'email', label: 'Email Address' },
    { field: 'employmentType', label: 'Employment Type' },
    { field: 'monthlySalary', label: 'Monthly Salary' },
    { field: 'dailyWage', label: 'Daily Wage' },
    { field: 'address', label: 'Address' },
  ],
  INVENTORY: [
    { field: 'name', label: 'Product Name', required: true },
    { field: 'sku', label: 'SKU Code', required: true },
    { field: 'openingStock', label: 'Opening Stock Quantity', required: true },
    { field: 'costPrice', label: 'Cost Price' },
    { field: 'sellingPrice', label: 'Selling Price' },
  ],
  PURCHASES: [
    { field: 'purchaseNumber', label: 'Purchase Number', required: true },
    { field: 'supplierName', label: 'Supplier Name' },
    { field: 'sku', label: 'Product SKU', required: true },
    { field: 'quantity', label: 'Quantity', required: true },
    { field: 'unitPrice', label: 'Unit Price', required: true },
    { field: 'discountAmount', label: 'Discount Amount' },
    { field: 'taxRate', label: 'Tax Rate %' },
    { field: 'paymentStatus', label: 'Payment Status' },
  ],
  SALES: [
    { field: 'invoiceNumber', label: 'Invoice Number', required: true },
    { field: 'customerName', label: 'Customer Name' },
    { field: 'sku', label: 'Product SKU', required: true },
    { field: 'quantity', label: 'Quantity', required: true },
    { field: 'unitPrice', label: 'Unit Price', required: true },
    { field: 'discountAmount', label: 'Discount Amount' },
    { field: 'taxRate', label: 'Tax Rate %' },
    { field: 'paymentStatus', label: 'Payment Status' },
  ],
};

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  module,
  moduleTitle,
  onImportComplete,
}) => {
  const [step, setStep] = useState<number>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [importJobId, setImportJobId] = useState<string | null>(null);

  const [mappings, setMappings] = useState<ColumnMappingItem[]>([]);
  const [validationErrors, setValidationErrors] = useState<RowErrorItem[]>([]);
  const [previewData, setPreviewData] = useState<{
    totalRows: number;
    validRowsCount: number;
    invalidRowsCount: number;
    duplicateRowsCount: number;
    previewSample: Record<string, any>[];
  }>({
    totalRows: 0,
    validRowsCount: 0,
    invalidRowsCount: 0,
    duplicateRowsCount: 0,
    previewSample: [],
  });

  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>('SKIP');
  const [importResult, setImportResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const downloadTemplate = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
      window.open(`${apiUrl}/imports/template/${module}`, '_blank');
      toast.success(`Downloading ${moduleTitle} template...`);
    } catch {
      toast.error('Failed to download template');
    }
  };

  const handleFileUpload = async (file: File) => {
    setSelectedFile(file);
    setIsUploading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
      const formData = new FormData();
      formData.append('file', file);
      formData.append('module', module);

      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/imports/upload`, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to process import file.');
      }

      const { importJobId: jobId, preview } = data.data;
      setImportJobId(jobId);
      setMappings(preview.mappings || []);
      setValidationErrors(preview.errors || []);
      setPreviewData({
        totalRows: preview.totalRows || 0,
        validRowsCount: preview.validRowsCount || 0,
        invalidRowsCount: preview.invalidRowsCount || 0,
        duplicateRowsCount: preview.duplicateRowsCount || 0,
        previewSample: preview.previewSample || [],
      });

      setStep(3); // Proceed to column mapping
      toast.success('File processed! Please review column mappings.');
    } catch (err: any) {
      toast.error(err.message || 'File parsing error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importJobId) return;
    setIsExecuting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
      const token = localStorage.getItem('token');

      const res = await fetch(`${apiUrl}/imports/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          importJobId,
          duplicateStrategy,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to execute data import.');
      }

      setImportResult(data.data);
      setStep(6); // Step 6: Complete
      toast.success('Data import completed successfully!');
      if (onImportComplete) onImportComplete();
    } catch (err: any) {
      toast.error(err.message || 'Import execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const downloadErrorReport = () => {
    if (!importJobId) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    window.open(`${apiUrl}/imports/${importJobId}/errors`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
              <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Import {moduleTitle} Data</span>
            </h3>
            <p className="text-xs text-slate-500">Migrate spreadsheet records directly into FurnitureOS SaaS</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-indigo-50/60 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center space-x-4">
            <span className={step >= 1 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400'}>
              ① Template & Upload
            </span>
            <span className="text-slate-300">→</span>
            <span className={step >= 3 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400'}>
              ② Column Mapping
            </span>
            <span className="text-slate-300">→</span>
            <span className={step >= 4 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400'}>
              ③ Validate & Preview
            </span>
            <span className="text-slate-300">→</span>
            <span className={step >= 6 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400'}>
              ④ Finish
            </span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                    Step 1: Download Import Template
                  </h4>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
                    Download our formatted CSV template with required column headers and sample data.
                  </p>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Template</span>
                </button>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Step 2: Upload Your Spreadsheet File
                </h4>
                <FileUploader onFileSelected={handleFileUpload} />
              </div>

              {isUploading && (
                <div className="flex items-center justify-center space-x-2 py-4 text-sm text-indigo-600 dark:text-indigo-400">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Parsing spreadsheet and running column auto-mapping...</span>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <ColumnMapper
                mappings={mappings}
                availableTargetFields={MODULE_FIELDS[module] || []}
                onMappingChange={setMappings}
              />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              {validationErrors.length > 0 ? (
                <ValidationErrors errors={validationErrors} onDownloadReport={downloadErrorReport} />
              ) : (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center space-x-3 text-emerald-700 dark:text-emerald-300 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>All rows passed validation check! No format errors detected.</span>
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <ImportPreview
              totalRows={previewData.totalRows}
              validRowsCount={previewData.validRowsCount}
              invalidRowsCount={previewData.invalidRowsCount}
              duplicateRowsCount={previewData.duplicateRowsCount}
              duplicateStrategy={duplicateStrategy}
              onStrategyChange={setDuplicateStrategy}
              previewSample={previewData.previewSample}
            />
          )}

          {step === 6 && importResult && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100">Data Import Completed!</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Status: <span className="font-semibold uppercase text-emerald-600">{importResult.status}</span>
              </p>

              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2 text-center">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-xl font-bold">{importResult.totalRows}</div>
                  <div className="text-xs text-slate-500">Total Rows</div>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-lg">
                  <div className="text-xl font-bold">{importResult.successfulRows}</div>
                  <div className="text-xs font-medium">Successful</div>
                </div>
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 rounded-lg">
                  <div className="text-xl font-bold">{importResult.failedRows}</div>
                  <div className="text-xs font-medium">Failed</div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Close & View Records
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        {step < 6 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                className="inline-flex items-center space-x-1.5 px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step === 3 && (
              <button
                onClick={() => setStep(4)}
                className="inline-flex items-center space-x-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                <span>Validate Rows</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 4 && (
              <button
                onClick={() => setStep(5)}
                className="inline-flex items-center space-x-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                <span>Preview Import</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 5 && (
              <button
                onClick={handleConfirmImport}
                disabled={isExecuting}
                className="inline-flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {isExecuting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing Database Transaction...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Execute Import</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
