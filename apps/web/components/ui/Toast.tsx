'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, X, Info, AlertTriangle } from 'lucide-react';

// ─── Toast Types ───────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

// ─── Context ───────────────────────────────────────────────────────────────────
interface ToastContextValue {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Individual Toast Component ────────────────────────────────────────────────
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  }, [toast.id, onRemove]);

  useEffect(() => {
    timerRef.current = setTimeout(dismiss, toast.duration);
    return () => clearTimeout(timerRef.current);
  }, [toast.duration, dismiss]);

  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" aria-hidden="true" />,
    error: <XCircle className="h-4 w-4 text-rose-400 flex-shrink-0" aria-hidden="true" />,
    info: <Info className="h-4 w-4 text-blue-400 flex-shrink-0" aria-hidden="true" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" aria-hidden="true" />,
  };

  const borders = {
    success: 'border-emerald-500/20',
    error: 'border-rose-500/20',
    info: 'border-blue-500/20',
    warning: 'border-amber-500/20',
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`flex items-start gap-3 rounded-xl border bg-card/95 backdrop-blur-md px-4 py-3 shadow-2xl max-w-sm w-full transition-all duration-300 ${borders[toast.type]} ${exiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}
      style={{ animation: exiting ? undefined : 'slideIn 0.25s ease-out' }}
    >
      {icons[toast.type]}
      <p className="flex-1 text-sm font-medium text-foreground leading-snug">{toast.message}</p>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="rounded-md p-0.5 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors flex-shrink-0 -mr-1"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

// ─── Provider ──────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType, duration: number) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => {
      const next = prev.length >= 4 ? prev.slice(1) : prev;
      return [...next, { id, message, type, duration }];
    });
  }, []);

  const success = useCallback((m: string, d = 3500) => addToast(m, 'success', d), [addToast]);
  const error = useCallback((m: string, d = 5000) => addToast(m, 'error', d), [addToast]);
  const info = useCallback((m: string, d = 4000) => addToast(m, 'info', d), [addToast]);
  const warning = useCallback((m: string, d = 4000) => addToast(m, 'warning', d), [addToast]);

  // Register imperative functions so toast.success() works outside React tree
  useEffect(() => {
    registerToastFns({ success, error, info, warning });
  }, [success, error, info, warning]);

  return (
    <ToastContext.Provider value={{ success, error, info, warning }}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none"
        style={{ maxWidth: '380px' }}
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto w-full">
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return ctx;
}

// ─── Imperative singleton (mirrors react-hot-toast's toast.success() API) ─────
// This lets us call toast.success() from anywhere without a hook,
// using a module-level event bus.
type ToastFn = (message: string, duration?: number) => void;
let _successFn: ToastFn = () => {};
let _errorFn: ToastFn = () => {};
let _infoFn: ToastFn = () => {};
let _warningFn: ToastFn = () => {};

/** Call this once inside a component that has access to the ToastContext */
export function registerToastFns(fns: ToastContextValue) {
  _successFn = fns.success;
  _errorFn = fns.error;
  _infoFn = fns.info;
  _warningFn = fns.warning;
}

/**
 * Imperative toast API — mirrors react-hot-toast.
 * Usage: toast.success('Saved!') or toast.error('Failed.')
 */
const toast = {
  success: (message: string, duration?: number) => _successFn(message, duration),
  error: (message: string, duration?: number) => _errorFn(message, duration),
  info: (message: string, duration?: number) => _infoFn(message, duration),
  warning: (message: string, duration?: number) => _warningFn(message, duration),
};

export default toast;
