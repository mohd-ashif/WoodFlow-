'use client';

import React, { useState, useEffect } from 'react';
import { X, FileSpreadsheet, FileText, Download, Filter } from 'lucide-react';
import { Button } from '../ui/Button';
import { useQuery } from '@tanstack/react-query';
import { crmService } from '../../services/crmService';

interface InvoiceExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFilters?: {
    search?: string;
    customerId?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
  };
}

export function InvoiceExportModal({ isOpen, onClose, initialFilters = {} }: InvoiceExportModalProps) {
  const [fromDate, setFromDate] = useState(initialFilters.fromDate || '');
  const [toDate, setToDate] = useState(initialFilters.toDate || '');
  const [customerId, setCustomerId] = useState(initialFilters.customerId || '');
  const [paymentStatus, setPaymentStatus] = useState(initialFilters.status || '');
  const [format, setFormat] = useState<'csv' | 'excel' | 'pdf'>('csv');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFromDate(initialFilters.fromDate || '');
      setToDate(initialFilters.toDate || '');
      setCustomerId(initialFilters.customerId || '');
      setPaymentStatus(initialFilters.status || '');
    }
  }, [isOpen, initialFilters]);

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => crmService.getCustomers({ limit: 100 }),
    enabled: isOpen,
  });

  const customersList = Array.isArray(customersData) ? customersData : (customersData as any)?.items || [];

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);
      if (customerId) params.append('customerId', customerId);
      if (paymentStatus) params.append('status', paymentStatus);
      params.append('format', format);

      // Trigger backend download
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      const response = await fetch(`${API_BASE}/invoices/export?${params.toString()}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('Export failed. Please try again.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileExt = format === 'excel' ? 'xlsx' : format === 'pdf' ? 'pdf' : 'csv';
      a.download = `Invoices_Export_${new Date().toISOString().split('T')[0]}.${fileExt}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error exporting invoices');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Dialog Sheet */}
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-150 z-10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-foreground">Export Invoices</h2>
              <p className="text-[11px] text-muted-foreground">Select date range, filters & format</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form Controls */}
        <div className="p-4 sm:p-5 space-y-4 text-xs">
          {/* Date Range */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Date Range</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-muted-foreground block mb-0.5">From Date</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full h-9 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block mb-0.5">To Date</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full h-9 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Customer Filter */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Customer</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="">All Customers</option>
              {customersList.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Payment Status</label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="">All Payment Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>

          {/* Export Format Radio */}
          <div className="space-y-2 pt-1 border-t border-border/60">
            <label className="font-semibold text-foreground block">File Format</label>
            <div className="grid grid-cols-3 gap-2">
              <label
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border cursor-pointer transition-colors ${
                  format === 'csv'
                    ? 'border-primary bg-primary/10 text-primary font-bold'
                    : 'border-border bg-secondary/20 text-muted-foreground hover:bg-secondary/40'
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={format === 'csv'}
                  onChange={() => setFormat('csv')}
                  className="sr-only"
                />
                <FileText className="h-5 w-5 mb-1" />
                <span className="text-[11px]">CSV</span>
              </label>

              <label
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border cursor-pointer transition-colors ${
                  format === 'excel'
                    ? 'border-primary bg-primary/10 text-primary font-bold'
                    : 'border-border bg-secondary/20 text-muted-foreground hover:bg-secondary/40'
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value="excel"
                  checked={format === 'excel'}
                  onChange={() => setFormat('excel')}
                  className="sr-only"
                />
                <FileSpreadsheet className="h-5 w-5 mb-1" />
                <span className="text-[11px]">Excel</span>
              </label>

              <label
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border cursor-pointer transition-colors ${
                  format === 'pdf'
                    ? 'border-primary bg-primary/10 text-primary font-bold'
                    : 'border-border bg-secondary/20 text-muted-foreground hover:bg-secondary/40'
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value="pdf"
                  checked={format === 'pdf'}
                  onChange={() => setFormat('pdf')}
                  className="sr-only"
                />
                <FileText className="h-5 w-5 mb-1" />
                <span className="text-[11px]">PDF</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-border bg-secondary/30 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            className="gap-2 font-bold shadow-md shadow-primary/20"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? 'Generating...' : 'Export'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
