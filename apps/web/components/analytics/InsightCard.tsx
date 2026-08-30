'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, AlertTriangle, Info, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface InsightCardProps {
  priority: 'INFO' | 'WARNING' | 'ACTION_REQUIRED';
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
}

export function InsightCard({
  priority,
  title,
  message,
  actionUrl,
  actionLabel,
}: InsightCardProps) {
  const getStyles = () => {
    if (priority === 'ACTION_REQUIRED') {
      return {
        badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
        badgeText: 'ACTION REQUIRED',
        icon: AlertCircle,
        iconColor: 'text-rose-500',
        cardBg: 'border-rose-500/20 bg-rose-500/5',
      };
    }
    if (priority === 'WARNING') {
      return {
        badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        badgeText: 'WARNING',
        icon: AlertTriangle,
        iconColor: 'text-amber-500',
        cardBg: 'border-amber-500/20 bg-amber-500/5',
      };
    }
    return {
      badgeBg: 'bg-primary/10 text-primary border-primary/30',
      badgeText: 'INSIGHT',
      icon: Info,
      iconColor: 'text-primary',
      cardBg: 'border-primary/20 bg-primary/5',
    };
  };

  const style = getStyles();
  const Icon = style.icon;

  return (
    <div className={`rounded-xl border p-4 shadow-sm transition-all ${style.cardBg} flex flex-col justify-between`}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.badgeBg}`}>
            <Icon className={`h-3 w-3 ${style.iconColor}`} />
            {style.badgeText}
          </span>
        </div>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
      </div>

      {actionUrl && actionLabel && (
        <div className="pt-3 mt-3 border-t border-border/40">
          <Link href={actionUrl}>
            <Button variant="ghost" size="sm" className="h-8 p-0 text-xs text-primary hover:bg-transparent hover:underline gap-1">
              <span>{actionLabel}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
