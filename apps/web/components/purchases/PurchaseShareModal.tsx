'use client';

import React, { useState } from 'react';
import { X, Copy, Share2, MessageSquare, Download, Check } from 'lucide-react';
import { purchasesService } from '../../services/purchasesService';

interface PurchaseShareModalProps {
  isOpen: boolean;
  purchase: any;
  onClose: () => void;
}

export function PurchaseShareModal({ isOpen, purchase, onClose }: PurchaseShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sharePayload, setSharePayload] = useState<any>(null);

  React.useEffect(() => {
    async function initSharePayload() {
      if (isOpen && purchase?.id) {
        try {
          setLoading(true);
          const res = await purchasesService.sharePurchaseWhatsApp(purchase.id);
          if (res?.data) {
            setSharePayload(res.data);
          }
        } catch (err) {
          console.error('Failed to prepare WhatsApp share payload', err);
        } finally {
          setLoading(false);
        }
      }
    }
    initSharePayload();
  }, [isOpen, purchase?.id]);

  if (!isOpen || !purchase) return null;

  const supplierPhone = sharePayload?.supplierPhone || purchase.supplier?.phone || '';
  const cleanPhone = supplierPhone.replace(/[^0-9]/g, '');

  const textMessage = sharePayload?.formattedMessage || `Hello ${purchase.supplier?.name || 'Supplier'},

Please find Purchase Bill #${purchase.purchaseNumber} details:
Total Amount: ₹${(purchase.totalAmount || 0).toLocaleString('en-IN')}
Paid Amount: ₹${(purchase.paidAmount || 0).toLocaleString('en-IN')}
Outstanding Due: ₹${(purchase.dueAmount || 0).toLocaleString('en-IN')}

Thank you!`;

  const encodedMessage = encodeURIComponent(textMessage);

  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodedMessage}`
    : `https://api.whatsapp.com/send?text=${encodedMessage}`;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(textMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Purchase Bill ${purchase.purchaseNumber}`,
          text: textMessage,
          url: sharePayload?.publicShareUrl || window.location.href,
        });
      } catch (err) {
        console.log('Share dismissed or failed', err);
      }
    } else {
      handleCopyMessage();
    }
  };

  const downloadUrl = purchasesService.getPdfDownloadUrl(purchase.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Share Purchase Bill</h3>
              <p className="text-xs text-slate-500">{purchase.purchaseNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Summary Card */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Supplier:</span>
              <span className="font-bold text-slate-900">{purchase.supplier?.name || 'Direct Supplier'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Total Bill:</span>
              <span className="font-semibold text-slate-800">₹{(purchase.totalAmount || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Outstanding Due:</span>
              <span className="font-bold text-red-600">₹{(purchase.dueAmount || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Message Preview */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Pre-filled WhatsApp Message:</label>
            <textarea
              readOnly
              rows={6}
              value={textMessage}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-700 focus:outline-none resize-none"
            />
          </div>

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Open WhatsApp
            </a>

            <button
              onClick={handleCopyMessage}
              className="inline-flex items-center justify-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1.5 text-emerald-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1.5 text-slate-500" />
                  Copy Message
                </>
              )}
            </button>

            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-all"
            >
              <Download className="w-4 h-4 mr-1.5 text-slate-500" />
              Download PDF
            </a>

            <button
              onClick={handleNativeShare}
              className="inline-flex items-center justify-center px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <Share2 className="w-4 h-4 mr-1.5" />
              Share Document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
