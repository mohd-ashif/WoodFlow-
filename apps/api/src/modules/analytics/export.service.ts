import { analyticsService } from './analytics.service.js';
import { DateFilterOptions } from './analytics.types.js';
import { prisma } from '../../config/prisma.js';

function escapeCsvField(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function buildCsvString(headers: string[], rows: any[][]): string {
  const headerLine = headers.map(escapeCsvField).join(',');
  const rowLines = rows.map((row) => row.map(escapeCsvField).join(','));
  return [headerLine, ...rowLines].join('\n');
}

/**
 * Builds an MS-Excel HTML document with gridlines, bold headers, formatted values,
 * and summary totals, recognized natively by Microsoft Excel, Apple Numbers, and Google Sheets.
 */
function buildExcelHtml(
  companyName: string,
  title: string,
  headers: string[],
  rows: any[][],
  summaryRows?: { label: string; value: string | number }[]
): string {
  const nowStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const headersHtml = headers
    .map((h) => `<th style="background-color: #1e293b; color: #ffffff; font-weight: bold; padding: 8px; border: 1px solid #94a3b8;">${h}</th>`)
    .join('');

  const rowsHtml = rows
    .map(
      (r) =>
        '<tr>' +
        r
          .map(
            (cell) =>
              `<td style="padding: 6px; border: 1px solid #cbd5e1;">${cell === null || cell === undefined ? '' : cell}</td>`
          )
          .join('') +
        '</tr>'
    )
    .join('');

  let summaryHtml = '';
  if (summaryRows && summaryRows.length > 0) {
    summaryHtml =
      `<tr><td colspan="${headers.length}" style="border: none;"></td></tr>` +
      `<tr><td style="font-weight: bold; background-color: #e2e8f0; border: 1px solid #cbd5e1;" colspan="${headers.length}">SUMMARY TOTALS</td></tr>` +
      summaryRows
        .map(
          (s) =>
            `<tr><td style="font-weight: bold; border: 1px solid #cbd5e1;">${s.label}</td><td style="font-weight: bold; border: 1px solid #cbd5e1;" colspan="${headers.length - 1}">${s.value}</td></tr>`
        )
        .join('');
  }

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>${title.substring(0, 30)}</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    th { font-family: Arial, sans-serif; font-size: 11pt; }
    td { font-family: Arial, sans-serif; font-size: 10pt; }
  </style>
</head>
<body>
  <h2 style="color: #1e3a8a;">${companyName.toUpperCase()}</h2>
  <h4 style="color: #475569;">${title} - Generated on ${nowStr}</h4>
  <table border="1" style="border-collapse: collapse;">
    <thead>
      <tr>${headersHtml}</tr>
    </thead>
    <tbody>
      ${rowsHtml}
      ${summaryHtml}
    </tbody>
  </table>
</body>
</html>`;
}

/**
 * Builds a printable PDF/HTML document string with styled tables, headers,
 * summary cards, and auto-print trigger.
 */
function buildPdfHtml(companyName: string, title: string, headers: string[], rows: any[][], summaryRows?: { label: string; value: string | number }[]): string {
  const nowStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const headersHtml = headers.map((h) => `<th style="padding: 10px 12px; background-color: #1e293b; color: #ffffff; text-align: left; font-size: 12px; font-weight: 600; border: 1px solid #334155;">${h}</th>`).join('');

  const rowsHtml = rows
    .map(
      (r, idx) =>
        `<tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">` +
        r
          .map(
            (cell) =>
              `<td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 11px; color: #334155;">${cell === null || cell === undefined ? '' : cell}</td>`
          )
          .join('') +
        `</tr>`
    )
    .join('');

  let summaryHtml = '';
  if (summaryRows && summaryRows.length > 0) {
    summaryHtml = `
      <div style="margin-top: 24px; padding: 16px; background-color: #f1f5f9; border-radius: 8px; border: 1px solid #cbd5e1;">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #0f172a; text-transform: uppercase;">Summary Totals</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
          ${summaryRows
            .map(
              (s) => `
            <div style="padding: 8px 12px; background-color: #ffffff; border-radius: 6px; border: 1px solid #e2e8f0;">
              <div style="font-size: 11px; color: #64748b; font-weight: 500;">${s.label}</div>
              <div style="font-size: 14px; color: #0f172a; font-weight: 700; margin-top: 2px;">${s.value}</div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title} - ${companyName}</title>
  <style>
    @page { size: A4 landscape; margin: 15mm; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 24px; color: #0f172a; background: #ffffff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; }
    .company-title { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; text-transform: uppercase; }
    .report-name { font-size: 16px; font-weight: 600; color: #2563eb; margin-top: 4px; }
    .meta-info { font-size: 11px; color: #64748b; text-align: right; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; page-break-inside: auto; }
    tr { page-break-inside: avoid; page-break-after: auto; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 16px; text-align: right;">
    <button onclick="window.print()" style="background-color: #2563eb; color: #ffffff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer;">Print / Save as PDF</button>
  </div>
  <div class="header">
    <div>
      <div class="company-title">${companyName}</div>
      <div class="report-name">${title}</div>
    </div>
    <div class="meta-info">
      <div><strong>Generated Date:</strong> ${nowStr}</div>
      <div><strong>Security Context:</strong> Multi-Tenant Verified</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>${headersHtml}</tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  ${summaryHtml}

  <div class="footer">
    <div>Generated by FurnitureOS SaaS Engine</div>
    <div>Confidential Business Document</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>`;
}

export class ExportService {
  private async getCompanyName(companyId: string): Promise<string> {
    const comp = await prisma.company.findUnique({ where: { id: companyId }, select: { name: true } });
    return comp?.name || 'Furniture Business';
  }

  async generateReport(
    companyId: string,
    reportType: string,
    format: 'csv' | 'excel' | 'xlsx' | 'pdf' = 'csv',
    options: DateFilterOptions = {}
  ): Promise<{ filename: string; content: string; contentType: string }> {
    const companyName = await this.getCompanyName(companyId);
    const nowStr = new Date().toISOString().split('T')[0];

    let headers: string[] = [];
    let rows: any[][] = [];
    let title = 'Business Report';
    let summaryRows: { label: string; value: string | number }[] = [];

    if (reportType === 'sales') {
      title = 'Sales Orders Report';
      const data = await analyticsService.getSalesReports(companyId, options);
      headers = ['Order Number', 'Customer Name', 'Date', 'Total Amount (₹)', 'Paid Amount (₹)', 'Due Amount (₹)', 'Payment Status'];
      rows = data.salesList.map((s) => [
        s.saleNumber,
        s.customerName,
        new Date(s.date).toISOString().split('T')[0],
        s.totalAmount,
        s.paidAmount || 0,
        s.dueAmount || 0,
        s.paymentStatus,
      ]);
      summaryRows = [
        { label: 'Total Sales Orders', value: data.summary.totalOrders },
        { label: 'Total Revenue', value: `₹${data.summary.totalRevenue.toLocaleString('en-IN')}` },
        { label: 'Total Paid', value: `₹${data.summary.totalPaid.toLocaleString('en-IN')}` },
        { label: 'Total Outstanding Dues', value: `₹${data.summary.totalOutstanding.toLocaleString('en-IN')}` },
      ];
    } else if (reportType === 'inventory') {
      title = 'Inventory Valuation & Stock Report';
      const data = await analyticsService.getInventoryReports(companyId);
      headers = ['SKU', 'Product Name', 'Category', 'Current Stock', 'Cost Price (₹)', 'Selling Price (₹)', 'Stock Value (₹)'];
      rows = data.fullInventory.map((i) => [
        i.sku,
        i.name,
        i.category,
        i.currentStock,
        i.costPrice,
        i.sellingPrice,
        i.stockValue,
      ]);
      summaryRows = [
        { label: 'Total Catalog Products', value: data.summary.totalProducts },
        { label: 'Total Inventory Stock Units', value: data.summary.totalStockUnits },
        { label: 'Total Stock Valuation', value: `₹${data.summary.totalInventoryValue.toLocaleString('en-IN')}` },
        { label: 'Low Stock Alert Items', value: data.summary.lowStockCount },
      ];
    } else if (reportType === 'purchases') {
      title = 'Purchase Orders Report';
      const data = await analyticsService.getPurchaseReports(companyId, options);
      headers = ['PO Number', 'Supplier Name', 'Date', 'Total Amount (₹)', 'Paid Amount (₹)', 'Due Amount (₹)', 'Payment Status'];
      rows = data.purchaseList.map((p) => [
        p.purchaseNumber,
        p.supplierName,
        new Date(p.date).toISOString().split('T')[0],
        p.totalAmount,
        p.paidAmount || 0,
        p.dueAmount || 0,
        p.paymentStatus,
      ]);
      summaryRows = [
        { label: 'Total Purchase Orders', value: data.summary.totalOrders },
        { label: 'Total Purchase Outflow', value: `₹${data.summary.totalPurchasesAmount.toLocaleString('en-IN')}` },
        { label: 'Total Outstanding Payables', value: `₹${data.summary.totalOutstanding.toLocaleString('en-IN')}` },
      ];
    } else if (reportType === 'customers') {
      title = 'Customer Analytics & Receivables';
      const data = await analyticsService.getCustomerAnalytics(companyId);
      headers = ['Customer Code', 'Customer Name', 'Phone', 'Email', 'Orders Count', 'Total Spent (₹)', 'Outstanding Balance (₹)'];
      rows = data.allCustomers.map((c) => [
        c.customerCode,
        c.name,
        c.phone || '',
        c.email || '',
        c.orderCount,
        c.totalSpent,
        c.outstanding,
      ]);
      summaryRows = [
        { label: 'Total Customers', value: data.totalCustomers },
        { label: 'Customers With Pending Dues', value: data.customersWithDueCount },
      ];
    } else if (reportType === 'suppliers') {
      title = 'Supplier Analytics & Payables';
      const data = await analyticsService.getSupplierAnalytics(companyId);
      headers = ['Supplier Code', 'Supplier Name', 'Phone', 'Email', 'Purchases Count', 'Total Purchased (₹)', 'Outstanding Payables (₹)'];
      rows = data.allSuppliers.map((s) => [
        s.supplierCode,
        s.name,
        s.phone || '',
        s.email || '',
        s.purchaseCount,
        s.totalPurchased,
        s.outstanding,
      ]);
      summaryRows = [
        { label: 'Total Vendors', value: data.totalSuppliers },
        { label: 'Vendors With Pending Payables', value: data.suppliersWithDueCount },
      ];
    } else if (reportType === 'expenses') {
      title = 'Expense Analytics Report';
      const data = await analyticsService.getExpenseReports(companyId, options);
      headers = ['Title', 'Category', 'Amount (₹)', 'Payment Method', 'Date'];
      rows = data.expenseList.map((e: any) => [
        e.title,
        e.categoryName,
        e.amount,
        e.paymentMethod,
        new Date(e.date).toISOString().split('T')[0],
      ]);
      summaryRows = [{ label: 'Total Business Expenses', value: `₹${data.totalExpenses.toLocaleString('en-IN')}` }];
    } else if (reportType === 'cash-flow' || reportType === 'finance') {
      title = 'Cash Flow & Finance Statement';
      const data = await analyticsService.getFinanceReports(companyId, options);
      headers = ['Type', 'Party / Title', 'Account Name', 'Amount (₹)', 'Date'];
      rows = [
        ...data.customerPaymentsList.map((c: any) => ['Money In (Customer Receipt)', c.customerName, c.accountName, c.amount, new Date(c.date).toISOString().split('T')[0]]),
        ...data.supplierPaymentsList.map((s: any) => ['Money Out (Supplier Payment)', s.supplierName, s.accountName, s.amount, new Date(s.date).toISOString().split('T')[0]]),
        ...data.expensesList.map((e: any) => ['Money Out (Expense)', e.title, e.accountName, e.amount, new Date(e.date).toISOString().split('T')[0]]),
      ];
      summaryRows = [
        { label: 'Total Money In', value: `₹${data.summary.totalMoneyIn.toLocaleString('en-IN')}` },
        { label: 'Total Money Out', value: `₹${data.summary.totalMoneyOut.toLocaleString('en-IN')}` },
        { label: 'Net Cash Flow', value: `₹${data.summary.netCashFlow.toLocaleString('en-IN')}` },
      ];
    } else {
      throw new Error(`Unsupported report type: ${reportType}`);
    }

    if (format === 'excel' || format === 'xlsx') {
      return {
        filename: `${reportType}-report-${nowStr}.xls`,
        content: buildExcelHtml(companyName, title, headers, rows, summaryRows),
        contentType: 'application/vnd.ms-excel; charset=utf-8',
      };
    }

    if (format === 'pdf') {
      return {
        filename: `${reportType}-report-${nowStr}.html`,
        content: buildPdfHtml(companyName, title, headers, rows, summaryRows),
        contentType: 'text/html',
      };
    }

    return {
      filename: `${reportType}-report-${nowStr}.csv`,
      content: '\uFEFF' + buildCsvString(headers, rows),
      contentType: 'text/csv; charset=utf-8',
    };
  }
}

export const exportService = new ExportService();
