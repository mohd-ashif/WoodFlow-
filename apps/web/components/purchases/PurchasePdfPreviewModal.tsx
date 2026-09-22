'use client';

import React from 'react';
import { X, Printer, Download, MessageSquare, Eye } from 'lucide-react';
import { purchasesService } from '../../services/purchasesService';

interface PurchasePdfPreviewModalProps {
  isOpen: boolean;
  purchase: any;
  onClose: () => void;
  onOpenShareModal?: () => void;
}

export function PurchasePdfPreviewModal({
  isOpen,
  purchase,
  onClose,
  onOpenShareModal,
}: PurchasePdfPreviewModalProps) {
  if (!isOpen || !purchase) return null;

  const previewUrl = purchasesService.getPdfPreviewUrl(purchase.id);
  const downloadUrl = purchasesService.getPdfDownloadUrl(purchase.id);

  const handlePrint = () => {
    const iframeEl = document.getElementById('purchase-pdf-iframe') as HTMLIFrameElement;
    if (iframeEl && iframeEl.contentWindow) {
      iframeEl.contentWindow.focus();
      iframeEl.contentWindow.print();
    } else {
      window.open(previewUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Purchase Bill Preview</h3>
              <p className="text-xs text-slate-500 font-mono">{purchase.purchaseNumber}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Print
            </button>

            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Download PDF
            </a>

            {onOpenShareModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenShareModal();
                }}
                className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
              >
                <MessageSquare className="w-4 h-4 mr-1.5" />
                WhatsApp Share
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Iframe Document Container */}
        <div className="flex-1 bg-slate-100 p-4 overflow-hidden relative">
          <iframe
            id="purchase-pdf-iframe"
            src={previewUrl}
            className="w-full h-full rounded-lg border border-slate-300 shadow-md bg-white"
            title={`Purchase Bill Preview - ${purchase.purchaseNumber}`}
          />
        </div>
      </div>
    </div>
  );
}
