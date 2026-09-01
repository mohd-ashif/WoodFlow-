export type ImportModuleType =
  | 'PRODUCTS'
  | 'CATEGORIES'
  | 'UNITS'
  | 'CUSTOMERS'
  | 'SUPPLIERS'
  | 'WORKERS'
  | 'INVENTORY'
  | 'PURCHASES'
  | 'SALES';

export type DuplicateStrategy = 'SKIP' | 'UPDATE' | 'CREATE_NEW';

export interface ColumnMapping {
  uploadedColumn: string;
  targetField: string;
  isRequired?: boolean;
}

export interface RowValidationError {
  row: number;
  field: string;
  message: string;
  value?: any;
  rawData?: Record<string, any>;
}

export interface DuplicateRecordInfo {
  row: number;
  uniqueKey: string;
  field: string;
  value: any;
  existingId?: string;
  uploadedData: Record<string, any>;
}

export interface ImportParsedFile {
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
  fileType: 'csv' | 'xlsx';
  fileName: string;
}

export interface ImportPreviewResponse {
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  duplicateRowsCount: number;
  mappings: ColumnMapping[];
  errors: RowValidationError[];
  duplicates: DuplicateRecordInfo[];
  previewSample: Record<string, any>[];
}

export interface ImportExecutePayload {
  importJobId: string;
  duplicateStrategy: DuplicateStrategy;
  importOnlyValid?: boolean;
}
