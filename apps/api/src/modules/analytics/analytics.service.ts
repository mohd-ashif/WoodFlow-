import { prisma } from '../../config/prisma.js';
import { DateFilterOptions, PeriodComparison, BusinessInsight } from './analytics.types.js';

const db = prisma as any;

/**
 * Helper to compute start & end Date objects based on filter options or presets
 */
function resolveDateRange(options: DateFilterOptions): {
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
} {
  const now = new Date();

  let currentStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0); // Default: This month start
  let currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  if (options.preset === 'today') {
    currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (options.preset === 'yesterday') {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    currentStart = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0);
    currentEnd = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
  } else if (options.preset === 'this_week') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    currentStart = new Date(now.setDate(diff));
    currentStart.setHours(0, 0, 0, 0);
    currentEnd = new Date();
  } else if (options.preset === 'last_month') {
    currentStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    currentEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else if (options.preset === 'this_year') {
    currentStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    currentEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else if (options.startDate || options.endDate) {
    if (options.startDate) {
      currentStart = new Date(options.startDate);
      currentStart.setHours(0, 0, 0, 0);
    }
    if (options.endDate) {
      currentEnd = new Date(options.endDate);
      currentEnd.setHours(23, 59, 59, 999);
    }
  }

  // Calculate equivalent preceding period length
  const durationMs = currentEnd.getTime() - currentStart.getTime();
  const previousEnd = new Date(currentStart.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - durationMs);

  return { currentStart, currentEnd, previousStart, previousEnd };
}

/**
 * Calculate percentage change & direction between 2 numbers
 */
function calculateComparison(current: number, previous: number): PeriodComparison {
  const changeAmount = current - previous;
  let percentageChange = 0;

  if (previous > 0) {
    percentageChange = Math.round(((current - previous) / previous) * 100);
  } else if (previous === 0 && current > 0) {
    percentageChange = 100;
  } else {
    percentageChange = 0;
  }

  let direction: 'INCREASE' | 'DECREASE' | 'NO_CHANGE' = 'NO_CHANGE';
  if (changeAmount > 0) direction = 'INCREASE';
  else if (changeAmount < 0) direction = 'DECREASE';

  return {
    currentValue: current,
    previousValue: previous,
    changeAmount,
    percentageChange: Math.abs(percentageChange),
    direction,
  };
}

export class AnalyticsService {
  // ─── 1. EXECUTIVE BUSINESS DASHBOARD ──────────────────────────────────────
  async getExecutiveOverview(companyId: string, options: DateFilterOptions = {}) {
    const { currentStart, currentEnd, previousStart, previousEnd } = resolveDateRange(options);

    // Current Period Sales
    const currentSalesRes = await prisma.sale.aggregate({
      where: { companyId, status: { not: 'CANCELLED' }, saleDate: { gte: currentStart, lte: currentEnd } },
      _sum: { totalAmount: true },
    });
    const previousSalesRes = await prisma.sale.aggregate({
      where: { companyId, status: { not: 'CANCELLED' }, saleDate: { gte: previousStart, lte: previousEnd } },
      _sum: { totalAmount: true },
    });

    const currentSales = currentSalesRes._sum.totalAmount || 0;
    const previousSales = previousSalesRes._sum.totalAmount || 0;
    const salesComparison = calculateComparison(currentSales, previousSales);

    // Current Period Purchases
    const currentPurchasesRes = await prisma.purchase.aggregate({
      where: { companyId, status: { not: 'CANCELLED' }, purchaseDate: { gte: currentStart, lte: currentEnd } },
      _sum: { totalAmount: true },
    });
    const previousPurchasesRes = await prisma.purchase.aggregate({
      where: { companyId, status: { not: 'CANCELLED' }, purchaseDate: { gte: previousStart, lte: previousEnd } },
      _sum: { totalAmount: true },
    });
    const currentPurchases = currentPurchasesRes._sum.totalAmount || 0;
    const previousPurchases = previousPurchasesRes._sum.totalAmount || 0;
    const purchasesComparison = calculateComparison(currentPurchases, previousPurchases);

    // Current Period Expenses
    let currentExpenses = 0;
    let previousExpenses = 0;
    try {
      if (db.expense?.aggregate) {
        const curExpRes = await db.expense.aggregate({
          where: { companyId, status: 'PAID', expenseDate: { gte: currentStart, lte: currentEnd } },
          _sum: { amount: true },
        });
        const prevExpRes = await db.expense.aggregate({
          where: { companyId, status: 'PAID', expenseDate: { gte: previousStart, lte: previousEnd } },
          _sum: { amount: true },
        });
        currentExpenses = curExpRes._sum.amount || 0;
        previousExpenses = prevExpRes._sum.amount || 0;
      } else {
        const curRows: any[] = await prisma.$queryRawUnsafe(
          `SELECT SUM(amount) as sum FROM expenses WHERE "companyId" = $1 AND status = 'PAID' AND "expenseDate" >= $2 AND "expenseDate" <= $3`,
          companyId, currentStart, currentEnd
        );
        currentExpenses = Number(curRows[0]?.sum || 0);
      }
    } catch {
      currentExpenses = 0;
    }
    const expensesComparison = calculateComparison(currentExpenses, previousExpenses);

    // Money In (Customer Payments)
    let totalMoneyReceived = 0;
    try {
      if (db.customerPayment?.aggregate) {
        const res = await db.customerPayment.aggregate({
          where: { companyId, paymentDate: { gte: currentStart, lte: currentEnd } },
          _sum: { amount: true },
        });
        totalMoneyReceived = res._sum.amount || 0;
      } else {
        const rows: any[] = await prisma.$queryRawUnsafe(
          `SELECT SUM(amount) as sum FROM customer_payments WHERE "companyId" = $1 AND "paymentDate" >= $2 AND "paymentDate" <= $3`,
          companyId, currentStart, currentEnd
        );
        totalMoneyReceived = Number(rows[0]?.sum || 0);
      }
    } catch {
      totalMoneyReceived = 0;
    }

    // Money Out (Supplier Payments + Expenses)
    let totalSupplierPayments = 0;
    try {
      if (db.supplierPayment?.aggregate) {
        const res = await db.supplierPayment.aggregate({
          where: { companyId, paymentDate: { gte: currentStart, lte: currentEnd } },
          _sum: { amount: true },
        });
        totalSupplierPayments = res._sum.amount || 0;
      } else {
        const rows: any[] = await prisma.$queryRawUnsafe(
          `SELECT SUM(amount) as sum FROM supplier_payments WHERE "companyId" = $1 AND "paymentDate" >= $2 AND "paymentDate" <= $3`,
          companyId, currentStart, currentEnd
        );
        totalSupplierPayments = Number(rows[0]?.sum || 0);
      }
    } catch {
      totalSupplierPayments = 0;
    }
    const totalMoneyPaid = totalSupplierPayments + currentExpenses;

    // Outstanding Receivables & Payables
    const salesDuesRes = await prisma.sale.aggregate({
      where: { companyId, status: { not: 'CANCELLED' }, dueAmount: { gt: 0 } },
      _sum: { dueAmount: true },
    });
    const outstandingReceivables = salesDuesRes._sum.dueAmount || 0;

    const purchaseDuesRes = await prisma.purchase.aggregate({
      where: { companyId, status: { not: 'CANCELLED' }, dueAmount: { gt: 0 } },
      _sum: { dueAmount: true },
    });
    const outstandingPayables = purchaseDuesRes._sum.dueAmount || 0;

    // Current Inventory Valuation (purchasePrice × currentStock)
    const products = await prisma.product.findMany({
      where: { companyId, isActive: true },
      select: { currentStock: true, purchasePrice: true },
    });
    const inventoryValuation = products.reduce((acc: number, p: any) => acc + (p.currentStock || 0) * (p.purchasePrice || 0), 0);

    // Available Liquid Cash across Accounts
    let totalLiquidCash = 0;
    try {
      if (db.paymentAccount?.findMany) {
        const accounts = await db.paymentAccount.findMany({
          where: { companyId, isActive: true },
          select: { currentBalance: true },
        });
        totalLiquidCash = accounts.reduce((acc: number, a: any) => acc + (a.currentBalance || 0), 0);
      } else {
        const rows: any[] = await prisma.$queryRawUnsafe(
          `SELECT SUM("currentBalance") as sum FROM payment_accounts WHERE "companyId" = $1 AND ("isActive" = true OR "isActive" IS NULL)`,
          companyId
        );
        totalLiquidCash = Number(rows[0]?.sum || 0);
      }
    } catch {
      totalLiquidCash = 0;
    }

    // Top Selling Products (Top 5)
    const topProducts = await prisma.saleItem.groupBy({
      by: ['productId', 'productNameSnapshot'],
      where: { sale: { companyId, status: { not: 'CANCELLED' }, saleDate: { gte: currentStart, lte: currentEnd } } },
      _sum: { quantity: true, totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 5,
    });

    const topProductsFormatted = topProducts.map((p: any) => ({
      productId: p.productId || '',
      name: p.productNameSnapshot || 'Furniture Item',
      quantitySold: p._sum?.quantity || 0,
      totalRevenue: p._sum?.totalAmount || 0,
    }));

    // Automated Rule-Based Insights Engine
    const insights: BusinessInsight[] = [];

    // Out of Stock / Low Stock Check
    const lowStockProducts = await prisma.product.findMany({
      where: { companyId, isActive: true },
      select: { currentStock: true, minimumStock: true },
    });
    const lowStockCount = lowStockProducts.filter((p) => p.minimumStock > 0 && p.currentStock <= p.minimumStock).length;
    if (lowStockCount > 0) {
      insights.push({
        id: 'low-stock-alert',
        priority: 'ACTION_REQUIRED',
        title: `${lowStockCount} Products Below Minimum Stock`,
        message: 'Replenish inventory to avoid missed sales opportunities.',
        actionUrl: '/inventory/low-stock',
        actionLabel: 'View Low Stock',
      });
    }

    // High Receivables Alert
    if (outstandingReceivables > currentSales * 0.4 && outstandingReceivables > 10000) {
      insights.push({
        id: 'high-receivables',
        priority: 'WARNING',
        title: `High Outstanding Customer Dues`,
        message: `₹${outstandingReceivables.toLocaleString('en-IN')} pending from customers. Collect dues to boost liquidity.`,
        actionUrl: '/finance/receivables',
        actionLabel: 'Collect Receivables',
      });
    }

    // Sales Trend Insight
    if (salesComparison.direction === 'INCREASE' && salesComparison.percentageChange >= 10) {
      insights.push({
        id: 'sales-growth',
        priority: 'INFO',
        title: `Sales Increased by ${salesComparison.percentageChange}%`,
        message: `Business revenue grew from previous period equivalent.`,
      });
    }

    return {
      dateRange: { start: currentStart, end: currentEnd },
      kpis: {
        totalSales: { current: currentSales, comparison: salesComparison },
        totalPurchases: { current: currentPurchases, comparison: purchasesComparison },
        totalExpenses: { current: currentExpenses, comparison: expensesComparison },
        totalMoneyReceived,
        totalMoneyPaid,
        netCashFlow: totalMoneyReceived - totalMoneyPaid,
        outstandingReceivables,
        outstandingPayables,
        inventoryValuation,
        totalLiquidCash,
      },
      topProducts: topProductsFormatted,
      insights,
    };
  }

  // ─── 2. SALES REPORTS ─────────────────────────────────────────────────────
  async getSalesReports(companyId: string, options: DateFilterOptions = {}) {
    const { currentStart, currentEnd } = resolveDateRange(options);

    const sales = await prisma.sale.findMany({
      where: { companyId, status: { not: 'CANCELLED' }, saleDate: { gte: currentStart, lte: currentEnd } },
      include: { customer: { select: { id: true, name: true, phone: true } }, items: true },
      orderBy: { saleDate: 'desc' },
    });

    const totalRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalPaid = sales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
    const totalOutstanding = sales.reduce((acc, s) => acc + (s.dueAmount || 0), 0);
    const averageOrderValue = sales.length > 0 ? Math.round(totalRevenue / sales.length) : 0;

    // Breakdown by payment status
    const paidOrders = sales.filter((s) => s.paymentStatus === 'PAID');
    const partialOrders = sales.filter((s) => s.paymentStatus === 'PARTIALLY_PAID');
    const unpaidOrders = sales.filter((s) => s.paymentStatus === 'UNPAID');

    // Grouping by product
    const productSalesMap = new Map<string, { name: string; quantity: number; revenue: number; ordersCount: number }>();
    sales.forEach((s) => {
      s.items.forEach((item: any) => {
        const prodId = item.productId || item.id;
        const existing = productSalesMap.get(prodId) || {
          name: item.productNameSnapshot,
          quantity: 0,
          revenue: 0,
          ordersCount: 0,
        };
        productSalesMap.set(prodId, {
          name: item.productNameSnapshot,
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + (item.totalAmount || item.subtotal || 0),
          ordersCount: existing.ordersCount + 1,
        });
      });
    });

    const productSales = Array.from(productSalesMap.values()).sort((a, b) => b.revenue - a.revenue);

    return {
      summary: {
        totalOrders: sales.length,
        totalRevenue,
        totalPaid,
        totalOutstanding,
        averageOrderValue,
        statusBreakdown: {
          paidCount: paidOrders.length,
          partialCount: partialOrders.length,
          unpaidCount: unpaidOrders.length,
        },
      },
      productSales,
      salesList: sales.map((s) => ({
        id: s.id,
        saleNumber: s.saleNumber,
        customerName: s.customer?.name || 'Walk-in Customer',
        date: s.saleDate,
        totalAmount: s.totalAmount,
        paidAmount: s.paidAmount,
        dueAmount: s.dueAmount,
        paymentStatus: s.paymentStatus,
      })),
    };
  }

  // ─── 3. INVENTORY REPORTS ─────────────────────────────────────────────────
  async getInventoryReports(companyId: string) {
    const products = await prisma.product.findMany({
      where: { companyId, isActive: true },
      include: { category: { select: { name: true } } },
      orderBy: { currentStock: 'asc' },
    });

    const totalProducts = products.length;
    const totalStockUnits = products.reduce((acc, p) => acc + (p.currentStock || 0), 0);
    const totalInventoryValue = products.reduce((acc, p) => acc + (p.currentStock || 0) * (p.purchasePrice || 0), 0);

    const lowStockItems = products.filter((p) => p.minimumStock > 0 && p.currentStock > 0 && p.currentStock <= p.minimumStock);
    const outOfStockItems = products.filter((p) => p.currentStock <= 0);

    return {
      summary: {
        totalProducts,
        totalStockUnits,
        totalInventoryValue,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
      },
      lowStockList: lowStockItems.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category?.name || 'Uncategorized',
        currentStock: p.currentStock,
        minStockLevel: p.minimumStock,
        status: 'LOW_STOCK',
      })),
      outOfStockList: outOfStockItems.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category?.name || 'Uncategorized',
        currentStock: p.currentStock,
        minStockLevel: p.minimumStock,
        status: 'OUT_OF_STOCK',
      })),
      fullInventory: products.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category?.name || 'Uncategorized',
        currentStock: p.currentStock,
        costPrice: p.purchasePrice,
        sellingPrice: p.sellingPrice,
        stockValue: p.currentStock * p.purchasePrice,
      })),
    };
  }

  // ─── 4. PURCHASE REPORTS ──────────────────────────────────────────────────
  async getPurchaseReports(companyId: string, options: DateFilterOptions = {}) {
    const { currentStart, currentEnd } = resolveDateRange(options);

    const purchases = await prisma.purchase.findMany({
      where: { companyId, status: { not: 'CANCELLED' }, purchaseDate: { gte: currentStart, lte: currentEnd } },
      include: { supplier: { select: { id: true, name: true, phone: true } } },
      orderBy: { purchaseDate: 'desc' },
    });

    const totalPurchasesAmount = purchases.reduce((acc, p) => acc + p.totalAmount, 0);
    const totalPaid = purchases.reduce((acc, p) => acc + (p.paidAmount || 0), 0);
    const totalOutstanding = purchases.reduce((acc, p) => acc + (p.dueAmount || 0), 0);

    // Grouping by supplier
    const supplierMap = new Map<string, { supplierName: string; count: number; totalAmount: number; outstanding: number }>();
    purchases.forEach((p) => {
      if (p.supplier) {
        const existing = supplierMap.get(p.supplier.id) || {
          supplierName: p.supplier.name,
          count: 0,
          totalAmount: 0,
          outstanding: 0,
        };
        supplierMap.set(p.supplier.id, {
          supplierName: p.supplier.name,
          count: existing.count + 1,
          totalAmount: existing.totalAmount + p.totalAmount,
          outstanding: existing.outstanding + (p.dueAmount || 0),
        });
      }
    });

    const supplierPurchases = Array.from(supplierMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);

    return {
      summary: {
        totalOrders: purchases.length,
        totalPurchasesAmount,
        totalPaid,
        totalOutstanding,
      },
      supplierPurchases,
      purchaseList: purchases.map((p) => ({
        id: p.id,
        purchaseNumber: p.purchaseNumber,
        supplierName: p.supplier?.name || 'Direct Vendor',
        date: p.purchaseDate,
        totalAmount: p.totalAmount,
        paidAmount: p.paidAmount,
        dueAmount: p.dueAmount,
        paymentStatus: p.paymentStatus,
      })),
    };
  }

  // ─── 5. CUSTOMER ANALYTICS ────────────────────────────────────────────────
  async getCustomerAnalytics(companyId: string) {
    const customers = await prisma.customer.findMany({
      where: { companyId, status: 'ACTIVE' },
      include: {
        sales: {
          where: { status: { not: 'CANCELLED' } },
          select: { totalAmount: true, paidAmount: true, dueAmount: true, saleDate: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = customers.map((c) => {
      const totalSpent = c.sales.reduce((acc, s) => acc + s.totalAmount, 0);
      const totalPaid = c.sales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
      const outstanding = Math.max(0, totalSpent - totalPaid);
      const orderCount = c.sales.length;
      const lastSaleDate = c.sales.length > 0 ? c.sales[c.sales.length - 1].saleDate : null;

      return {
        id: c.id,
        name: c.name,
        customerCode: c.customerCode,
        phone: c.phone,
        email: c.email,
        orderCount,
        totalSpent,
        totalPaid,
        outstanding,
        lastSaleDate,
      };
    });

    const topCustomers = [...formatted].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);
    const customersWithDue = formatted.filter((c) => c.outstanding > 0).sort((a, b) => b.outstanding - a.outstanding);

    return {
      totalCustomers: customers.length,
      customersWithDueCount: customersWithDue.length,
      topCustomers,
      customersWithDue,
      allCustomers: formatted,
    };
  }

  // ─── 6. SUPPLIER ANALYTICS ────────────────────────────────────────────────
  async getSupplierAnalytics(companyId: string) {
    const suppliers = await prisma.supplier.findMany({
      where: { companyId, status: 'ACTIVE' },
      include: {
        purchases: {
          where: { status: { not: 'CANCELLED' } },
          select: { totalAmount: true, paidAmount: true, dueAmount: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = suppliers.map((s) => {
      const totalPurchased = s.purchases.reduce((acc, p) => acc + p.totalAmount, 0);
      const totalPaid = s.purchases.reduce((acc, p) => acc + (p.paidAmount || 0), 0);
      const outstanding = Math.max(0, totalPurchased - totalPaid);

      return {
        id: s.id,
        name: s.name,
        supplierCode: s.supplierCode,
        phone: s.phone,
        email: s.email,
        purchaseCount: s.purchases.length,
        totalPurchased,
        totalPaid,
        outstanding,
      };
    });

    const topSuppliers = [...formatted].sort((a, b) => b.totalPurchased - a.totalPurchased).slice(0, 10);
    const suppliersWithDue = formatted.filter((s) => s.outstanding > 0).sort((a, b) => b.outstanding - a.outstanding);

    return {
      totalSuppliers: suppliers.length,
      suppliersWithDueCount: suppliersWithDue.length,
      topSuppliers,
      suppliersWithDue,
      allSuppliers: formatted,
    };
  }

  // ─── 7. FINANCIAL & CASH FLOW REPORTS ─────────────────────────────────────
  async getFinanceReports(companyId: string, options: DateFilterOptions = {}) {
    const { currentStart, currentEnd } = resolveDateRange(options);

    let customerPaymentsList: any[] = [];
    let supplierPaymentsList: any[] = [];
    let expensesList: any[] = [];
    let accounts: any[] = [];

    try {
      if (db.customerPayment?.findMany) {
        customerPaymentsList = await db.customerPayment.findMany({
          where: { companyId, paymentDate: { gte: currentStart, lte: currentEnd } },
          include: { customer: { select: { name: true } }, paymentAccount: { select: { name: true } } },
          orderBy: { paymentDate: 'desc' },
        });
      } else {
        customerPaymentsList = await prisma.$queryRawUnsafe(
          `SELECT cp.*, c.name as "customerName", pa.name as "accountName"
           FROM customer_payments cp
           LEFT JOIN customers c ON cp."customerId" = c.id
           LEFT JOIN payment_accounts pa ON cp."paymentAccountId" = pa.id
           WHERE cp."companyId" = $1 AND cp."paymentDate" >= $2 AND cp."paymentDate" <= $3
           ORDER BY cp."paymentDate" DESC`,
          companyId, currentStart, currentEnd
        );
      }
    } catch {
      customerPaymentsList = [];
    }

    try {
      if (db.supplierPayment?.findMany) {
        supplierPaymentsList = await db.supplierPayment.findMany({
          where: { companyId, paymentDate: { gte: currentStart, lte: currentEnd } },
          include: { supplier: { select: { name: true } }, paymentAccount: { select: { name: true } } },
          orderBy: { paymentDate: 'desc' },
        });
      } else {
        supplierPaymentsList = await prisma.$queryRawUnsafe(
          `SELECT sp.*, s.name as "supplierName", pa.name as "accountName"
           FROM supplier_payments sp
           LEFT JOIN suppliers s ON sp."supplierId" = s.id
           LEFT JOIN payment_accounts pa ON sp."paymentAccountId" = pa.id
           WHERE sp."companyId" = $1 AND sp."paymentDate" >= $2 AND sp."paymentDate" <= $3
           ORDER BY sp."paymentDate" DESC`,
          companyId, currentStart, currentEnd
        );
      }
    } catch {
      supplierPaymentsList = [];
    }

    try {
      if (db.expense?.findMany) {
        expensesList = await db.expense.findMany({
          where: { companyId, status: 'PAID', expenseDate: { gte: currentStart, lte: currentEnd } },
          include: { category: { select: { name: true } }, paymentAccount: { select: { name: true } } },
          orderBy: { expenseDate: 'desc' },
        });
      } else {
        expensesList = await prisma.$queryRawUnsafe(
          `SELECT e.*, ec.name as "categoryName", pa.name as "accountName"
           FROM expenses e
           LEFT JOIN expense_categories ec ON e."categoryId" = ec.id
           LEFT JOIN payment_accounts pa ON e."paymentAccountId" = pa.id
           WHERE e."companyId" = $1 AND e.status = 'PAID' AND e."expenseDate" >= $2 AND e."expenseDate" <= $3
           ORDER BY e."expenseDate" DESC`,
          companyId, currentStart, currentEnd
        );
      }
    } catch {
      expensesList = [];
    }

    try {
      if (db.paymentAccount?.findMany) {
        accounts = await db.paymentAccount.findMany({
          where: { companyId, isActive: true },
          orderBy: { name: 'asc' },
        });
      } else {
        accounts = await prisma.$queryRawUnsafe(
          `SELECT * FROM payment_accounts WHERE "companyId" = $1 AND ("isActive" = true OR "isActive" IS NULL) ORDER BY name ASC`,
          companyId
        );
      }
    } catch {
      accounts = [];
    }

    const totalMoneyIn = customerPaymentsList.reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);
    const supplierOut = supplierPaymentsList.reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);
    const expenseOut = expensesList.reduce((acc: number, e: any) => acc + Number(e.amount || 0), 0);
    const totalMoneyOut = supplierOut + expenseOut;
    const netCashFlow = totalMoneyIn - totalMoneyOut;

    return {
      summary: {
        totalMoneyIn,
        supplierOut,
        expenseOut,
        totalMoneyOut,
        netCashFlow,
      },
      accounts,
      customerPaymentsList: customerPaymentsList.map((cp: any) => ({
        id: cp.id,
        date: cp.paymentDate || cp.paymentdate,
        customerName: cp.customer?.name || cp.customerName || 'Customer',
        accountName: cp.paymentAccount?.name || cp.accountName || 'Account',
        amount: Number(cp.amount || 0),
        method: cp.paymentMethod || cp.paymentmethod || 'CASH',
      })),
      supplierPaymentsList: supplierPaymentsList.map((sp: any) => ({
        id: sp.id,
        date: sp.paymentDate || sp.paymentdate,
        supplierName: sp.supplier?.name || sp.supplierName || 'Supplier',
        accountName: sp.paymentAccount?.name || sp.accountName || 'Account',
        amount: Number(sp.amount || 0),
        method: sp.paymentMethod || sp.paymentmethod || 'CASH',
      })),
      expensesList: expensesList.map((e: any) => ({
        id: e.id,
        date: e.expenseDate || e.expensedate,
        title: e.title,
        categoryName: e.category?.name || e.categoryName || 'Uncategorized',
        accountName: e.paymentAccount?.name || e.accountName || 'Account',
        amount: Number(e.amount || 0),
      })),
    };
  }

  // ─── 8. EXPENSE REPORTS ───────────────────────────────────────────────────
  async getExpenseReports(companyId: string, options: DateFilterOptions = {}) {
    const { currentStart, currentEnd } = resolveDateRange(options);

    let expensesList: any[] = [];
    try {
      if (db.expense?.findMany) {
        expensesList = await db.expense.findMany({
          where: { companyId, status: 'PAID', expenseDate: { gte: currentStart, lte: currentEnd } },
          include: { category: { select: { name: true } } },
          orderBy: { expenseDate: 'desc' },
        });
      } else {
        expensesList = await prisma.$queryRawUnsafe(
          `SELECT e.*, ec.name as "categoryName"
           FROM expenses e
           LEFT JOIN expense_categories ec ON e."categoryId" = ec.id
           WHERE e."companyId" = $1 AND e.status = 'PAID' AND e."expenseDate" >= $2 AND e."expenseDate" <= $3
           ORDER BY e."expenseDate" DESC`,
          companyId, currentStart, currentEnd
        );
      }
    } catch {
      expensesList = [];
    }

    const totalExpenses = expensesList.reduce((acc: number, e: any) => acc + Number(e.amount || 0), 0);

    const categoryMap = new Map<string, { categoryName: string; amount: number; count: number }>();
    expensesList.forEach((e: any) => {
      const catName = e.category?.name || e.categoryName || 'Uncategorized';
      const existing = categoryMap.get(catName) || { categoryName: catName, amount: 0, count: 0 };
      categoryMap.set(catName, {
        categoryName: catName,
        amount: existing.amount + Number(e.amount || 0),
        count: existing.count + 1,
      });
    });

    const categoryBreakdown = Array.from(categoryMap.values())
      .map((c) => ({
        ...c,
        percentage: totalExpenses > 0 ? Math.round((c.amount / totalExpenses) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalExpenses,
      categoryBreakdown,
      expenseList: expensesList.map((e: any) => ({
        id: e.id,
        title: e.title,
        categoryName: e.category?.name || e.categoryName || 'Uncategorized',
        amount: Number(e.amount || 0),
        date: e.expenseDate || e.expensedate,
        paymentMethod: e.paymentMethod || e.paymentmethod || 'CASH',
      })),
    };
  }

  // ─── 9. PRODUCTION & WORKER REPORTS ─────────────────────────────────────
  async getProductionReports(companyId: string) {
    let workOrders: any[] = [];
    try {
      if (db.workOrder?.findMany) {
        workOrders = await db.workOrder.findMany({
          where: { companyId },
          include: {
            workerAssignments: { include: { worker: { select: { id: true, name: true, department: true } } } },
          },
          orderBy: { createdAt: 'desc' },
        });
      } else {
        workOrders = await prisma.$queryRawUnsafe(
          `SELECT wo.* FROM work_orders wo WHERE wo."companyId" = $1 ORDER BY wo."createdAt" DESC`,
          companyId
        );
      }
    } catch {
      workOrders = [];
    }

    const totalOrders = workOrders.length;
    const completedOrders = workOrders.filter((w: any) => w.status === 'COMPLETED').length;
    const inProgressOrders = workOrders.filter((w: any) => w.status === 'IN_PROGRESS').length;

    // Worker Activity Summary
    const workerMap = new Map<string, { workerName: string; department: string; assignedTasks: number; completedTasks: number }>();
    workOrders.forEach((wo: any) => {
      const assignments = wo.workerAssignments || [];
      assignments.forEach((wa: any) => {
        if (wa.worker) {
          const existing = workerMap.get(wa.worker.id) || {
            workerName: wa.worker.name,
            department: wa.worker.department || 'General',
            assignedTasks: 0,
            completedTasks: 0,
          };
          workerMap.set(wa.worker.id, {
            workerName: wa.worker.name,
            department: wa.worker.department || 'General',
            assignedTasks: existing.assignedTasks + 1,
            completedTasks: existing.completedTasks + (wo.status === 'COMPLETED' ? 1 : 0),
          });
        }
      });
    });

    const workerStats = Array.from(workerMap.values()).map((w) => ({
      ...w,
      completionRate: w.assignedTasks > 0 ? Math.round((w.completedTasks / w.assignedTasks) * 100) : 0,
    }));

    return {
      summary: {
        totalOrders,
        completedOrders,
        inProgressOrders,
        completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
      },
      workerStats,
      workOrdersList: workOrders.map((w: any) => ({
        id: w.id,
        woNumber: w.woNumber || w.title || w.id,
        productName: 'Furniture Product',
        plannedQty: w.quantity || 1,
        status: w.status,
        startDate: w.createdAt,
      })),
    };
  }
}

export const analyticsService = new AnalyticsService();
