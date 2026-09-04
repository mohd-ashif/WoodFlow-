'use client';

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { Button } from './Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmingLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmingLabel = 'Processing...',
  cancelLabel = 'Cancel',
  isLoading = false,
  variant = 'danger',
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus cancel button on open (safe default action)
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => cancelRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, isLoading, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const iconColor = variant === 'danger' ? 'text-rose-500' : 'text-amber-500';
  const iconBg = variant === 'danger' ? 'bg-rose-500/10' : 'bg-amber-500/10';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 overflow-y-auto" role="presentation">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={!isLoading ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        className="relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-sm rounded-xl sm:rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 fade-in duration-200 my-auto"
      >
        {/* Close button */}
        <button
          onClick={!isLoading ? onClose : undefined}
          disabled={isLoading}
          aria-label="Close"
          className="absolute top-3 right-3 rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="p-4 sm:p-6">
          {/* Icon */}
          <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${iconBg}`}>
            <AlertTriangle className={`h-6 w-6 ${iconColor}`} aria-hidden="true" />
          </div>

          {/* Text */}
          <div className="text-center space-y-2">
            <h3 id="confirm-title" className="text-base font-semibold text-foreground">
              {title}
            </h3>
            <p id="confirm-desc" className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
            <Button
              ref={cancelRef}
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 border-border/80"
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={onConfirm}
              disabled={isLoading}
              isLoading={isLoading}
              className="flex-1"
            >
              {isLoading ? confirmingLabel : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
