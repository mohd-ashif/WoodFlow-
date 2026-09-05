import { ImportModuleType, ColumnMapping, RowValidationError } from '../types/import.types.js';

// Field alias maps for intelligent column auto-mapping
const ALIAS_MAP: Record<string, string[]> = {
  // Common / General
  name: [
    'product name', 'item name', 'name', 'title',
    'oduct nam', 'product nam', 'oduct name', 'prod name', 'product', 'item', 'oduct'
  ],
  sku: ['sku', 'product code', 'item code', 'code', 'barcode', 'sku*'],
  category: ['category', 'category name', 'group', 'category*'],
  unit: ['unit', 'unit name', 'unit of measure', 'uom', 'unit*'],
  costPrice: ['cost price', 'cost', 'purchase rate', 'buy price', 'purchase price', 'unit cost', 'cost price*'],
  sellingPrice: [
    'selling price', 'sale price', 'sell price', 'mrp', 'rate', 'unit price',
    'elling price', 'selling price*', 'sell price*', 'elling'
  ],
  openingStock: [
    'opening stock', 'current stock', 'qty', 'quantity', 'stock', 'available stock',
    'opening quantity', 'pening sto', 'pening stock', 'opening sto', 'op stock', 'pening'
  ],
  minimumStock: [
    'minimum stock', 'reorder level', 'min stock', 'ninum sto', 'ninum stock', 'minimum sto', 'min stock*', 'ninum'
  ],
  description: ['description', 'notes', 'details', 'remarks'],
  
  // Contact / CRM / Workers
  phone: ['phone', 'phone number', 'mobile', 'mobile number', 'contact', 'contact number'],
  email: ['email', 'email address', 'mail'],
  customerCode: ['customer code', 'customer id', 'cust code'],
  supplierCode: ['supplier code', 'supplier id', 'supp code'],
  gstNumber: ['gst number', 'gstin', 'tax id', 'vat number'],
  address: ['address', 'street address', 'billing address'],
  city: ['city'],
  state: ['state'],
  postalCode: ['postal code', 'zip code', 'pincode', 'pin code'],
  
  // Workers
  employeeCode: ['employee code', 'emp code', 'worker id', 'emp id'],
  firstName: ['first name', 'given name'],
  lastName: ['last name', 'surname'],
  employmentType: ['employment type', 'job type', 'work type'],
  joiningDate: ['joining date', 'date of joining', 'start date'],
  monthlySalary: ['monthly salary', 'salary', 'monthly pay'],
  dailyWage: ['daily wage', 'per day rate', 'daily pay'],

  // Transactions (Purchase / Sale)
  purchaseNumber: ['purchase number', 'po number', 'purchase ref', 'order number'],
  invoiceNumber: ['invoice number', 'inv number', 'bill number', 'sale number'],
  purchaseDate: ['purchase date', 'po date', 'date'],
  invoiceDate: ['invoice date', 'bill date', 'sale date', 'date'],
  paymentStatus: ['payment status', 'status', 'pay status']
};

export class ValidationService {
  /**
   * Suggest column mappings by comparing uploaded headers against known aliases
   */
  public suggestMappings(module: ImportModuleType, uploadedHeaders: string[]): ColumnMapping[] {
    const requiredFields = this.getRequiredFields(module);

    const findMatchingField = (norm: string): string => {
      // Pass 1: Exact match
      for (const [field, aliases] of Object.entries(ALIAS_MAP)) {
        if (aliases.some((alias) => norm === alias)) {
          return field;
        }
      }
      // Pass 2: Header contains alias (forward substring match)
      for (const [field, aliases] of Object.entries(ALIAS_MAP)) {
        if (aliases.some((alias) => norm.includes(alias))) {
          return field;
        }
      }
      // Pass 3: Alias contains header (only for headers >= 4 characters to avoid generic false positives)
      if (norm.length >= 4) {
        for (const [field, aliases] of Object.entries(ALIAS_MAP)) {
          if (aliases.some((alias) => alias.includes(norm))) {
            return field;
          }
        }
      }
      return '';
    };

    // Count how many headers match known aliases
    let matchedCount = 0;
    uploadedHeaders.forEach((header) => {
      const norm = header.toLowerCase().trim().replace(/[*_]/g, '');
      if (findMatchingField(norm)) {
        matchedCount++;
      }
    });

    // If 0 headers match known aliases (headerless sheet), map positionally!
    const isPositional = matchedCount === 0;

    if (isPositional && module === 'PRODUCTS') {
      const defaultPositionalFields = [
        'name',
        'sku',
        'category',
        'unit',
        'costPrice',
        'sellingPrice',
        'openingStock',
        'minimumStock',
        'description',
      ];

      return uploadedHeaders.map((header, idx) => {
        const targetField = defaultPositionalFields[idx] || '';
        return {
          uploadedColumn: header,
          targetField,
          isRequired: requiredFields.includes(targetField),
        };
      });
    }

    return uploadedHeaders.map((header) => {
      const normalizedHeader = header.toLowerCase().trim().replace(/[*_]/g, '');
      const targetField = findMatchingField(normalizedHeader);

      return {
        uploadedColumn: header,
        targetField: targetField || header,
        isRequired: requiredFields.includes(targetField),
      };
    });
  }

  /**
   * Required fields per module
   */
  public getRequiredFields(module: ImportModuleType): string[] {
    switch (module) {
      case 'PRODUCTS':
        return ['name'];
      case 'CATEGORIES':
        return ['name'];
      case 'UNITS':
        return ['name', 'shortCode'];
      case 'CUSTOMERS':
        return ['name', 'phone'];
      case 'SUPPLIERS':
        return ['name', 'phone'];
      case 'WORKERS':
        return ['employeeCode', 'firstName'];
      case 'INVENTORY':
        return ['name', 'openingStock'];
      case 'PURCHASES':
        return ['purchaseNumber', 'quantity', 'unitPrice'];
      case 'SALES':
        return ['invoiceNumber', 'quantity', 'unitPrice'];
      default:
        return [];
    }
  }

  /**
   * Row-level validation for parsed data rows
   */
  public validateRows(
    module: ImportModuleType,
    rows: Record<string, any>[],
    mappings: ColumnMapping[]
  ): { validRows: Record<string, any>[]; errors: RowValidationError[] } {
    const validRows: Record<string, any>[] = [];
    const errors: RowValidationError[] = [];

    // Map rows using column mappings
    rows.forEach((rawRow, idx) => {
      const rowNum = rawRow._rowNum || idx + 1;
      const mappedRow: Record<string, any> = { _rowNum: rowNum };

      mappings.forEach((map) => {
        if (map.targetField && rawRow[map.uploadedColumn] !== undefined) {
          mappedRow[map.targetField] = rawRow[map.uploadedColumn];
        }
      });

      // Filter out trailing blank rows in Excel
      const hasContent = Object.entries(mappedRow).some(
        ([k, v]) => k !== '_rowNum' && String(v || '').trim().length > 0
      );
      if (!hasContent) return;

      const rowErrors = this.validateSingleRow(module, mappedRow, rowNum);

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        validRows.push(mappedRow);
      }
    });

    return { validRows, errors };
  }

  private validateSingleRow(module: ImportModuleType, row: Record<string, any>, rowNum: number): RowValidationError[] {
    const rowErrors: RowValidationError[] = [];

    const addErr = (field: string, message: string, value?: any) => {
      rowErrors.push({ row: rowNum, field, message, value, rawData: row });
    };

    switch (module) {
      case 'PRODUCTS': {
        let nameStr = String(row.name || '').trim();
        if (!nameStr) {
          // Check unmapped raw data or description/SKU fallback
          const rawValues = Object.entries(row).filter(
            ([k, v]) => k !== '_rowNum' && v && String(v).trim().length > 0
          );
          if (rawValues.length > 0) {
            nameStr = String(rawValues[0][1]).trim();
          }
        }
        if (!nameStr && row.description && String(row.description).trim()) {
          nameStr = String(row.description).trim().slice(0, 50);
        }
        if (!nameStr && row.sku && String(row.sku).trim()) {
          nameStr = `Product ${String(row.sku).trim()}`;
        }
        if (!nameStr && row.category && String(row.category).trim()) {
          nameStr = `${String(row.category).trim()} Item #${rowNum}`;
        }
        if (!nameStr) {
          nameStr = `Product #${rowNum}`;
        }
        row.name = nameStr;

        // Auto-generate SKU if blank or missing
        if (!row.sku || !String(row.sku).trim()) {
          const cleanName = nameStr.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
          row.sku = `SKU-${cleanName || 'ITEM'}-${rowNum}`;
        }

        // Default Category & Unit if empty
        if (!row.category || !String(row.category).trim()) {
          row.category = 'General';
        }
        if (!row.unit || !String(row.unit).trim()) {
          row.unit = 'Piece';
        }

        // Default numeric prices to 0 if blank
        if (row.costPrice === undefined || row.costPrice === '' || row.costPrice === null) {
          row.costPrice = 0;
        }
        if (row.sellingPrice === undefined || row.sellingPrice === '' || row.sellingPrice === null) {
          row.sellingPrice = 0;
        }

        if (isNaN(Number(row.costPrice)) || Number(row.costPrice) < 0) {
          addErr('costPrice', 'Cost price must be a non-negative number', row.costPrice);
        }
        if (isNaN(Number(row.sellingPrice)) || Number(row.sellingPrice) < 0) {
          addErr('sellingPrice', 'Selling price must be a non-negative number', row.sellingPrice);
        }
        break;
      }
      case 'CATEGORIES': {
        if (!row.name || !row.name.trim()) addErr('name', 'Category name is required');
        break;
      }
      case 'UNITS': {
        if (!row.name || !row.name.trim()) addErr('name', 'Unit name is required');
        if (!row.shortCode || !row.shortCode.trim()) addErr('shortCode', 'Short code is required');
        break;
      }
      case 'CUSTOMERS': {
        if (!row.name || !row.name.trim()) addErr('name', 'Customer name is required');
        if (!row.phone || !row.phone.trim()) {
          addErr('phone', 'Phone number is required');
        } else if (!/^\+?[0-9\s\-]{8,15}$/.test(row.phone.trim())) {
          addErr('phone', 'Invalid phone number format', row.phone);
        }
        if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.trim())) {
          addErr('email', 'Invalid email address format', row.email);
        }
        break;
      }
      case 'SUPPLIERS': {
        if (!row.name || !row.name.trim()) addErr('name', 'Supplier name is required');
        if (!row.phone || !row.phone.trim()) {
          addErr('phone', 'Phone number is required');
        } else if (!/^\+?[0-9\s\-]{8,15}$/.test(row.phone.trim())) {
          addErr('phone', 'Invalid phone number format', row.phone);
        }
        if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.trim())) {
          addErr('email', 'Invalid email address format', row.email);
        }
        break;
      }
      case 'WORKERS': {
        if (!row.employeeCode || !row.employeeCode.trim()) addErr('employeeCode', 'Employee code is required');
        if (!row.firstName || !row.firstName.trim()) addErr('firstName', 'First name is required');
        if (row.monthlySalary && (isNaN(Number(row.monthlySalary)) || Number(row.monthlySalary) < 0)) {
          addErr('monthlySalary', 'Monthly salary must be a positive number', row.monthlySalary);
        }
        break;
      }
      case 'INVENTORY': {
        if (!row.name || !row.name.trim()) addErr('name', 'Product name is required');
        if (!row.sku || !row.sku.trim()) addErr('sku', 'SKU is required');
        if (row.openingStock === undefined || row.openingStock === '' || isNaN(Number(row.openingStock)) || Number(row.openingStock) < 0) {
          addErr('openingStock', 'Opening stock quantity must be a non-negative number', row.openingStock);
        }
        break;
      }
      case 'PURCHASES': {
        if (!row.purchaseNumber || !row.purchaseNumber.trim()) addErr('purchaseNumber', 'Purchase number is required');
        if (!row.sku || !row.sku.trim()) addErr('sku', 'Product SKU is required');
        if (!row.quantity || isNaN(Number(row.quantity)) || Number(row.quantity) <= 0) {
          addErr('quantity', 'Quantity must be greater than 0', row.quantity);
        }
        if (row.unitPrice === undefined || isNaN(Number(row.unitPrice)) || Number(row.unitPrice) < 0) {
          addErr('unitPrice', 'Unit price must be a non-negative number', row.unitPrice);
        }
        break;
      }
      case 'SALES': {
        if (!row.invoiceNumber || !row.invoiceNumber.trim()) addErr('invoiceNumber', 'Invoice number is required');
        if (!row.sku || !row.sku.trim()) addErr('sku', 'Product SKU is required');
        if (!row.quantity || isNaN(Number(row.quantity)) || Number(row.quantity) <= 0) {
          addErr('quantity', 'Quantity must be greater than 0', row.quantity);
        }
        if (row.unitPrice === undefined || isNaN(Number(row.unitPrice)) || Number(row.unitPrice) < 0) {
          addErr('unitPrice', 'Unit price must be a non-negative number', row.unitPrice);
        }
        break;
      }
    }

    return rowErrors;
  }
}

export const validationService = new ValidationService();
