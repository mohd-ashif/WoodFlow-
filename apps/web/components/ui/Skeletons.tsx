import React from 'react';

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-border/60 bg-card p-6 space-y-3">
          <div className="h-4 w-1/2 bg-muted/60 rounded"></div>
          <div className="h-8 w-3/4 bg-muted/80 rounded"></div>
          <div className="h-3 w-1/3 bg-muted/40 rounded"></div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full space-y-3 animate-pulse">
      <div className="h-10 w-full bg-muted/70 rounded-xl"></div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 p-3 border-b border-border/50">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-5 bg-muted/50 rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function PageLoader({ title = 'Loading...' }: { title?: string }) {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-8 space-y-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
    </div>
  );
}
