import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../utils/errors.js';
import { numberToIndianWords } from '../../utils/numberToWords.js';

export async function generatePurchaseInvoiceHtml(companyId: string, purchaseId: string): Promise<string> {
  const db = prisma as any;

  // 1. Load Purchase with Supplier, Creator, and Items
  const purchase = await db.purchase.findFirst({
    where: { id: purchaseId, companyId },
    include: {
      supplier: true,
      creator: { select: { name: true, email: true } },
      items: {
        include: {
          product: true,
        },
      },
      goodsReceipts: {
        select: { grnNumber: true },
        take: 1,
      },
      purchaseRequest: {
        select: { requestNumber: true },
      },
    },
  });

  if (!purchase) {
    throw new NotFoundError('Purchase record not found');
  }

  // 2. Load Company details
  const company = await db.company.findUnique({
    where: { id: companyId },
  });

  // 3. Load Manufacturing Settings (for branding & signature preferences)
  const settings = await db.manufacturingSettings.findUnique({
    where: { companyId },
  });

  // 4. Format fields
  const formattedDate = new Date(purchase.purchaseDate || purchase.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const dueDateObj = new Date(purchase.purchaseDate || purchase.createdAt);
  dueDateObj.setDate(dueDateObj.getDate() + 30);
  const formattedDueDate = dueDateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const amountInWords = numberToIndianWords(purchase.totalAmount || 0);

  // 5. Tax Breakdown
  const totalTax = purchase.taxAmount || 0;
  const halfTax = Math.round((totalTax / 2) * 100) / 100;
  const isInterstate = false; // Default intra-state CGST + SGST unless IGST configured

  const statusBadgeColor =
    purchase.paymentStatus === 'PAID'
      ? '#059669'
      : purchase.paymentStatus === 'PARTIALLY_PAID'
      ? '#d97706'
      : '#dc2626';

  const grnRef = purchase.goodsReceipts?.[0]?.grnNumber || '-';
  const prRef = purchase.purchaseRequest?.requestNumber || '-';

  // 6. Build A4 Print Layout HTML
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Purchase Invoice - ${purchase.purchaseNumber}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 11pt;
      color: #1e293b;
      background-color: #ffffff;
      line-height: 1.4;
      padding: 15mm;
      max-width: 210mm;
      margin: 0 auto;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 15px;
    }
    .company-logo {
      max-height: 55px;
      margin-bottom: 8px;
    }
    .company-name {
      font-size: 18pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .company-sub {
      font-size: 9pt;
      color: #64748b;
      line-height: 1.3;
    }
    .doc-title-box {
      text-align: right;
    }
    .doc-title {
      font-size: 20pt;
      font-weight: 800;
      color: #1e293b;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .doc-number {
      font-family: monospace;
      font-size: 12pt;
      font-weight: 700;
      color: #475569;
      margin-top: 4px;
    }
    .badge-status {
      display: inline-block;
      padding: 3px 10px;
      font-size: 8pt;
      font-weight: 700;
      border-radius: 4px;
      color: #ffffff;
      background-color: ${statusBadgeColor};
      text-transform: uppercase;
      margin-top: 6px;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .meta-card {
      width: 48%;
      vertical-align: top;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
    }
    .card-title {
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .entity-name {
      font-size: 11pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .meta-label {
      color: #64748b;
      font-size: 9pt;
    }
    .meta-val {
      font-weight: 600;
      color: #1e293b;
      font-size: 9pt;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .items-table th {
      background-color: #0f172a;
      color: #ffffff;
      font-size: 8.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 8px 10px;
      border: 1px solid #0f172a;
    }
    .items-table td {
      padding: 8px 10px;
      font-size: 9.5pt;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
    }
    .items-table tr:nth-child(even) td {
      background-color: #f8fafc;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-mono { font-family: monospace; }
    .totals-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .totals-box {
      width: 320px;
      margin-left: auto;
      border-collapse: collapse;
    }
    .totals-box td {
      padding: 5px 8px;
      font-size: 9.5pt;
    }
    .totals-box .grand-total-row td {
      font-size: 12pt;
      font-weight: 800;
      color: #0f172a;
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
      padding: 8px;
    }
    .words-box {
      background-color: #f1f5f9;
      border-left: 3px solid #0f172a;
      padding: 10px;
      font-size: 9.5pt;
      font-weight: 600;
      color: #334155;
      margin-bottom: 25px;
    }
    .ref-box {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 6px;
      padding: 10px;
      font-size: 8.5pt;
      color: #475569;
      margin-bottom: 30px;
    }
    .footer-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 40px;
      page-break-inside: avoid;
    }
    .signature-box {
      text-align: center;
      width: 200px;
      font-size: 9pt;
    }
    .signature-line {
      border-top: 1px solid #94a3b8;
      margin-top: 40px;
      padding-top: 5px;
      font-weight: 600;
      color: #334155;
    }
    .page-footer {
      text-align: center;
      font-size: 8pt;
      color: #94a3b8;
      margin-top: 20px;
      border-top: 1px solid #f1f5f9;
      padding-top: 10px;
    }
    @media print {
      body {
        padding: 0;
        max-width: 100%;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>

  <!-- HEADER -->
  <table class="header-table">
    <tr>
      <td>
        <div class="company-name">${company?.name || 'FurnitureOS / WoodFlow'}</div>
        <div class="company-sub">${company?.address || ''} ${company?.city ? company.city + ',' : ''} ${company?.state || ''}</div>
        <div class="company-sub">Phone: ${company?.phone || 'N/A'} | Email: ${company?.email || 'N/A'}</div>
        ${company?.gstNumber ? `<div class="company-sub">GSTIN: <strong>${company.gstNumber}</strong></div>` : ''}
      </td>
      <td class="doc-title-box">
        <div class="doc-title">PURCHASE BILL</div>
        <div class="doc-number">${purchase.purchaseNumber}</div>
        <div><span class="badge-status">${purchase.paymentStatus}</span></div>
      </td>
    </tr>
  </table>

  <!-- METADATA & CARDS -->
  <table class="meta-table">
    <tr>
      <!-- SUPPLIER CARD -->
      <td class="meta-card">
        <div class="card-title">SUPPLIER DETAILS (BILL FROM)</div>
        <div class="entity-name">${purchase.supplier?.name || 'Direct Supplier'}</div>
        <div class="meta-val">${purchase.supplier?.phone || ''}</div>
        <div class="meta-val">${purchase.supplier?.email || ''}</div>
        ${purchase.supplier?.gstNumber ? `<div class="meta-val" style="margin-top:4px;">GSTIN: <strong>${purchase.supplier.gstNumber}</strong></div>` : ''}
        <div class="meta-label" style="margin-top:4px;">Code: ${purchase.supplier?.supplierCode || 'N/A'}</div>
      </td>

      <td style="width: 4%;"></td>

      <!-- INVOICE METADATA -->
      <td class="meta-card">
        <div class="card-title">BILL INFORMATION</div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td class="meta-label">Bill Date:</td>
            <td class="meta-val text-right">${formattedDate}</td>
          </tr>
          <tr>
            <td class="meta-label">Due Date:</td>
            <td class="meta-val text-right">${formattedDueDate}</td>
          </tr>
          <tr>
            <td class="meta-label">PO Ref:</td>
            <td class="meta-val text-right font-mono">${purchase.referenceNumber || purchase.purchaseNumber}</td>
          </tr>
          <tr>
            <td class="meta-label">GRN Ref:</td>
            <td class="meta-val text-right font-mono">${grnRef}</td>
          </tr>
          <tr>
            <td class="meta-label">Created By:</td>
            <td class="meta-val text-right">${purchase.creator?.name || 'Admin'}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- ITEMS TABLE -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 5%;">#</th>
        <th style="width: 35%;">Item Description</th>
        <th style="width: 15%;">SKU</th>
        <th style="width: 10%; text-align: center;">Qty</th>
        <th style="width: 12%; text-align: right;">Unit Rate</th>
        <th style="width: 8%; text-align: right;">GST</th>
        <th style="width: 15%; text-align: right;">Total Amount</th>
      </tr>
    </thead>
    <tbody>
      ${purchase.items
        .map((item: any, idx: number) => {
          const taxRate = item.taxRate || 18;
          return `
          <tr>
            <td class="text-center font-mono">${idx + 1}</td>
            <td>
              <strong style="color:#0f172a;">${item.productNameSnapshot}</strong>
            </td>
            <td class="font-mono" style="color:#64748b;">${item.skuSnapshot}</td>
            <td class="text-center font-mono font-semibold">${item.quantity}</td>
            <td class="text-right font-mono">₹${(item.unitCost || 0).toLocaleString('en-IN')}</td>
            <td class="text-right font-mono">${taxRate}%</td>
            <td class="text-right font-mono font-semibold">₹${(item.totalAmount || 0).toLocaleString('en-IN')}</td>
          </tr>`;
        })
        .join('')}
    </tbody>
  </table>

  <!-- TOTALS SECTION -->
  <table class="totals-table">
    <tr>
      <td style="vertical-align: top;">
        <!-- PAYMENT STATUS BREAKDOWN -->
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px; width:260px;">
          <div class="card-title">PAYMENT BREAKDOWN</div>
          <table style="width:100%; font-size:9pt;">
            <tr>
              <td class="meta-label">Total Bill:</td>
              <td class="text-right font-mono font-semibold">₹${purchase.totalAmount.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td class="meta-label">Paid Amount:</td>
              <td class="text-right font-mono font-semibold" style="color:#059669;">₹${purchase.paidAmount.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td class="meta-label">Outstanding Due:</td>
              <td class="text-right font-mono font-semibold" style="color:#dc2626;">₹${purchase.dueAmount.toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>
      </td>

      <td style="vertical-align: top;">
        <table class="totals-box">
          <tr>
            <td class="meta-label">Taxable Subtotal:</td>
            <td class="text-right font-mono">₹${purchase.subtotal.toLocaleString('en-IN')}</td>
          </tr>
          ${
            purchase.discountAmount > 0
              ? `<tr>
                  <td class="meta-label">Discount:</td>
                  <td class="text-right font-mono" style="color:#dc2626;">- ₹${purchase.discountAmount.toLocaleString('en-IN')}</td>
                </tr>`
              : ''
          }
          ${
            isInterstate
              ? `<tr>
                  <td class="meta-label">IGST @ 18%:</td>
                  <td class="text-right font-mono">+ ₹${totalTax.toLocaleString('en-IN')}</td>
                </tr>`
              : `<tr>
                  <td class="meta-label">CGST:</td>
                  <td class="text-right font-mono">+ ₹${halfTax.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td class="meta-label">SGST:</td>
                  <td class="text-right font-mono">+ ₹${halfTax.toLocaleString('en-IN')}</td>
                </tr>`
          }
          <tr class="grand-total-row">
            <td>Grand Total:</td>
            <td class="text-right font-mono">₹${purchase.totalAmount.toLocaleString('en-IN')}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- AMOUNT IN WORDS -->
  <div class="words-box">
    Amount in Words: <span>${amountInWords}</span>
  </div>

  <!-- PURCHASE REFERENCES -->
  <div class="ref-box">
    <strong>ERP Traceability References:</strong> Purchase Order: <span class="font-mono">${purchase.purchaseNumber}</span> | Requisition: <span class="font-mono">${prRef}</span> | Goods Receipt: <span class="font-mono">${grnRef}</span>
  </div>

  <!-- FOOTER & SIGNATURE -->
  <table class="footer-table">
    <tr>
      <td style="font-size: 8.5pt; color: #64748b; vertical-align: bottom;">
        Thank you for your business.<br>
        This is a computer-generated Purchase Bill and does not require a physical signature.
      </td>
      <td style="text-align: right;">
        <div class="signature-box" style="margin-left: auto;">
          <div class="signature-line">
            Authorized Signatory<br>
            <span style="font-size: 8pt; font-weight: normal; color: #64748b;">${company?.name || 'FurnitureOS / WoodFlow'}</span>
          </div>
        </div>
      </td>
    </tr>
  </table>

  <div class="page-footer">
    Generated by FurnitureOS / WoodFlow ERP • Page 1 of 1
  </div>

</body>
</html>`;
}
