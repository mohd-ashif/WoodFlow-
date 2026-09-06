'use client';

import React, { useState } from 'react';
import { AppIcon, IconSize } from './AppIcon';
import { clsx } from 'clsx';
import * as LucideIcons from 'lucide-react';
import { HelpCircle } from 'lucide-react';
import { Button } from './Button';
import { ContextualHelpDrawer } from '../help/ContextualHelpDrawer';

export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcons.LucideIcon | string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  helpTopic?: string;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon,
  badge,
  actions,
  helpTopic,
  className = '',
}) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <>
      <div
        className={clsx(
          'flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 shrink-0 pb-1 w-full max-w-[100vw]',
          className
        )}
      >
        {/* Title & Icon Column */}
        <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
          {icon && (
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
              <AppIcon name={typeof icon === 'string' ? icon : undefined} icon={typeof icon !== 'string' ? icon : undefined} size="lg" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground leading-snug">
                {title}
              </h1>
              {badge}
              {helpTopic && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsHelpOpen(true)}
                  className="h-7 px-2.5 text-xs gap-1.5 rounded-lg border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-colors ml-1"
                  title="View guide for this page"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline font-medium">Help</span>
                </Button>
              )}
            </div>
            {description && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-normal">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons Container */}
        {actions && (
          <div className="flex items-center gap-2 flex-wrap shrink-0 w-full sm:w-auto [&>button]:flex-1 [&>button]:sm:flex-none [&>a]:flex-1 [&>a]:sm:flex-none [&>a>button]:w-full font-medium">
            {actions}
          </div>
        )}
      </div>

      {helpTopic && (
        <ContextualHelpDrawer
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
          topic={helpTopic}
        />
      )}
    </>
  );
};

