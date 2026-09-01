import { prisma } from '../../config/prisma.js';

export interface GlobalSearchResultItem {
  id: string;
  type: 'PRODUCT' | 'CUSTOMER' | 'SUPPLIER' | 'INVOICE' | 'PURCHASE' | 'WORKER';
  title: string;
  subtitle: string;
  link: string;
  metadata?: Record<string, any>;
}

export class SearchService {
  /**
   * Search across multi-tenant furniture entities: Products, Customers, Suppliers, Sales Invoices, Purchases, Workers
   */
  public async globalSearch(companyId: string, query: string, limitPerCategory = 5): Promise<GlobalSearchResultItem[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const q = query.trim().toLowerCase();
    const results: GlobalSearchResultItem[] = [];

    // 1. Products (by name or SKU)
    const products = await prisma.product.findMany({
      where: {
        companyId,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } }
        ]
      },
      take: limitPerCategory,
      select: { id: true, name: true, sku: true, sellingPrice: true, category: { select: { name: true } } }
    });

    products.forEach((p) => {
      results.push({
        id: p.id,
        type: 'PRODUCT',
        title: p.name,
        subtitle: `SKU: ${p.sku} • ₹${p.sellingPrice} • ${p.category?.name || 'Uncategorized'}`,
        link: `/inventory/products?search=${encodeURIComponent(p.sku)}`,
        metadata: { sku: p.sku, price: p.sellingPrice }
      });
    });

    // 2. Customers (by name, phone, or email)
    const customers = await prisma.customer.findMany({
      where: {
        companyId,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } }
        ]
      },
      take: limitPerCategory,
      select: { id: true, name: true, phone: true, email: true }
    });

    customers.forEach((c: any) => {
      results.push({
        id: c.id,
        type: 'CUSTOMER',
        title: c.name,
        subtitle: `Phone: ${c.phone || 'N/A'} • Email: ${c.email || 'N/A'}`,
        link: `/crm/customers?search=${encodeURIComponent(c.name)}`,
        metadata: { phone: c.phone, email: c.email }
      });
    });

    // 3. Suppliers (by name, phone, or email)
    const suppliers = await prisma.supplier.findMany({
      where: {
        companyId,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } }
        ]
      },
      take: limitPerCategory,
      select: { id: true, name: true, phone: true, email: true }
    });

    suppliers.forEach((s: any) => {
      results.push({
        id: s.id,
        type: 'SUPPLIER',
        title: s.name,
        subtitle: `Phone: ${s.phone || 'N/A'} • Email: ${s.email || 'N/A'}`,
        link: `/crm/suppliers?search=${encodeURIComponent(s.name)}`,
        metadata: { phone: s.phone, email: s.email }
      });
    });

    // 4. Sales / Invoices (by saleNumber)
    const sales = await prisma.sale.findMany({
      where: {
        companyId,
        saleNumber: { contains: q, mode: 'insensitive' }
      },
      take: limitPerCategory,
      select: { id: true, saleNumber: true, totalAmount: true, status: true, customer: { select: { name: true } } }
    });

    sales.forEach((s) => {
      results.push({
        id: s.id,
        type: 'INVOICE',
        title: `Invoice #${s.saleNumber}`,
        subtitle: `Customer: ${s.customer?.name || 'Walk-in'} • ₹${s.totalAmount} • Status: ${s.status}`,
        link: `/sales?search=${encodeURIComponent(s.saleNumber)}`,
        metadata: { totalAmount: s.totalAmount, status: s.status }
      });
    });

    // 5. Purchases (by purchaseNumber)
    const purchases = await prisma.purchase.findMany({
      where: {
        companyId,
        purchaseNumber: { contains: q, mode: 'insensitive' }
      },
      take: limitPerCategory,
      select: { id: true, purchaseNumber: true, totalAmount: true, status: true, supplier: { select: { name: true } } }
    });

    purchases.forEach((p) => {
      results.push({
        id: p.id,
        type: 'PURCHASE',
        title: `PO #${p.purchaseNumber}`,
        subtitle: `Supplier: ${p.supplier?.name || 'N/A'} • ₹${p.totalAmount} • Status: ${p.status}`,
        link: `/purchases?search=${encodeURIComponent(p.purchaseNumber)}`,
        metadata: { totalAmount: p.totalAmount, status: p.status }
      });
    });

    // 6. Workers (by employeeCode, firstName, lastName)
    const workers = await prisma.worker.findMany({
      where: {
        companyId,
        OR: [
          { employeeCode: { contains: q, mode: 'insensitive' } },
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } }
        ]
      },
      take: limitPerCategory,
      select: { id: true, employeeCode: true, firstName: true, lastName: true, status: true }
    });

    workers.forEach((w: any) => {
      results.push({
        id: w.id,
        type: 'WORKER',
        title: `${w.firstName} ${w.lastName}`,
        subtitle: `Code: ${w.employeeCode} • Status: ${w.status}`,
        link: `/workers?search=${encodeURIComponent(w.employeeCode)}`,
        metadata: { code: w.employeeCode, status: w.status }
      });
    });

    return results;
  }
}

export const searchService = new SearchService();
