'use client';

import React from 'react';
import { AppIcon, IconSize } from './AppIcon';
import { clsx } from 'clsx';
import * as LucideIcons from 'lucide-react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcons.LucideIcon | string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon,
  badge,
  actions,
  className = '',
}) => {
  return (
    <div
      className={clsx(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shrink-0 pb-1',
        className
      )}
    >
      {/* Title & Icon Column */}
      <div className="flex items-start sm:items-center gap-3 min-w-0">
        {icon && (
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
            <AppIcon name={typeof icon === 'string' ? icon : undefined} icon={typeof icon !== 'string' ? icon : undefined} size="lg" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons Container */}
      {actions && (
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap shrink-0 self-start sm:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
};
