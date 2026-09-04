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
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      outline: 'border border-border bg-transparent hover:bg-secondary/50 text-foreground',
      danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
      destructive: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
      ghost: 'hover:bg-secondary/50 text-foreground',
    };

    const sizeStyles = {
      sm: 'h-7 sm:h-8 px-2.5 sm:px-3 text-xs rounded-md',
      md: 'h-8 sm:h-9 md:h-10 px-3 sm:px-4 text-xs sm:text-sm rounded-lg',
      lg: 'h-9 sm:h-10 md:h-12 px-4 sm:px-6 text-xs sm:text-sm md:text-base rounded-xl',
      icon: 'h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg',
      'icon-sm': 'h-6 w-6 sm:h-7 sm:w-7 p-0 rounded-md',
      'icon-lg': 'h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-lg',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(
          clsx(
            'inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
            variantStyles[variant],
            sizeStyles[size],
            className
          )
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
