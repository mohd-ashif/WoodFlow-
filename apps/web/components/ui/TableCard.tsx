'use client';

import React from 'react';
import { clsx } from 'clsx';

interface TableCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function TableCard({ children, className, ...props }: TableCardProps) {
  return (
    <div
      className={clsx(
        'flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card/30 overflow-hidden shadow-sm w-full',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function TableCardBody({ children, className, ...props }: TableCardProps) {
  return (
    <div
      className={clsx('flex-1 min-h-0 overflow-auto custom-scrollbar w-full', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function TableCardFooter({ children, className, ...props }: TableCardProps) {
  return (
    <div
      className={clsx('flex-shrink-0 border-t border-border/60 bg-card/40 backdrop-blur-sm w-full', className)}
      {...props}
    >
      {children}
    </div>
  );
}
