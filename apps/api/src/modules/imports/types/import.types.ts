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

export type IssueSeverity = 'BLOCKING_ERROR' | 'WARNING' | 'AUTO_RESOLVED';

export interface ColumnMapping {
  uploadedColumn: string;
  targetField: string;
  isRequired?: boolean;
}

export interface RowValidationError {
  row: number;
  field: string;
  message: string;
  severity?: IssueSeverity;
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

export interface ResolvedMaster {
  id: string;
  name: string;
  normalizedName: string;
  created: boolean;
  isDefault?: boolean;
  shortCode?: string;
}

export interface MasterDataSummary {
  categories: {
    existingCount: number;
    toCreateCount: number;
    namesToCreate: string[];
    existingNames: string[];
  };
  units: {
    existingCount: number;
    toCreateCount: number;
    namesToCreate: string[];
    existingNames: string[];
  };
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
  warningRowsCount?: number;
  autoResolvedRowsCount?: number;
  duplicateRowsCount: number;
  mappings: ColumnMapping[];
  errors: RowValidationError[];
  duplicates: DuplicateRecordInfo[];
  masterData?: MasterDataSummary;
  previewSample: Record<string, any>[];
}

export interface ImportExecutePayload {
  importJobId: string;
  duplicateStrategy: DuplicateStrategy;
  importOnlyValid?: boolean;
}

