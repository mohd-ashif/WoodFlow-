'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Package, Users, Building2, FileText, ShoppingBag, Wrench, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

export interface SearchResultItem {
  id: string;
  type: 'PRODUCT' | 'CUSTOMER' | 'SUPPLIER' | 'INVOICE' | 'PURCHASE' | 'WORKER';
  title: string;
  subtitle: string;
  link: string;
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
        if (response.data?.success) {
          setResults(response.data.data || []);
        }
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (link: string) => {
    setIsOpen(false);
    router.push(link);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'PRODUCT':
        return <Package className="h-4 w-4 text-blue-400" />;
      case 'CUSTOMER':
        return <Users className="h-4 w-4 text-emerald-400" />;
      case 'SUPPLIER':
        return <Building2 className="h-4 w-4 text-amber-400" />;
      case 'INVOICE':
        return <FileText className="h-4 w-4 text-purple-400" />;
      case 'PURCHASE':
        return <ShoppingBag className="h-4 w-4 text-rose-400" />;
      case 'WORKER':
        return <Wrench className="h-4 w-4 text-teal-400" />;
      default:
        return <Search className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <>
      {/* Search Bar Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl border border-border/70 bg-card/60 hover:bg-secondary/60 transition-colors text-sm text-muted-foreground shadow-sm group w-48 sm:w-64"
      >
        <Search className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        <span className="flex-1 text-left truncate">Search everything...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold bg-secondary/80 border border-border rounded text-muted-foreground">
          Ctrl K
        </kbd>
      </button>

      {/* Fullscreen Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0">
            {/* Input Header */}
            <div className="flex items-center px-4 py-3.5 border-b border-border gap-3">
              <Search className="h-5 w-5 text-primary" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, SKUs, customers, suppliers, invoices, workers..."
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-base"
              />
              {isLoading && <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Results Container */}
            <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-border/40">
              {query.trim() === '' ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Global System Search</p>
                  <p>Type any keyword, SKU, customer phone, invoice number, or worker code.</p>
                </div>
              ) : results.length === 0 && !isLoading ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No records found matching &quot;<span className="text-foreground font-semibold">{query}</span>&quot;.
                </div>
              ) : (
                results.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleSelect(item.link)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/60 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-secondary/80 border border-border">
                        {getIcon(item.type)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                          {item.title}
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 bg-secondary rounded border border-border text-muted-foreground">
                            {item.type}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors transform group-hover:translate-x-0.5" />
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-secondary/40 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>Press <kbd className="px-1.5 py-0.5 bg-background border border-border rounded">Esc</kbd> to close</span>
              <span>Tenant Isolated Search</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
