'use client';

import React, { useState } from 'react';
import { X, RotateCcw, Package, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import toast from '../ui/Toast';
import { api } from '../../lib/api';

export interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'SALE' | 'PURCHASE';
  recordId: string;
  referenceNumber: string;
  entityName: string;
  items: {
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }[];
  onSuccess?: () => void;
}

export function ReturnModal({
  isOpen,
  onClose,
  type,
  recordId,
  referenceNumber,
  entityName,
  items,
  onSuccess
}: ReturnModalProps) {
  const [returnQtyMap, setReturnQtyMap] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleQtyChange = (itemId: string, maxQty: number, value: number) => {
    const qty = Math.max(0, Math.min(maxQty, value || 0));
    setReturnQtyMap((prev) => ({ ...prev, [itemId]: qty }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const returnItems = Object.entries(returnQtyMap)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, qty]) => ({ itemId, quantity: qty }));

    if (returnItems.length === 0) {
      toast.error('Select at least 1 item quantity to return');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please enter a reason for the return');
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = type === 'SALE' ? `/sales/${recordId}/return` : `/purchases/${recordId}/return`;
      await api.post(endpoint, { items: returnItems, reason });

      toast.success(`${type === 'SALE' ? 'Sales' : 'Purchase'} return processed successfully! Stock & balances updated.`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to process return');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Process {type === 'SALE' ? 'Sales Return' : 'Purchase Return'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {type === 'SALE' ? 'Invoice:' : 'PO:'} <span className="font-mono text-foreground font-semibold">{referenceNumber}</span> • {entityName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Select Return Quantities
            </label>
            <div className="border border-border/80 rounded-xl divide-y divide-border/40 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="p-3 flex items-center justify-between gap-3 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">Original Qty: {item.quantity} • ₹{item.unitPrice}</p>
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      min={0}
                      max={item.quantity}
                      value={returnQtyMap[item.id] || 0}
                      onChange={(e) => handleQtyChange(item.id, item.quantity, parseInt(e.target.value))}
                      className="text-center font-bold"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground">Return Reason / Notes *</label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Damaged piece, Customer exchange, Quality mismatch"
              required
              className="mt-1"
            />
          </div>

          <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-500 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              {type === 'SALE'
                ? 'Processing return will increase product inventory (+stock), log a SALES_RETURN stock movement, and credit customer outstanding balance.'
                : 'Processing return will decrease product inventory (-stock), log a PURCHASE_RETURN stock movement, and debit supplier balance.'}
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2 shadow-lg shadow-amber-500/20">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  Confirm Return
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
