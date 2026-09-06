'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  FileText,
  User,
  DollarSign,
  Download,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { fetchApi } from '../../lib/api';
import Link from 'next/link';

interface ShareInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  invoiceNumber?: string;
  customerName?: string;
  totalAmount?: number;
  customerId?: string;
}

export function ShareInvoiceModal({
  isOpen,
  onClose,
  invoiceId,
  invoiceNumber,
  customerName,
  totalAmount,
  customerId,
}: ShareInvoiceModalProps) {
  const [loading, setLoading] = useState(false);
  const [shareData, setShareData] = useState<{
    whatsappUrl: string;
    prefilledMessage: string;
    normalizedPhone: string;
    formattedDisplayPhone: string;
    invoiceUrl: string;
    phoneValid: boolean;
    errorReason?: string;
    customerName?: string;
    customerPhone?: string;
  } | null>(null);

  const [message, setMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  useEffect(() => {
    if (isOpen && invoiceId) {
      fetchSharePayload();
    }
  }, [isOpen, invoiceId]);

  const fetchSharePayload = async (overridePhone?: string) => {
    setLoading(true);
    try {
      const body: any = {};
      if (overridePhone) {
        body.updatedPhone = overridePhone;
      }
      const res = await fetchApi<any>(
        `/invoices/${invoiceId}/share/whatsapp`,
        { method: 'POST', body: JSON.stringify(body) }
      );
      const payload = res?.data !== undefined ? res.data : res;
      if (payload) {
        setShareData(payload);
        if (payload.prefilledMessage) {
          setMessage(payload.prefilledMessage);
        }
      }
    } catch (err: any) {
      console.error('Failed to prepare WhatsApp share:', err);
    } finally {
      setLoading(false);
      setSavingPhone(false);
    }
  };

  const handleSavePhone = () => {
    if (!phoneInput.trim()) return;
    setSavingPhone(true);
    fetchSharePayload(phoneInput.trim());
  };

  if (!isOpen) return null;

  const handleWhatsAppClick = () => {
    if (!shareData || !shareData.normalizedPhone) return;

    // Recalculate WhatsApp URL if user customized text in textarea
    const encodedText = encodeURIComponent(message || shareData.prefilledMessage);
    const finalUrl = `https://wa.me/${shareData.normalizedPhone}?text=${encodedText}`;

    // Open WhatsApp / WhatsApp Web
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleCopyLink = () => {
    if (shareData?.invoiceUrl) {
      navigator.clipboard.writeText(shareData.invoiceUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyMessage = () => {
    if (message) {
      navigator.clipboard.writeText(message);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal Sheet */}
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-150 z-10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-foreground">Share Invoice via WhatsApp</h2>
              <p className="text-[11px] text-muted-foreground">Official wa.me Click-to-Chat sharing</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 text-xs">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              Generating secure invoice sharing link...
            </div>
          ) : (
            <>
              {/* Customer & Phone Card */}
              <div className="rounded-xl border border-border bg-secondary/20 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-muted-foreground flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                    <User className="h-3.5 w-3.5 text-primary" /> Customer Details
                  </span>
                  {shareData?.phoneValid ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      Valid WhatsApp Number
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                      Number Missing / Invalid
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-foreground">{shareData?.customerName || customerName || 'Customer'}</span>
                  <span className="font-mono text-muted-foreground">
                    {shareData?.formattedDisplayPhone || 'No Phone'}
                  </span>
                </div>

                {!shareData?.phoneValid && (
                  <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 space-y-2 text-amber-200">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] leading-snug">
                          {shareData?.errorReason || 'Customer mobile number is required to send via WhatsApp.'}
                        </p>
                      </div>
                      {customerId && (
                        <Link href={`/crm/customers`} onClick={onClose}>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] border-amber-500/40 text-amber-300">
                            Edit in CRM
                          </Button>
                        </Link>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-amber-500/20">
                      <input
                        type="text"
                        placeholder="Enter 10-digit phone number..."
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="h-8 flex-1 rounded-lg border border-amber-500/40 bg-background/80 px-3 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <Button
                        size="sm"
                        onClick={handleSavePhone}
                        disabled={!phoneInput.trim() || savingPhone}
                        className="h-8 px-3 text-xs bg-amber-600 hover:bg-amber-500 text-white font-bold"
                      >
                        {savingPhone ? 'Saving...' : 'Update & Share'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-foreground">Pre-filled WhatsApp Message</label>
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    {copiedMessage ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedMessage ? 'Copied' : 'Copy Message'}</span>
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-3 text-xs font-sans text-foreground leading-relaxed focus:ring-2 focus:ring-primary focus:outline-none custom-scrollbar"
                />
              </div>

              {/* Secure Link Banner */}
              {shareData?.invoiceUrl && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase block">
                      Secure Public Link
                    </span>
                    <p className="text-[11px] font-mono text-foreground truncate mt-0.5">
                      {shareData.invoiceUrl}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyLink}
                    className="h-8 px-2.5 text-xs gap-1 shrink-0"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-border bg-secondary/30 flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {invoiceId && (
              <Link href={`/invoices/${invoiceId}`} onClick={onClose}>
                <Button variant="outline" size="sm" className="gap-1 text-xs">
                  <FileText className="h-3.5 w-3.5" />
                  <span>View PDF</span>
                </Button>
              </Link>
            )}

            <Button
              size="sm"
              disabled={!shareData?.phoneValid || loading}
              onClick={handleWhatsAppClick}
              className="gap-2 font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
            >
              <MessageCircle className="h-4 w-4 fill-current" />
              <span>Share via WhatsApp</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
