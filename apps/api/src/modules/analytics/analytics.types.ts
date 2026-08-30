export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'this_year'
  | 'custom';

export interface DateFilterOptions {
  startDate?: string;
  endDate?: string;
  preset?: DateRangePreset;
}

export interface PeriodComparison {
  currentValue: number;
  previousValue: number;
  changeAmount: number;
  percentageChange: number;
  direction: 'INCREASE' | 'DECREASE' | 'NO_CHANGE';
}

export interface KPICardData {
  title: string;
  value: number;
  formattedValue: string;
  comparison?: PeriodComparison;
}

export interface BusinessInsight {
  id: string;
  priority: 'INFO' | 'WARNING' | 'ACTION_REQUIRED';
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
}

export type ReportType =
  | 'sales'
  | 'inventory'
  | 'purchases'
  | 'customers'
  | 'suppliers'
  | 'finance'
  | 'expenses'
  | 'production';

export type ExportFormat = 'csv' | 'excel';
