'use client';

import React from 'react';
import { Calendar } from 'lucide-react';

export type PresetOption =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'this_year';

interface DateRangeFilterProps {
  value: PresetOption;
  onChange: (preset: PresetOption) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const presets: { id: PresetOption; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'this_week', label: 'This Week' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'this_quarter', label: 'This Quarter' },
    { id: 'this_year', label: 'This Year' },
  ];

  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-sm text-xs">
      <div className="flex items-center gap-1 px-2 text-muted-foreground font-medium border-r border-border/60 mr-1">
        <Calendar className="h-3.5 w-3.5 text-primary" />
        <span className="hidden sm:inline">Period:</span>
      </div>
      {presets.map((p) => {
        const isActive = value === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
