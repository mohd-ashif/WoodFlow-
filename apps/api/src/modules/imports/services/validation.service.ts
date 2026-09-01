import { ImportModuleType, ColumnMapping, RowValidationError } from '../types/import.types.js';

// Field alias maps for intelligent column auto-mapping
const ALIAS_MAP: Record<string, string[]> = {
  // Common / General
  name: ['product name', 'item name', 'name', 'title', 'category name', 'customer name', 'supplier name', 'unit name', 'employee name', 'worker name'],
  sku: ['sku', 'product code', 'item code', 'code', 'barcode'],
  category: ['category', 'category name', 'group'],
  unit: ['unit', 'unit of measure', 'uom'],
  costPrice: ['cost price', 'cost', 'purchase rate', 'buy price', 'purchase price', 'unit cost'],
  sellingPrice: ['selling price', 'sale price', 'sell price', 'mrp', 'rate', 'unit price'],
  openingStock: ['opening stock', 'current stock', 'qty', 'quantity', 'stock', 'available stock', 'opening quantity'],
  minimumStock: ['minimum stock', 'reorder level', 'min stock'],
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

    return uploadedHeaders.map((header) => {
      const normalizedHeader = header.toLowerCase().trim().replace(/[*_]/g, '');
      let targetField = '';

      for (const [field, aliases] of Object.entries(ALIAS_MAP)) {
        if (aliases.some((alias) => normalizedHeader.includes(alias) || alias.includes(normalizedHeader))) {
          targetField = field;
          break;
        }
      }

      return {
        uploadedColumn: header,
        targetField: targetField || header,
        isRequired: requiredFields.includes(targetField)
      };
    });
  }

  /**
   * Required fields per module
   */
  public getRequiredFields(module: ImportModuleType): string[] {
    switch (module) {
      case 'PRODUCTS':
        return ['name', 'sku', 'category', 'unit', 'costPrice', 'sellingPrice'];
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
        return ['name', 'sku', 'openingStock'];
      case 'PURCHASES':
        return ['purchaseNumber', 'supplierName', 'sku', 'quantity', 'unitPrice'];
      case 'SALES':
        return ['invoiceNumber', 'customerName', 'sku', 'quantity', 'unitPrice'];
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
      const rowNum = rawRow._rowNum || idx + 2;
      const mappedRow: Record<string, any> = { _rowNum: rowNum };

      mappings.forEach((map) => {
        if (map.targetField && rawRow[map.uploadedColumn] !== undefined) {
          mappedRow[map.targetField] = rawRow[map.uploadedColumn];
        }
      });

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
        if (!row.name || !row.name.trim()) addErr('name', 'Product name is required');
        if (!row.sku || !row.sku.trim()) addErr('sku', 'SKU is required');
        if (!row.category || !row.category.trim()) addErr('category', 'Category is required');
        if (!row.unit || !row.unit.trim()) addErr('unit', 'Unit is required');
        if (row.costPrice === undefined || row.costPrice === '' || isNaN(Number(row.costPrice)) || Number(row.costPrice) < 0) {
          addErr('costPrice', 'Cost price must be a non-negative number', row.costPrice);
        }
        if (row.sellingPrice === undefined || row.sellingPrice === '' || isNaN(Number(row.sellingPrice)) || Number(row.sellingPrice) < 0) {
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
