import React from 'react';
import { clsx } from 'clsx';

export function Table({ children, className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full min-w-full">
      <table className={clsx('w-full caption-bottom text-xs sm:text-sm border-collapse', className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={clsx('sticky top-0 z-10 bg-card/95 backdrop-blur-md border-b border-border/80 shadow-2xs', className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={clsx('[&_tr:last-child]:border-0 divide-y divide-border/40', className)} {...props}>{children}</tbody>;
}

export function TableRow({ children, className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={clsx('border-b border-border/40 transition-colors hover:bg-secondary/30 h-12', className)} {...props}>{children}</tr>;
}

export function TableHead({ children, className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={clsx(
        'h-10 px-3 sm:px-4 text-left align-middle font-semibold text-muted-foreground text-[11px] uppercase tracking-wider whitespace-nowrap select-none',
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={clsx(
        'px-3 sm:px-4 py-3 align-middle text-xs sm:text-sm text-foreground font-normal',
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
}
