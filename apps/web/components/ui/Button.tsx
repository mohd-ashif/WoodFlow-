import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  variant?: 'primary' | 'default' | 'secondary' | 'outline' | 'danger' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20',
      default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/40',
      outline: 'border border-border bg-card/40 hover:bg-secondary/60 text-foreground shadow-2xs',
      danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
      destructive: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
      ghost: 'hover:bg-secondary/60 text-foreground',
    };

    const sizeStyles = {
      sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
      md: 'h-9 px-3.5 sm:px-4 text-xs sm:text-sm rounded-lg gap-2',
      lg: 'h-10 px-5 text-sm font-semibold rounded-xl gap-2',
      icon: 'h-9 w-9 p-0 rounded-lg justify-center',
      'icon-sm': 'h-8 w-8 p-0 rounded-lg justify-center',
      'icon-lg': 'h-10 w-10 p-0 rounded-xl justify-center',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(
          clsx(
            'inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] shrink-0 select-none cursor-pointer',
            variantStyles[variant],
            sizeStyles[size],
            className
          )
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
