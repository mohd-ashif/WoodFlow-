'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Building2, Printer, CheckCircle2, AlertCircle, FileText, Download } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';

export default function PublicInvoicePage() {
  const params = useParams();
  const token = params.token as string;

  const { data: responseData, isLoading, error } = useQuery({
    queryKey: ['public-invoice', token],
    queryFn: async () => {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
      const res = await fetch(`${API_BASE}/invoices/public/${token}`);
      if (!res.ok) {
        throw new Error('Public invoice not found or link has expired');
      }
      const json = await res.json();
      return json.data;
    },
    enabled: Boolean(token),
  });

  const invoice = responseData;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-neutral-400 font-medium">Loading Tax Invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold">Invoice Link Expired or Invalid</h2>
          <p className="text-xs text-neutral-400">
            Please contact the merchant for an updated invoice link or receipt.
          </p>
        </div>
      </div>
    );
  }

  const company = invoice.company || {};
  const sale = invoice.sale || {};
  const items = sale.items || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center py-8 px-4 print:p-0 print:bg-white print:text-black">
      {/* Screen Toolbar */}
      <div className="w-full max-w-3xl flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <span className="text-xs text-neutral-400">Verified Merchant Document</span>
        </div>
        <Button size="sm" onClick={handlePrint} className="gap-2 font-semibold shadow-lg">
          <Printer className="h-4 w-4" /> Print / Save PDF
        </Button>
      </div>

      {/* Invoice Card Box */}
      <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 sm:p-10 print:shadow-none print:border-none print:rounded-none print:p-0 print:max-w-none print:w-full print:bg-white print:text-black">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-neutral-800 print:border-neutral-300 pb-6 gap-6">
          <div>
            <div className="flex items-center gap-2.5">
              <Building2 className="h-7 w-7 text-primary print:text-black" />
              <h1 className="text-2xl font-bold tracking-tight text-white print:text-black">
                {company.name || 'Furniture OS'}
              </h1>
            </div>
            {company.address && (
              <p className="text-xs text-neutral-400 print:text-neutral-700 mt-1 max-w-sm">
                {company.address}, {company.city}, {company.state} {company.postalCode}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-neutral-400 print:text-neutral-700 mt-2">
              {company.phone && <span>Phone: {company.phone}</span>}
              {company.gstNumber && <span className="font-mono">GSTIN: {company.gstNumber}</span>}
            </div>
          </div>

          <div className="sm:text-right space-y-1">
            <h2 className="text-xl font-black uppercase tracking-wider text-emerald-400 print:text-black">
              TAX INVOICE
            </h2>
            <p className="text-base font-mono font-bold text-white print:text-black">{invoice.invoiceNumber}</p>
            <p className="text-xs text-neutral-400 print:text-neutral-700">
              Date:{' '}
              {new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Customer & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 text-xs border-b border-neutral-800 print:border-neutral-300 pb-6">
          <div>
            <h3 className="font-bold text-neutral-400 uppercase text-[10px] tracking-wider mb-1.5 print:text-neutral-600">
              Customer Details
            </h3>
            <p className="text-sm font-bold text-white print:text-black">{invoice.customerNameSnapshot}</p>
            {invoice.customerPhoneSnapshot && (
              <p className="text-neutral-400 print:text-neutral-700 mt-0.5">Phone: {invoice.customerPhoneSnapshot}</p>
            )}
            {invoice.customerEmailSnapshot && (
              <p className="text-neutral-400 print:text-neutral-700 mt-0.5">Email: {invoice.customerEmailSnapshot}</p>
            )}
            {invoice.billingAddress && (
              <p className="text-neutral-400 print:text-neutral-700 mt-1 italic">
                Address: {invoice.billingAddress}
              </p>
            )}
          </div>

          <div className="sm:text-right space-y-1">
            <h3 className="font-bold text-neutral-400 uppercase text-[10px] tracking-wider mb-1.5 print:text-neutral-600">
              Payment Status
            </h3>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                sale.paymentStatus === 'PAID'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 print:bg-neutral-200 print:text-black'
                  : sale.paymentStatus === 'PARTIALLY_PAID'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 print:bg-neutral-200 print:text-black'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30 print:bg-neutral-200 print:text-black'
              }`}
            >
              {sale.paymentStatus || 'UNPAID'}
            </span>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="my-6 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 uppercase tracking-wider text-[10px] print:border-black print:text-black">
                <th className="py-2.5 px-2">#</th>
                <th className="py-2.5 px-2">Item Description</th>
                <th className="py-2.5 px-2 text-center">Qty</th>
                <th className="py-2.5 px-2 text-right">Unit Price</th>
                <th className="py-2.5 px-2 text-right">Discount</th>
                <th className="py-2.5 px-2 text-right">GST %</th>
                <th className="py-2.5 px-2 text-right">GST Amt</th>
                <th className="py-2.5 px-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 print:divide-neutral-300 text-neutral-200 print:text-black">
              {items.map((item: any, idx: number) => {
                const taxRate = item.taxRate || 18;
                const taxableLine = Math.max(0, (item.unitPrice * item.quantity) - (item.discountAmount || 0));
                const lineTaxAmount = item.taxAmount !== undefined && item.taxAmount > 0
                  ? item.taxAmount
                  : Math.round(((taxableLine * taxRate) / 100) * 100) / 100;

                return (
                  <tr key={idx}>
                    <td className="py-3 px-2 font-mono text-neutral-500 print:text-neutral-600">{idx + 1}</td>
                    <td className="py-3 px-2 font-semibold text-white print:text-black">{item.productNameSnapshot}</td>
                    <td className="py-3 px-2 text-center font-mono font-semibold">{item.quantity}</td>
                    <td className="py-3 px-2 text-right font-mono">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-2 text-right font-mono text-neutral-400 print:text-neutral-600">
                      ₹{(item.discountAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-neutral-400 print:text-neutral-600">
                      {taxRate}%
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-neutral-400 print:text-neutral-600">
                      ₹{lineTaxAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-white print:text-black">
                      ₹{item.totalAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pricing Summary */}
        <div className="flex justify-end my-6">
          <div className="w-full max-w-xs space-y-2 text-xs font-mono text-neutral-200 print:text-black border-t border-neutral-800 print:border-black pt-4">
            <div className="flex justify-between text-neutral-400 print:text-neutral-700">
              <span>Taxable Subtotal:</span>
              <span>₹{invoice.subtotal.toLocaleString('en-IN')}</span>
            </div>

            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-neutral-400 print:text-neutral-700">
                <span>Discount:</span>
                <span>- ₹{invoice.discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}

            {(() => {
              const totalTax = invoice.taxAmount || 0;
              const halfTax = Math.round((totalTax / 2) * 100) / 100;
              return (
                <>
                  <div className="flex justify-between text-neutral-400 print:text-neutral-700">
                    <span>CGST (Central Tax):</span>
                    <span>+ ₹{halfTax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400 print:text-neutral-700">
                    <span>SGST (State Tax):</span>
                    <span>+ ₹{halfTax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400 print:text-neutral-700 font-semibold">
                    <span>Total GST Amount:</span>
                    <span>+ ₹{totalTax.toLocaleString('en-IN')}</span>
                  </div>
                </>
              );
            })()}

            <div className="border-t border-neutral-800 print:border-black pt-2 flex justify-between text-base font-bold font-sans text-white print:text-black">
              <span>Grand Total (Inc. GST):</span>
              <span className="font-mono text-emerald-400 print:text-black">
                ₹{invoice.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-800 print:border-neutral-300 pt-6 mt-10 text-center text-xs text-neutral-500 print:text-neutral-600">
          <p className="font-semibold text-neutral-300 print:text-black">Thank you for your business!</p>
          <p className="mt-1 text-[11px]">This is a computer-generated tax receipt issued by {company.name || 'Furniture OS'}.</p>
        </div>
      </div>
    </div>
  );
}
