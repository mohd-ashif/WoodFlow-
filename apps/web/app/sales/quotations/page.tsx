'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Search, ArrowRight, CheckCircle2 } from 'lucide-react';
import { quotationService } from '../../../services/quotationService';

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  async function loadQuotations() {
    try {
      setLoading(true);
      const data = await quotationService.getQuotations();
      setQuotations(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuotations();
  }, []);

  async function handleConvert(id: string) {
    try {
      setConvertingId(id);
      await quotationService.convertToSalesOrder(id);
      await loadQuotations();
    } catch (err: any) {
      alert(err.message || 'Failed to convert quotation to sales order');
    } finally {
      setConvertingId(null);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <FileText className="w-7 h-7 text-indigo-600" />
            <span>Customer Quotations</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Custom price estimates, BOM cost previews & 1-click conversion to Sales Orders
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4">Quotation #</th>
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4 text-right">Subtotal</th>
              <th className="py-3.5 px-4 text-right">Tax</th>
              <th className="py-3.5 px-4 text-right font-bold">Total Amount</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">Loading Quotations...</td>
              </tr>
            ) : quotations.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">No customer quotations found.</td>
              </tr>
            ) : (
              quotations.map((qtn) => (
                <tr key={qtn.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-semibold text-indigo-600">{qtn.quotationNumber}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-900">{qtn.customer?.name || 'Walk-in'}</td>
                  <td className="py-3.5 px-4 text-right">₹{qtn.subtotal.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-4 text-right text-slate-500">₹{qtn.taxAmount.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    ₹{qtn.totalAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      qtn.status === 'CONVERTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {qtn.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {qtn.status !== 'CONVERTED' ? (
                      <button
                        onClick={() => handleConvert(qtn.id)}
                        disabled={convertingId === qtn.id}
                        className="inline-flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded shadow-sm disabled:opacity-50"
                      >
                        <span>Convert to Sales Order</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-600 font-medium inline-flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Converted
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
