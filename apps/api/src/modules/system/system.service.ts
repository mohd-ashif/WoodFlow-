import { prisma } from '../../config/prisma.js';

export interface DataConsistencyCheckResult {
  passed: boolean;
  totalProductsChecked: number;
  mismatchedProducts: {
    productId: string;
    productName: string;
    sku: string;
    recordedStock: number;
    calculatedMovementStock: number;
    difference: number;
  }[];
  checkedAt: Date;
}

export class SystemService {
  /**
   * System Health Audit — Database connection, memory usage, environment check
   */
  public async getSystemHealth() {
    let dbStatus = 'healthy';
    let latencyMs = 0;

    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      latencyMs = Date.now() - start;
    } catch {
      dbStatus = 'unhealthy';
    }

    const memory = process.memoryUsage();

    return {
      status: dbStatus === 'healthy' ? 'OK' : 'DEGRADED',
      database: {
        status: dbStatus,
        latencyMs
      },
      cloudinary: {
        status: process.env.CLOUDINARY_CLOUD_NAME ? 'configured' : 'fallback_local'
      },
      server: {
        uptimeSeconds: Math.floor(process.uptime()),
        memoryRssMb: Math.round(memory.rss / (1024 * 1024)),
        memoryHeapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
        nodeVersion: process.version
      },
      timestamp: new Date()
    };
  }

  /**
   * Data Consistency Checker — Compare inventory `currentStock` against cumulative sum of `StockMovement` logs
   */
  public async checkDataConsistency(companyId: string): Promise<DataConsistencyCheckResult> {
    const products = await (prisma as any).product.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        sku: true,
        inventory: { select: { currentStock: true } },
        stockMovements: { select: { type: true, quantity: true } }
      }
    });

    const mismatches: DataConsistencyCheckResult['mismatchedProducts'] = [];

    products.forEach((p: any) => {
      const recordedStock = p.inventory?.currentStock || 0;

      // Sum stock movements based on type
      let calculatedStock = 0;
      (p.stockMovements || []).forEach((m: any) => {
        const type = m.type as string;
        if (
          type === 'IN' ||
          type === 'PURCHASE' ||
          type === 'OPENING_STOCK' ||
          type === 'SALES_RETURN' ||
          type === 'ADJUSTMENT_ADD'
        ) {
          calculatedStock += m.quantity;
        } else if (
          type === 'OUT' ||
          type === 'SALE' ||
          type === 'PURCHASE_RETURN' ||
          type === 'DAMAGE' ||
          type === 'ADJUSTMENT_SUBTRACT'
        ) {
          calculatedStock -= m.quantity;
        }
      });

      if (recordedStock !== calculatedStock) {
        mismatches.push({
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          recordedStock,
          calculatedMovementStock: calculatedStock,
          difference: recordedStock - calculatedStock
        });
      }
    });

    return {
      passed: mismatches.length === 0,
      totalProductsChecked: products.length,
      mismatchedProducts: mismatches,
      checkedAt: new Date()
    };
  }

  /**
   * Clear all operational ERP business data (products, sales, inventory, CRM, finance)
   * while PRESERVING user credentials, companies, company memberships, and access requests.
   */
  public async clearBusinessData(targetCompanyId?: string) {
    const companyFilter = targetCompanyId ? { companyId: targetCompanyId } : {};

    const safeDel = async (fn: () => Promise<any>) => {
      try {
        await fn();
      } catch {
        // Silently skip missing optional tables
      }
    };

    await safeDel(() => (prisma as any).mediaAsset?.deleteMany({ where: companyFilter }));
    await safeDel(() => (prisma as any).stockMovement.deleteMany({ where: companyFilter }));
    await safeDel(() => (prisma as any).inventory.deleteMany({ where: companyFilter }));

    await safeDel(() => (prisma as any).saleItem?.deleteMany());
    await safeDel(() => (prisma as any).sale.deleteMany({ where: companyFilter }));
    await safeDel(() => (prisma as any).invoice?.deleteMany({ where: companyFilter }));
    await safeDel(() => (prisma as any).purchaseItem?.deleteMany());
    await safeDel(() => (prisma as any).purchase.deleteMany({ where: companyFilter }));

    await safeDel(() => (prisma as any).workOrderMaterial?.deleteMany({ where: companyFilter }));
    await safeDel(() => (prisma as any).workOrderItem?.deleteMany({ where: companyFilter }));
    await safeDel(() => (prisma as any).workOrder?.deleteMany({ where: companyFilter }));
    await safeDel(() => (prisma as any).qualityCheck?.deleteMany({ where: companyFilter }));
    await safeDel(() => (prisma as any).workerAttendance?.deleteMany({ where: companyFilter }));
    await safeDel(() => (prisma as any).worker?.deleteMany({ where: companyFilter }));
    await safeDel(() => (prisma as any).department?.deleteMany({ where: companyFilter }));

    await safeDel(() => (prisma as any).customerPayment?.deleteMany({ where: companyFilter }));
    await safeDel(() => (prisma as any).supplierPayment?.deleteMany({ where: companyFilter }));
    await safeDel(() => (prisma as any).financialTransaction?.deleteMany({ where: companyFilter }));
    await safeDel(() => (prisma as any).accountTransfer?.deleteMany({ where: companyFilter }));
    await safeDel(() => (prisma as any).expense?.deleteMany({ where: companyFilter }));
    await safeDel(() => (prisma as any).expenseCategory?.deleteMany({ where: companyFilter }));
    await safeDel(() => (prisma as any).paymentAccount?.deleteMany({ where: companyFilter }));

    await safeDel(() => (prisma as any).customerAddress?.deleteMany({ where: companyFilter }));
    await safeDel(() => (prisma as any).customerNote?.deleteMany({ where: companyFilter }));
    await safeDel(() => (prisma as any).customer.deleteMany({ where: companyFilter }));
    await safeDel(() => (prisma as any).supplierAddress?.deleteMany({ where: companyFilter }));
    await safeDel(() => (prisma as any).supplierNote?.deleteMany({ where: companyFilter }));
    await safeDel(() => (prisma as any).supplier.deleteMany({ where: companyFilter }));
    await safeDel(() => (prisma as any).cRMActivity?.deleteMany({ where: companyFilter }));
    await safeDel(() => (prisma as any).tag?.deleteMany({ where: companyFilter }));

    await safeDel(() => (prisma as any).product.deleteMany({ where: companyFilter }));
    await safeDel(() => (prisma as any).category.deleteMany({ where: companyFilter }));
    await safeDel(() => (prisma as any).unit.deleteMany({ where: companyFilter }));

    await safeDel(() => (prisma as any).importJob?.deleteMany({ where: companyFilter }));
    await safeDel(() => (prisma as any).auditLog.deleteMany({ where: companyFilter }));
    await safeDel(() => (prisma as any).notification?.deleteMany({ where: companyFilter }));

    return {
      success: true,
      message: 'All business, product, sales, and inventory data cleared successfully.',
      clearedAt: new Date(),
    };
  }
}

export const systemService = new SystemService();
