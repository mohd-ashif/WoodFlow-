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
        'flex-1 min-h-0 flex flex-col rounded-2xl border border-border/80 bg-card/40 shadow-sm overflow-hidden w-full',
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
      className={clsx('flex-1 min-h-0 overflow-auto relative w-full custom-scrollbar', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function TableCardFooter({ children, className, ...props }: TableCardProps) {
  return (
    <div
      className={clsx('shrink-0 border-t border-border/80 bg-card/80 backdrop-blur-sm w-full', className)}
      {...props}
    >
      {children}
    </div>
  );
}
