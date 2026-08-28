'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { salesService } from '../../../services/salesService';
import { Button } from '../../../components/ui/Button';
import Link from 'next/link';
import { Printer, ArrowLeft, Download, Building2, AlertTriangle } from 'lucide-react';

export default function InvoicePrintPage() {
  const params = useParams();
  const invoiceId = params.id as string;

  const { data: responseData, isLoading, error } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => salesService.getInvoiceById(invoiceId),
    enabled: Boolean(invoiceId && invoiceId !== 'undefined'),
  });

  const invoice = (responseData as any)?.data || responseData;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Loading Invoice Preview...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Invoice Not Found</h2>
          <Link href="/invoices">
            <Button size="sm">Back to Invoices</Button>
          </Link>
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
      {/* Screen Toolbar (Hidden when printing) */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-6 print:hidden">
        <Link href="/invoices">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Invoices
          </Button>
        </Link>

        <div className="flex items-center gap-3">
          <Button size="sm" onClick={handlePrint} className="gap-2 font-semibold shadow-lg">
            <Printer className="h-4 w-4" /> Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* Printable Invoice Container (A4 Printable Box) */}
      <div className="w-full max-w-4xl bg-card border border-border/80 rounded-2xl shadow-2xl p-8 sm:p-12 print:shadow-none print:border-none print:rounded-none print:p-0 print:max-w-none print:w-full print:bg-white print:text-black">
        {/* Header: Company Info & Invoice Label */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-border/60 pb-6 gap-6">
          <div>
            <div className="flex items-center gap-2.5">
              <Building2 className="h-7 w-7 text-primary print:text-black" />
              <h1 className="text-2xl font-bold tracking-tight text-foreground print:text-black">
                {company.name || 'Furniture Shop'}
              </h1>
            </div>
            {company.address && (
              <p className="text-xs text-muted-foreground print:text-neutral-700 mt-1 max-w-sm">
                {company.address}, {company.city}, {company.state} {company.postalCode}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground print:text-neutral-700 mt-2">
              {company.phone && <span>Phone: {company.phone}</span>}
              {company.email && <span>Email: {company.email}</span>}
              {company.gstNumber && <span className="font-mono font-semibold">GSTIN: {company.gstNumber}</span>}
            </div>
          </div>

          <div className="sm:text-right space-y-1">
            <h2 className="text-2xl font-black uppercase tracking-wider text-primary print:text-black">
              TAX INVOICE
            </h2>
            <p className="text-lg font-mono font-bold text-foreground print:text-black">{invoice.invoiceNumber}</p>
            <p className="text-xs text-muted-foreground print:text-neutral-700">
              Date:{' '}
              {new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
            {sale.saleNumber && (
              <p className="text-xs font-mono text-muted-foreground print:text-neutral-700">
                Order Ref: {sale.saleNumber}
              </p>
            )}
          </div>
        </div>

        {/* Bill To & Billing Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 text-xs border-b border-border/60 pb-6">
          <div>
            <h3 className="font-bold text-muted-foreground uppercase text-[11px] tracking-wider mb-2 print:text-neutral-600">
              Billed To
            </h3>
            <p className="text-base font-bold text-foreground print:text-black">{invoice.customerNameSnapshot}</p>
            {invoice.customerPhoneSnapshot && (
              <p className="text-muted-foreground print:text-neutral-700 mt-0.5">Phone: {invoice.customerPhoneSnapshot}</p>
            )}
            {invoice.customerEmailSnapshot && (
              <p className="text-muted-foreground print:text-neutral-700 mt-0.5">Email: {invoice.customerEmailSnapshot}</p>
            )}
            {invoice.billingAddress && (
              <p className="text-muted-foreground print:text-neutral-700 mt-1 italic max-w-sm">
                Address: {invoice.billingAddress}
              </p>
            )}
          </div>

          <div className="sm:text-right space-y-1">
            <h3 className="font-bold text-muted-foreground uppercase text-[11px] tracking-wider mb-2 print:text-neutral-600">
              Invoice Status
            </h3>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary print:bg-neutral-200 print:text-black border border-primary/20">
              {invoice.status}
            </span>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="my-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-border/80 text-muted-foreground uppercase tracking-wider text-[11px] print:border-black print:text-black">
                <th className="py-2.5 px-2">S.No</th>
                <th className="py-2.5 px-2">Item Description</th>
                <th className="py-2.5 px-2 font-mono">SKU</th>
                <th className="py-2.5 px-2 text-center">Qty</th>
                <th className="py-2.5 px-2 text-right">Unit Price</th>
                <th className="py-2.5 px-2 text-right">Discount</th>
                <th className="py-2.5 px-2 text-right">GST %</th>
                <th className="py-2.5 px-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 print:divide-neutral-300 text-foreground print:text-black">
              {items.map((item: any, idx: number) => (
                <tr key={item.id || idx}>
                  <td className="py-3 px-2 font-mono text-muted-foreground print:text-neutral-600">{idx + 1}</td>
                  <td className="py-3 px-2 font-semibold">{item.productNameSnapshot}</td>
                  <td className="py-3 px-2 font-mono text-muted-foreground print:text-neutral-600">{item.skuSnapshot}</td>
                  <td className="py-3 px-2 text-center font-mono font-semibold">{item.quantity}</td>
                  <td className="py-3 px-2 text-right font-mono">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-2 text-right font-mono text-muted-foreground print:text-neutral-600">
                    ₹{(item.discountAmount || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-2 text-right font-mono text-muted-foreground print:text-neutral-600">
                    {item.taxRate || 0}%
                  </td>
                  <td className="py-3 px-2 text-right font-mono font-bold">
                    ₹{item.totalAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pricing Summary */}
        <div className="flex justify-end my-6">
          <div className="w-full max-w-xs space-y-2 text-xs font-mono text-foreground print:text-black border-t border-border/80 print:border-black pt-4">
            <div className="flex justify-between text-muted-foreground print:text-neutral-700">
              <span>Subtotal:</span>
              <span>₹{invoice.subtotal.toLocaleString('en-IN')}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-muted-foreground print:text-neutral-700">
                <span>Discount:</span>
                <span>- ₹{invoice.discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground print:text-neutral-700">
              <span>GST Tax Amount:</span>
              <span>+ ₹{invoice.taxAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="border-t border-border/80 print:border-black pt-2 flex justify-between text-base font-bold font-sans">
              <span>Grand Total:</span>
              <span className="font-mono text-primary print:text-black">
                ₹{invoice.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border/60 pt-6 mt-12 text-center text-xs text-muted-foreground print:text-neutral-600">
          <p className="font-semibold text-foreground print:text-black">Thank you for your business!</p>
          <p className="mt-1 text-[11px]">This is a computer-generated tax invoice issued by {company.name || 'Furniture OS'}.</p>
        </div>
      </div>
    </div>
  );
}
