import React from 'react';
import { clsx } from 'clsx';

export function Table({ children, className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-x-auto rounded-xl border border-border bg-card/40">
      <table className={clsx('w-full caption-bottom text-sm', className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={clsx('bg-secondary/40 border-b border-border', className)} {...props}>{children}</thead>;
}

export function TableBody({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={clsx('[&_tr:last-child]:border-0', className)} {...props}>{children}</tbody>;
}

export function TableRow({ children, className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={clsx('border-b border-border/50 transition-colors hover:bg-secondary/20', className)} {...props}>{children}</tr>;
}

export function TableHead({ children, className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={clsx('h-8 sm:h-9 md:h-11 px-2 sm:px-3 md:px-4 text-left align-middle font-medium text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider', className)} {...props}>{children}</th>;
}

export function TableCell({ children, className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={clsx('p-2 sm:p-3 md:p-4 align-middle text-xs sm:text-sm text-foreground', className)} {...props}>{children}</td>;
}
