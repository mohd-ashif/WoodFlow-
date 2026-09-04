import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'furnitureos_jwt_super_secret_key_change_in_production_2026';

export async function runVerification() {
  console.log('⚡ Running Post-Optimization Performance Verification...');

  const company = await prisma.company.findFirst();
  const ownerMember = await prisma.companyMember.findFirst({
    where: { companyId: company?.id, role: 'OWNER' },
    include: { user: true },
  });

  if (!company || !ownerMember) {
    throw new Error('No company/user found for verification.');
  }

  const companyId = company.id;

  const { getProducts } = await import('../apps/api/src/modules/product/product.service.js');
  const { getInventoryDashboard, getLowStock, getStockMovements } = await import('../apps/api/src/modules/inventory/inventory.service.js');
  const { listCustomers } = await import('../apps/api/src/modules/customers/customer.repository.js');
  const { listSuppliers } = await import('../apps/api/src/modules/suppliers/supplier.repository.js');
  const { findAll: findAllSales } = await import('../apps/api/src/modules/sales/sale.repository.js');
  const { findAll: findAllPurchases } = await import('../apps/api/src/modules/purchases/purchase.repository.js');
  const { getInvoicesList } = await import('../apps/api/src/modules/invoices/invoice.service.js');
  const { listWorkOrders } = await import('../apps/api/src/modules/workOrders/workOrder.service.js');
  const { listWorkers } = await import('../apps/api/src/modules/workers/worker.service.js');

  const tests = [
    { name: 'Products List', fn: () => getProducts(companyId, { page: 1, limit: 50 }) },
    { name: 'Inventory Dashboard', fn: () => getInventoryDashboard(companyId) },
    { name: 'Low Stock List', fn: () => getLowStock(companyId, 1, 50) },
    { name: 'Stock Movements', fn: () => getStockMovements(companyId, { page: 1, limit: 50 }) },
    { name: 'Customers List', fn: () => listCustomers(companyId, { page: 1, limit: 50 }) },
    { name: 'Suppliers List', fn: () => listSuppliers(companyId, { page: 1, limit: 50 }) },
    { name: 'Sales List', fn: () => findAllSales(companyId, { page: 1, limit: 50 }) },
    { name: 'Purchases List', fn: () => findAllPurchases(companyId, { page: 1, limit: 50 }) },
    { name: 'Invoices List', fn: () => getInvoicesList(companyId, { page: 1, limit: 50 }) },
    { name: 'Work Orders List', fn: () => listWorkOrders(companyId, { page: 1, limit: 50 }) },
    { name: 'Workers List', fn: () => listWorkers(companyId, { page: 1, limit: 50 }) },
  ];

  const results = [];

  for (const t of tests) {
    const samples = [];
    let res: any = null;

    // Warmup
    try { await t.fn(); } catch (e) {}

    for (let i = 0; i < 15; i++) {
      const start = performance.now();
      res = await t.fn();
      const duration = performance.now() - start;
      samples.push(duration);
    }

    samples.sort((a, b) => a - b);
    const p50 = samples[Math.floor(samples.length * 0.5)];
    const p95 = samples[Math.floor(samples.length * 0.95)] || samples[samples.length - 1];
    const p99 = samples[samples.length - 1];

    const jsonStr = JSON.stringify(res || {});
    const payloadSizeKb = Math.round((Buffer.byteLength(jsonStr, 'utf8') / 1024) * 100) / 100;

    results.push({
      endpoint: t.name,
      p50Ms: Math.round(p50 * 100) / 100,
      p95Ms: Math.round(p95 * 100) / 100,
      p99Ms: Math.round(p99 * 100) / 100,
      payloadSizeKb,
    });
  }

  console.table(results);
  return results;
}

if (process.argv[1]?.includes('verify_perf_optimizations.ts')) {
  runVerification()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
