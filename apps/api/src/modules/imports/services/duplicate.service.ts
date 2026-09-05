import { prisma } from '../../../config/prisma.js';
import { ImportModuleType, DuplicateRecordInfo } from '../types/import.types.js';

export class DuplicateService {
  /**
   * Detect duplicates against Neon PostgreSQL for a specific company tenant
   */
  public async checkDuplicates(
    companyId: string,
    module: ImportModuleType,
    rows: Record<string, any>[]
  ): Promise<DuplicateRecordInfo[]> {
    const duplicates: DuplicateRecordInfo[] = [];

    try {
      switch (module) {
        case 'PRODUCTS':
        case 'INVENTORY': {
          const skus = rows.map((r) => String(r.sku || '').trim()).filter(Boolean);
          if (skus.length === 0) break;

          const existing = await prisma.product.findMany({
            where: { companyId, sku: { in: skus } },
            select: { id: true, sku: true, name: true }
          });

          const existingMap = new Map<string, string>(
            existing.map((p: { sku: string; id: string }) => [String(p.sku || '').toLowerCase(), p.id])
          );

          rows.forEach((r) => {
            const skuStr = String(r.sku || '').trim();
            if (skuStr && existingMap.has(skuStr.toLowerCase())) {
              const existingId: string | undefined = existingMap.get(skuStr.toLowerCase());
              duplicates.push({
                row: r._rowNum,
                uniqueKey: 'sku',
                field: 'SKU',
                value: r.sku,
                existingId,
                uploadedData: r
              });
            }
          });
          break;
        }
        case 'CATEGORIES': {
          const names = rows.map((r) => String(r.name || '').trim()).filter(Boolean);
          if (names.length === 0) break;

          const existing = await prisma.category.findMany({
            where: { companyId, name: { in: names } },
            select: { id: true, name: true }
          });

          const existingMap = new Map<string, string>(
            existing.map((c: { name: string; id: string }) => [String(c.name || '').toLowerCase(), c.id])
          );

          rows.forEach((r) => {
            const nameStr = String(r.name || '').trim();
            if (nameStr && existingMap.has(nameStr.toLowerCase())) {
              const existingId: string | undefined = existingMap.get(nameStr.toLowerCase());
              duplicates.push({
                row: r._rowNum,
                uniqueKey: 'name',
                field: 'Category Name',
                value: r.name,
                existingId,
                uploadedData: r
              });
            }
          });
          break;
        }
        case 'UNITS': {
          const names = rows.map((r) => String(r.name || '').trim()).filter(Boolean);
          const codes = rows.map((r) => String(r.shortCode || '').trim()).filter(Boolean);

          const existing = await prisma.unit.findMany({
            where: {
              companyId,
              OR: [{ name: { in: names } }, { shortCode: { in: codes } }]
            },
            select: { id: true, name: true, shortCode: true }
          });

          const nameMap = new Map<string, string>(
            existing.map((u: { name: string; id: string }) => [String(u.name || '').toLowerCase(), u.id])
          );
          const codeMap = new Map<string, string>(
            existing.map((u: { shortCode: string; id: string }) => [String(u.shortCode || '').toLowerCase(), u.id])
          );

          rows.forEach((r) => {
            const nameStr = String(r.name || '').trim();
            const codeStr = String(r.shortCode || '').trim();
            if (nameStr && nameMap.has(nameStr.toLowerCase())) {
              const existingId: string | undefined = nameMap.get(nameStr.toLowerCase());
              duplicates.push({
                row: r._rowNum,
                uniqueKey: 'name',
                field: 'Unit Name',
                value: r.name,
                existingId,
                uploadedData: r
              });
            } else if (codeStr && codeMap.has(codeStr.toLowerCase())) {
              const existingId: string | undefined = codeMap.get(codeStr.toLowerCase());
              duplicates.push({
                row: r._rowNum,
                uniqueKey: 'shortCode',
                field: 'Short Code',
                value: r.shortCode,
                existingId,
                uploadedData: r
              });
            }
          });
          break;
        }
        case 'CUSTOMERS': {
          const phones = rows.map((r) => String(r.phone || '').trim()).filter(Boolean);
          if (phones.length === 0) break;

          const existing = await prisma.customer.findMany({
            where: { companyId, phone: { in: phones } },
            select: { id: true, phone: true }
          });

          const existingMap = new Map<string, string>(
            existing.map((c: { phone: string; id: string }) => [String(c.phone || ''), c.id])
          );

          rows.forEach((r) => {
            const phoneStr = String(r.phone || '').trim();
            if (phoneStr && existingMap.has(phoneStr)) {
              const existingId: string | undefined = existingMap.get(phoneStr);
              duplicates.push({
                row: r._rowNum,
                uniqueKey: 'phone',
                field: 'Phone',
                value: r.phone,
                existingId,
                uploadedData: r
              });
            }
          });
          break;
        }
        case 'SUPPLIERS': {
          const phones = rows.map((r) => String(r.phone || '').trim()).filter(Boolean);
          if (phones.length === 0) break;

          const existing = await prisma.supplier.findMany({
            where: { companyId, phone: { in: phones } },
            select: { id: true, phone: true }
          });

          const existingMap = new Map<string, string>(
            existing.map((s: { phone: string; id: string }) => [String(s.phone || ''), s.id])
          );

          rows.forEach((r) => {
            const phoneStr = String(r.phone || '').trim();
            if (phoneStr && existingMap.has(phoneStr)) {
              const existingId: string | undefined = existingMap.get(phoneStr);
              duplicates.push({
                row: r._rowNum,
                uniqueKey: 'phone',
                field: 'Phone',
                value: r.phone,
                existingId,
                uploadedData: r
              });
            }
          });
          break;
        }
        case 'WORKERS': {
          const codes = rows.map((r) => String(r.employeeCode || '').trim()).filter(Boolean);
          if (codes.length === 0) break;

          const existing = await prisma.worker.findMany({
            where: { companyId, employeeCode: { in: codes } },
            select: { id: true, employeeCode: true }
          });

          const existingMap = new Map<string, string>(
            existing.map((w: { employeeCode: string; id: string }) => [String(w.employeeCode || '').toLowerCase(), w.id])
          );

          rows.forEach((r) => {
            const codeStr = String(r.employeeCode || '').trim();
            if (codeStr && existingMap.has(codeStr.toLowerCase())) {
              const existingId: string | undefined = existingMap.get(codeStr.toLowerCase());
              duplicates.push({
                row: r._rowNum,
                uniqueKey: 'employeeCode',
                field: 'Employee Code',
                value: r.employeeCode,
                existingId,
                uploadedData: r
              });
            }
          });
          break;
        }
        case 'SALES': {
          const invoices = rows.map((r) => String(r.invoiceNumber || '').trim()).filter(Boolean);
          if (invoices.length === 0) break;

          const existing = await prisma.sale.findMany({
            where: { companyId, saleNumber: { in: invoices } },
            select: { id: true, saleNumber: true }
          });

          const existingMap = new Map<string, string>(
            existing.map((s: { saleNumber: string; id: string }) => [String(s.saleNumber || '').toLowerCase(), s.id])
          );

          rows.forEach((r) => {
            const invStr = String(r.invoiceNumber || '').trim();
            if (invStr && existingMap.has(invStr.toLowerCase())) {
              const existingId: string | undefined = existingMap.get(invStr.toLowerCase());
              duplicates.push({
                row: r._rowNum,
                uniqueKey: 'invoiceNumber',
                field: 'Invoice Number',
                value: r.invoiceNumber,
                existingId,
                uploadedData: r
              });
            }
          });
          break;
        }
        case 'PURCHASES': {
          const purchases = rows.map((r) => String(r.purchaseNumber || '').trim()).filter(Boolean);
          if (purchases.length === 0) break;

          const existing = await prisma.purchase.findMany({
            where: { companyId, purchaseNumber: { in: purchases } },
            select: { id: true, purchaseNumber: true }
          });

          const existingMap = new Map<string, string>(
            existing.map((p: { purchaseNumber: string; id: string }) => [String(p.purchaseNumber || '').toLowerCase(), p.id])
          );

          rows.forEach((r) => {
            const purStr = String(r.purchaseNumber || '').trim();
            if (purStr && existingMap.has(purStr.toLowerCase())) {
              const existingId: string | undefined = existingMap.get(purStr.toLowerCase());
              duplicates.push({
                row: r._rowNum,
                uniqueKey: 'purchaseNumber',
                field: 'Purchase Number',
                value: r.purchaseNumber,
                existingId,
                uploadedData: r
              });
            }
          });
          break;
        }
      }
    } catch (err) {
      // Ignore database duplicate check errors to allow preview to proceed
    }

    return duplicates;
  }
}

export const duplicateService = new DuplicateService();
