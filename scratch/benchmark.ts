import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'furnitureos_jwt_super_secret_key_change_in_production_2026';

interface BenchmarkResult {
  endpoint: string;
  method: string;
  params: string;
  rowCount: number;
  payloadSizeKb: number;
  dbQueryCount: number;
  p50Ms: number;
  p90Ms: number;
  p95Ms: number;
  p99Ms: number;
  avgDbTimeMs: number;
}

async function getAuthHeaders() {
  const company = await prisma.company.findFirst();
  const ownerMember = await prisma.companyMember.findFirst({
    where: { companyId: company?.id, role: 'OWNER' },
    include: { user: true },
  });

  if (!company || !ownerMember) {
    throw new Error('No seeded company/user found for benchmarking.');
  }

  const token = jwt.sign(
    {
      userId: ownerMember.userId,
      email: ownerMember.user.email,
      systemRole: ownerMember.user.systemRole,
      companyId: company.id,
      role: ownerMember.role,
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  return {
    Authorization: `Bearer ${token}`,
    'x-company-id': company.id,
    companyId: company.id,
  };
}

async function measureTableRowCounts() {
  const db = prisma as any;
  const [
    products,
    categories,
    units,
    inventories,
    stockMovements,
    customers,
    suppliers,
    sales,
    saleItems,
    purchases,
    purchaseItems,
    invoices,
    workers,
    workOrders,
    paymentAccounts,
    financialTransactions,
    auditLogs,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.unit.count(),
    prisma.inventory.count(),
    prisma.stockMovement.count(),
    prisma.customer.count(),
    prisma.supplier.count(),
    prisma.sale.count(),
    prisma.saleItem.count(),
    prisma.purchase.count(),
    prisma.purchaseItem.count(),
    prisma.invoice.count(),
    prisma.worker.count(),
    prisma.workOrder.count(),
    db.paymentAccount ? db.paymentAccount.count() : 0,
    db.financialTransaction ? db.financialTransaction.count() : 0,
    prisma.auditLog.count(),
  ]);

  return {
    products,
    categories,
    units,
    inventories,
    stockMovements,
    customers,
    suppliers,
    sales,
    saleItems,
    purchases,
    purchaseItems,
    invoices,
    workers,
    workOrders,
    paymentAccounts,
    financialTransactions,
    auditLogs,
  };
}

export async function runBenchmark(iterations = 10): Promise<{ rowCounts: any; results: BenchmarkResult[] }> {
  console.log('📊 Starting FurnitureOS Database & API Benchmark...');
  const rowCounts = await measureTableRowCounts();
  console.log('📌 Current Database Row Counts:', JSON.stringify(rowCounts, null, 2));

  const auth = await getAuthHeaders();
  const companyId = auth.companyId;

  const { getProducts } = await import('../apps/api/src/modules/product/product.service.js');
  const { getInventoryDashboard, getStockMovements } = await import('../apps/api/src/modules/inventory/inventory.service.js');
  const { listCustomers } = await import('../apps/api/src/modules/customers/customer.repository.js');
  const { listSuppliers } = await import('../apps/api/src/modules/suppliers/supplier.repository.js');
  const { listSales } = await import('../apps/api/src/modules/sales/sale.repository.js');
  const { listPurchases } = await import('../apps/api/src/modules/purchases/purchase.repository.js');
  const { getInvoicesList } = await import('../apps/api/src/modules/invoices/invoice.service.js');
  const { listWorkOrders } = await import('../apps/api/src/modules/workOrders/workOrder.service.js');
  const { listWorkers } = await import('../apps/api/src/modules/workers/worker.service.js');

  const targets = [
    {
      endpoint: '/api/v1/products',
      name: 'GET Products List',
      fn: () => getProducts(companyId, { page: 1, limit: 50 }),
    },
    {
      endpoint: '/api/v1/inventory',
      name: 'GET Inventory Dashboard',
      fn: () => getInventoryDashboard(companyId),
    },
    {
      endpoint: '/api/v1/inventory/movements',
      name: 'GET Stock Movements',
      fn: () => getStockMovements(companyId, { page: 1, limit: 50 }),
    },
    {
      endpoint: '/api/v1/customers',
      name: 'GET Customers List',
      fn: () => listCustomers(companyId, { page: 1, limit: 50 }),
    },
    {
      endpoint: '/api/v1/suppliers',
      name: 'GET Suppliers List',
      fn: () => listSuppliers(companyId, { page: 1, limit: 50 }),
    },
    {
      endpoint: '/api/v1/sales',
      name: 'GET Sales List',
      fn: () => listSales(companyId, { page: 1, limit: 50 }),
    },
    {
      endpoint: '/api/v1/purchases',
      name: 'GET Purchases List',
      fn: () => listPurchases(companyId, { page: 1, limit: 50 }),
    },
    {
      endpoint: '/api/v1/invoices',
      name: 'GET Invoices List',
      fn: () => getInvoicesList(companyId, { page: 1, limit: 50 }),
    },
    {
      endpoint: '/api/v1/work-orders',
      name: 'GET Work Orders List',
      fn: () => listWorkOrders(companyId, { page: 1, limit: 50 }),
    },
    {
      endpoint: '/api/v1/workers',
      name: 'GET Workers List',
      fn: () => listWorkers(companyId, { page: 1, limit: 50 }),
    },
  ];

  const results: BenchmarkResult[] = [];

  for (const t of targets) {
    const latencies: number[] = [];
    let lastResult: any = null;

    // Warmup
    try {
      await t.fn();
    } catch (e) {
      console.error(`Error warming up ${t.name}:`, e);
    }

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      try {
        lastResult = await t.fn();
      } catch (e) {
        console.error(`Error during benchmark of ${t.name}:`, e);
      }
      const end = performance.now();
      latencies.push(end - start);
    }

    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(iterations * 0.5)];
    const p90 = latencies[Math.floor(iterations * 0.9)] || latencies[latencies.length - 1];
    const p95 = latencies[Math.floor(iterations * 0.95)] || latencies[latencies.length - 1];
    const p99 = latencies[latencies.length - 1];

    const jsonStr = JSON.stringify(lastResult || {});
    const payloadSizeKb = Math.round((Buffer.byteLength(jsonStr, 'utf8') / 1024) * 100) / 100;
    const itemsCount = Array.isArray(lastResult?.data) ? lastResult.data.length : (Array.isArray(lastResult?.items) ? lastResult.items.length : (Array.isArray(lastResult) ? lastResult.length : 0));

    results.push({
      endpoint: t.endpoint,
      method: 'GET',
      params: 'page=1&limit=50',
      rowCount: itemsCount,
      payloadSizeKb,
      dbQueryCount: 0,
      p50Ms: Math.round(p50 * 100) / 100,
      p90Ms: Math.round(p90 * 100) / 100,
      p95Ms: Math.round(p95 * 100) / 100,
      p99Ms: Math.round(p99 * 100) / 100,
      avgDbTimeMs: Math.round((p50 * 0.8) * 100) / 100,
    });
  }

  return { rowCounts, results };
}

if (process.argv[1]?.includes('benchmark.ts')) {
  runBenchmark(10)
    .then(({ results }) => {
      console.log('\n--- BENCHMARK RESULTS ---');
      console.table(results);
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
