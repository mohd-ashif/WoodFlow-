import React from 'react';
import { clsx } from 'clsx';

export function Card({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-border bg-card/60 backdrop-blur-md p-6 text-card-foreground shadow-sm transition-all hover:border-border/80',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('flex flex-col space-y-1.5 pb-4', className)} {...props}>{children}</div>;
}

export function CardTitle({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={clsx('text-lg font-semibold leading-none tracking-tight', className)} {...props}>{children}</h3>;
}

export function CardDescription({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={clsx('text-sm text-muted-foreground', className)} {...props}>{children}</p>;
}

export function CardContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('pt-0', className)} {...props}>{children}</div>;
}

export function CardFooter({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('flex items-center pt-4 border-t border-border/50 mt-4', className)} {...props}>{children}</div>;
}
