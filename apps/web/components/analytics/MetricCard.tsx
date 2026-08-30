'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { ArrowUpRight, ArrowDownRight, Minus, LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  comparison?: {
    percentageChange: number;
    direction: 'INCREASE' | 'DECREASE' | 'NO_CHANGE';
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  comparison,
  variant = 'default',
}: MetricCardProps) {
  const getBorderColor = () => {
    if (variant === 'success') return 'border-emerald-500/20 bg-emerald-500/5';
    if (variant === 'warning') return 'border-amber-500/20 bg-amber-500/5';
    if (variant === 'danger') return 'border-rose-500/20 bg-rose-500/5';
    return 'border-border bg-card';
  };

  return (
    <Card className={getBorderColor()}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
      </CardHeader>
      <CardContent className="space-y-1.5">
        <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>

        {comparison && (
          <div className="flex items-center gap-1.5 text-xs font-medium">
            {comparison.direction === 'INCREASE' && (
              <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[11px] font-semibold">
                <ArrowUpRight className="h-3 w-3 mr-0.5" /> +{comparison.percentageChange}%
              </span>
            )}
            {comparison.direction === 'DECREASE' && (
              <span className="inline-flex items-center text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded text-[11px] font-semibold">
                <ArrowDownRight className="h-3 w-3 mr-0.5" /> -{comparison.percentageChange}%
              </span>
            )}
            {comparison.direction === 'NO_CHANGE' && (
              <span className="inline-flex items-center text-muted-foreground bg-secondary px-1.5 py-0.5 rounded text-[11px]">
                <Minus className="h-3 w-3 mr-0.5" /> 0%
              </span>
            )}
            <span className="text-[11px] text-muted-foreground">vs prev period</span>
          </div>
        )}

        {subtitle && !comparison && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
