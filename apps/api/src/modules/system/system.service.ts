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
}

export const systemService = new SystemService();
