'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { getCompanyInitials } from '../../hooks/useCompanyBranding';

interface CompanyLogoProps {
  logoUrl?: string | null;
  companyName?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  primaryColor?: string | null;
  alt?: string;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl font-bold',
};

const roundedClasses = {
  sm: 'rounded',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  xl: 'rounded-2xl',
  full: 'rounded-full',
};

export function CompanyLogo({
  logoUrl,
  companyName,
  size = 'md',
  className,
  rounded = 'lg',
  primaryColor,
  alt,
}: CompanyLogoProps) {
  const [hasError, setHasError] = useState(false);
  const initials = getCompanyInitials(companyName);

  const containerSizeClass = sizeClasses[size];
  const containerRoundedClass = roundedClasses[rounded];

  // If logo URL is present and has not encountered a load error
  if (logoUrl && !hasError) {
    return (
      <div
        className={clsx(
          'relative flex shrink-0 items-center justify-center overflow-hidden bg-background/60 border border-border/80 shadow-sm transition-all',
          containerSizeClass,
          containerRoundedClass,
          className
        )}
      >
        <img
          src={logoUrl}
          alt={alt || companyName || 'Company Logo'}
          className="h-full w-full object-contain p-1"
          onError={() => setHasError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  // Graceful Initials Fallback Component (Section 14 & 29 Requirement)
  return (
    <div
      style={{
        backgroundColor: primaryColor ? `${primaryColor}1A` : undefined, // 10% opacity hex
        borderColor: primaryColor ? `${primaryColor}4D` : undefined, // 30% opacity hex
        color: primaryColor || undefined,
      }}
      className={clsx(
        'flex shrink-0 items-center justify-center font-bold tracking-wider select-none shadow-sm transition-all',
        !primaryColor && 'bg-primary/10 text-primary border border-primary/20',
        primaryColor && 'border',
        containerSizeClass,
        containerRoundedClass,
        className
      )}
      title={companyName || 'Company'}
    >
      <span>{initials}</span>
    </div>
  );
}
