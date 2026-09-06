'use client';

import React from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  isLoading?: boolean;
  className?: string;
  wrapperClassName?: string;
  disabled?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  isLoading = false,
  className = '',
  wrapperClassName = '',
  disabled = false,
}) => {
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChange('');
    }
  };

  return (
    <div className={clsx('relative flex items-center', wrapperClassName || 'w-full sm:w-80', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none shrink-0" />

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="h-9 w-full rounded-lg border border-border bg-secondary/20 pl-9 pr-8 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-all disabled:opacity-50"
      />

      {isLoading ? (
        <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin shrink-0" />
      ) : value ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground rounded transition-colors"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5 shrink-0" />
        </button>
      ) : null}
    </div>
  );
};
