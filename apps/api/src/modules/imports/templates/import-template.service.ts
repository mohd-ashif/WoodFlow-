import { ImportModuleType } from '../types/import.types.js';

export interface ModuleTemplateConfig {
  module: ImportModuleType;
  headers: string[];
  sampleRow: Record<string, string>;
  notes: Record<string, string>;
}

export const TEMPLATE_CONFIGS: Record<ImportModuleType, ModuleTemplateConfig> = {
  PRODUCTS: {
    module: 'PRODUCTS',
    headers: ['Product Name*', 'SKU*', 'Category*', 'Unit*', 'Cost Price*', 'Selling Price*', 'Opening Stock', 'Minimum Stock', 'Description'],
    sampleRow: {
      'Product Name*': 'Teak Wood Dining Table 6-Seater',
      'SKU*': 'TDT-6S-001',
      'Category*': 'Dining Tables',
      'Unit*': 'Piece',
      'Cost Price*': '15000',
      'Selling Price*': '24999',
      'Opening Stock': '10',
      'Minimum Stock': '2',
      'Description': 'Premium Teak Wood 6 Seater Dining Table with Walnut Polish'
    },
    notes: {
      'Product Name*': 'Required. Full name of the product.',
      'SKU*': 'Required. Unique product stock keeping unit code.',
      'Category*': 'Required. Must exist or will be auto-created.',
      'Unit*': 'Required. e.g. Piece, Set, Kg, Box.',
      'Cost Price*': 'Required. Must be >= 0.',
      'Selling Price*': 'Required. Must be >= 0.'
    }
  },
  CATEGORIES: {
    module: 'CATEGORIES',
    headers: ['Category Name*', 'Description'],
    sampleRow: {
      'Category Name*': 'Living Room Sofas',
      'Description': 'Wooden and upholstered living room sofas and couches'
    },
    notes: {
      'Category Name*': 'Required. Unique category name.'
    }
  },
  UNITS: {
    module: 'UNITS',
    headers: ['Unit Name*', 'Short Code*'],
    sampleRow: {
      'Unit Name*': 'Piece',
      'Short Code*': 'Pcs'
    },
    notes: {
      'Unit Name*': 'Required. Full unit name.',
      'Short Code*': 'Required. Unique short symbol or code.'
    }
  },
  CUSTOMERS: {
    module: 'CUSTOMERS',
    headers: ['Customer Name*', 'Phone*', 'Email', 'Customer Code', 'GST Number', 'Address', 'City', 'State', 'Postal Code', 'Notes'],
    sampleRow: {
      'Customer Name*': 'Rajesh Sharma',
      'Phone*': '9876543210',
      'Email': 'rajesh.sharma@example.com',
      'Customer Code': 'CUST-1001',
      'GST Number': '07AAAAA0000A1Z5',
      'Address': '123 MG Road, Sector 14',
      'City': 'Gurugram',
      'State': 'Haryana',
      'Postal Code': '122001',
      'Notes': 'VIP Retail Customer'
    },
    notes: {
      'Customer Name*': 'Required.',
      'Phone*': 'Required. 10-digit mobile number.'
    }
  },
  SUPPLIERS: {
    module: 'SUPPLIERS',
    headers: ['Supplier Name*', 'Phone*', 'Email', 'Supplier Code', 'GST Number', 'Address', 'City', 'State', 'Postal Code', 'Notes'],
    sampleRow: {
      'Supplier Name*': 'Royal Timber Works',
      'Phone*': '9988776655',
      'Email': 'sales@royaltimber.com',
      'Supplier Code': 'SUPP-2001',
      'GST Number': '06BBBBB1111B2Z6',
      'Address': 'Plot 45 Industrial Area',
      'City': 'Yamunanagar',
      'State': 'Haryana',
      'Postal Code': '135001',
      'Notes': 'Primary teak & Sheesham supplier'
    },
    notes: {
      'Supplier Name*': 'Required.',
      'Phone*': 'Required.'
    }
  },
  WORKERS: {
    module: 'WORKERS',
    headers: ['Employee Code*', 'First Name*', 'Last Name*', 'Phone', 'Email', 'Employment Type*', 'Joining Date', 'Monthly Salary', 'Daily Wage', 'Address'],
    sampleRow: {
      'Employee Code*': 'EMP-001',
      'First Name*': 'Suresh',
      'Last Name*': 'Kumar',
      'Phone': '9123456789',
      'Email': 'suresh.carpenter@example.com',
      'Employment Type*': 'FULL_TIME',
      'Joining Date': '2025-01-15',
      'Monthly Salary': '22000',
      'Daily Wage': '',
      'Address': 'Village Badshahpur, Gurugram'
    },
    notes: {
      'Employee Code*': 'Required. Unique worker ID.',
      'First Name*': 'Required.',
      'Employment Type*': 'FULL_TIME, PART_TIME, CONTRACT, or DAILY_WAGE.'
    }
  },
  INVENTORY: {
    module: 'INVENTORY',
    headers: ['Product Name*', 'SKU*', 'Category*', 'Opening Quantity*', 'Cost Price*', 'Selling Price*', 'Minimum Stock'],
    sampleRow: {
      'Product Name*': 'Wooden Arm Chair',
      'SKU*': 'WAC-002',
      'Category*': 'Chairs',
      'Opening Quantity*': '25',
      'Cost Price*': '3500',
      'Selling Price*': '5500',
      'Minimum Stock': '5'
    },
    notes: {
      'Product Name*': 'Required.',
      'SKU*': 'Required.',
      'Opening Quantity*': 'Required. Stock quantity to record as OPENING_STOCK.'
    }
  },
  PURCHASES: {
    module: 'PURCHASES',
    headers: ['Purchase Number*', 'Purchase Date*', 'Supplier Name*', 'SKU*', 'Product Name*', 'Quantity*', 'Unit Price*', 'Discount Amount', 'Tax Rate %', 'Payment Status*'],
    sampleRow: {
      'Purchase Number*': 'PO-2026-001',
      'Purchase Date*': '2026-08-01',
      'Supplier Name*': 'Royal Timber Works',
      'SKU*': 'RAW-WOOD-01',
      'Product Name*': 'Raw Sheesham Wood Planks',
      'Quantity*': '50',
      'Unit Price*': '800',
      'Discount Amount': '0',
      'Tax Rate %': '18',
      'Payment Status*': 'PAID'
    },
    notes: {
      'Purchase Number*': 'Required. Unique PO reference.',
      'Payment Status*': 'PAID, PARTIALLY_PAID, or UNPAID.'
    }
  },
  SALES: {
    module: 'SALES',
    headers: ['Invoice Number*', 'Invoice Date*', 'Customer Name*', 'SKU*', 'Product Name*', 'Quantity*', 'Unit Price*', 'Discount Amount', 'Tax Rate %', 'Payment Status*'],
    sampleRow: {
      'Invoice Number*': 'INV-2026-001',
      'Invoice Date*': '2026-08-05',
      'Customer Name*': 'Rajesh Sharma',
      'SKU*': 'TDT-6S-001',
      'Product Name*': 'Teak Wood Dining Table 6-Seater',
      'Quantity*': '1',
      'Unit Price*': '24999',
      'Discount Amount': '1000',
      'Tax Rate %': '18',
      'Payment Status*': 'PAID'
    },
    notes: {
      'Invoice Number*': 'Required. Unique sale/invoice reference.',
      'Payment Status*': 'PAID, PARTIALLY_PAID, or UNPAID.'
    }
  }
};

function escapeXml(str: string = ''): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export class ImportTemplateService {
  /**
   * Generates CSV format content string for template download
   */
  public generateCsvTemplate(module: ImportModuleType): string {
    const config = TEMPLATE_CONFIGS[module];
    if (!config) {
      throw new Error(`Invalid module: ${module}`);
    }

    const headersLine = config.headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(',');
    const sampleLine = config.headers
      .map((h) => `"${(config.sampleRow[h] || '').replace(/"/g, '""')}"`)
      .join(',');

    return `${headersLine}\n${sampleLine}\n`;
  }

  /**
   * Generates formatted Excel (.xlsx / .xls) Workbook XML template with sample row & instructions
   */
  public generateExcelTemplate(module: ImportModuleType): string {
    const config = TEMPLATE_CONFIGS[module];
    if (!config) {
      throw new Error(`Invalid module: ${module}`);
    }

    const headers = config.headers;
    const sampleCells = config.headers.map((h) => config.sampleRow[h] || '');
    const notesRows = Object.entries(config.notes).map(([col, note]) => ({
      label: col,
      value: note,
    }));

    return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="HeaderStyle">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#4F46E5" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="TitleStyle">
   <Font ss:FontName="Calibri" ss:Size="13" ss:Color="#1E293B" ss:Bold="1"/>
  </Style>
  <Style ss:ID="TextStyle">
   <Font ss:FontName="Calibri" ss:Size="11"/>
  </Style>
  <Style ss:ID="NoteStyle">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#475569" ss:Italic="1"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${module} Template">
  <Table>
   <Row ss:Height="25">
    ${headers.map((h) => `<Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`).join('')}
   </Row>
   <Row ss:Height="20">
    ${sampleCells.map((v) => `<Cell ss:StyleID="TextStyle"><Data ss:Type="String">${escapeXml(v)}</Data></Cell>`).join('')}
   </Row>
  </Table>
 </Worksheet>
 <Worksheet ss:Name="Field Instructions & Rules">
  <Table>
   <Row ss:Height="24"><Cell ss:StyleID="TitleStyle"><Data ss:Type="String">Field Instructions & Required Validation Rules</Data></Cell></Row>
   ${notesRows.map((n) => `<Row ss:Height="20"><Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">${escapeXml(n.label)}</Data></Cell><Cell ss:StyleID="NoteStyle"><Data ss:Type="String">${escapeXml(n.value)}</Data></Cell></Row>`).join('')}
  </Table>
 </Worksheet>
</Workbook>`;
  }
}

export const importTemplateService = new ImportTemplateService();
