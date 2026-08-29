import { prisma } from '../../config/prisma.js';
import { StockAdjustmentInput } from '@furniture-os/shared';
import { ConflictError, NotFoundError, BadRequestError } from '../../utils/errors.js';
import { createAuditLog } from '../audit/audit.service.js';

export async function getInventoryDashboard(companyId: string) {
  // Fetch counts
  const totalProducts = await prisma.product.count({
    where: { companyId, isActive: true },
  });

  const totalFinishedProducts = await prisma.product.count({
    where: { companyId, productType: 'FINISHED_PRODUCT', isActive: true },
  });

  const totalRawMaterials = await prisma.product.count({
    where: { companyId, productType: 'RAW_MATERIAL', isActive: true },
  });

  // Low stock query (currentStock <= minimumStock)
  const lowStockProducts = await prisma.product.count({
    where: {
      companyId,
      isActive: true,
      currentStock: { lte: prisma.product.fields.minimumStock },
    },
  });

  // Out of stock query (currentStock <= 0)
  const outOfStockProducts = await prisma.product.count({
    where: {
      companyId,
      isActive: true,
      currentStock: { lte: 0 },
    },
  });

  // Estimated inventory value (sum of currentStock * purchasePrice)
  const activeProducts = await prisma.product.findMany({
    where: { companyId, isActive: true },
    select: { currentStock: true, purchasePrice: true },
  });

  const estimatedInventoryValue = activeProducts.reduce((sum: number, p: any) => {
    return sum + p.currentStock * p.purchasePrice;
  }, 0);

  return {
    totalProducts,
    totalFinishedProducts,
    totalRawMaterials,
    lowStockProducts,
    outOfStockProducts,
    estimatedInventoryValue,
  };
}

export async function getLowStock(companyId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const where = {
    companyId,
    isActive: true,
    currentStock: { lte: prisma.product.fields.minimumStock },
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, unit: true },
      orderBy: { currentStock: 'asc' },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getOutOfStock(companyId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const where = {
    companyId,
    isActive: true,
    currentStock: { lte: 0 },
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, unit: true },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export interface MovementFilters {
  search?: string;
  movementType?: string;
  createdBy?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export async function getStockMovements(companyId: string, filters: MovementFilters) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { companyId };

  if (filters.movementType) {
    where.movementType = filters.movementType;
  }

  if (filters.createdBy) {
    where.createdBy = filters.createdBy;
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.createdAt.lte = new Date(filters.endDate);
    }
  }

  if (filters.search) {
    where.product = {
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
      ],
    };
  }

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: {
        product: { select: { name: true, sku: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return {
    movements,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getProductInventory(companyId: string, productId: string) {
  const inventory = await prisma.inventory.findFirst({
    where: { productId, companyId },
    include: { product: true },
  });

  if (!inventory) {
    throw new NotFoundError('Inventory record not found for this product');
  }

  return inventory;
}

export async function adjustStock(companyId: string, input: StockAdjustmentInput, userId: string) {
  // Execute transactional operation with safe concurrency locks (Requirement 23 & 24)
  const result = await prisma.$transaction(async (tx) => {
    // 1. Query company settings (specifically negative stock allowances)
    const company = await tx.company.findUnique({
      where: { id: companyId },
      select: { allowNegativeStock: true },
    });

    if (!company) {
      throw new NotFoundError('Company not found');
    }

    // 2. Lock the inventory row inside PostgreSQL for this transaction
    const rawInventories = await tx.$queryRawUnsafe<any[]>(
      `SELECT * FROM "inventories" WHERE "productId" = $1 AND "companyId" = $2 FOR UPDATE`,
      input.productId,
      companyId
    );

    const inventory = rawInventories[0];
    if (!inventory) {
      throw new NotFoundError('Inventory record not found');
    }

    const currentQty = inventory.currentQuantity as number;
    const adjustmentQty = input.quantity;
    let newQty = currentQty;

    // 3. Calculate quantity changes
    if (input.type === 'IN') {
      newQty = currentQty + adjustmentQty;
    } else if (input.type === 'OUT') {
      newQty = currentQty - adjustmentQty;
    }

    // 4. Validate negative stock boundaries (Requirement 22)
    if (newQty < 0 && !company.allowNegativeStock) {
      throw new BadRequestError(`Insufficient stock. Available quantity: ${currentQty}`, 'INSUFFICIENT_STOCK');
    }

    // 5. Update Inventory database values
    const updatedInventory = await tx.inventory.update({
      where: { id: inventory.id as string },
      data: {
        currentQuantity: newQty,
        availableQuantity: newQty - (inventory.reservedQuantity as number),
      },
    });

    // 6. Update Product currentStock cache to stay in sync
    const updatedProduct = await tx.product.update({
      where: { id: input.productId },
      data: { currentStock: newQty },
      select: { name: true, sku: true },
    });

    // 7. Insert the stock movement record
    const movementType = input.type === 'IN' ? 'STOCK_ADJUSTMENT_IN' : 'STOCK_ADJUSTMENT_OUT';
    const movement = await tx.stockMovement.create({
      data: {
        companyId,
        productId: input.productId,
        movementType,
        quantity: adjustmentQty,
        previousQuantity: currentQty,
        newQuantity: newQty,
        reason: input.reason,
        notes: input.notes,
        createdBy: userId,
      },
    });

    return { updatedInventory, product: updatedProduct, movement };
  });

  // 8. Log the audit activity (Requirement 52)
  await createAuditLog({
    userId,
    companyId,
    action: 'STOCK_ADJUSTED',
    entity: 'Product',
    entityId: input.productId,
    metadata: {
      product: result.product.name,
      sku: result.product.sku,
      oldQuantity: result.movement.previousQuantity,
      newQuantity: result.movement.newQuantity,
      adjustment: input.type === 'IN' ? `+${input.quantity}` : `-${input.quantity}`,
      reason: input.reason,
    },
  });

  return result;
}

export async function reconcileInventory(companyId: string) {
  const products = await prisma.product.findMany({
    where: { companyId, isActive: true },
    include: {
      inventory: true,
      category: { select: { name: true } },
      unit: { select: { name: true, shortCode: true } },
    },
    orderBy: { name: 'asc' },
  });

  const movements = await prisma.stockMovement.findMany({
    where: { companyId },
    select: {
      productId: true,
      movementType: true,
      quantity: true,
    },
  });

  // Group movements by productId
  const movementsByProduct: Record<string, typeof movements> = {};
  movements.forEach((m) => {
    if (!movementsByProduct[m.productId]) {
      movementsByProduct[m.productId] = [];
    }
    movementsByProduct[m.productId].push(m);
  });

  const results = products.map((product: any) => {
    const productMovements = movementsByProduct[product.id] || [];
    let calculatedStock = 0;

    productMovements.forEach((m) => {
      const type = String(m.movementType);
      if (
        type === 'OPENING_STOCK' ||
        type === 'PURCHASE' ||
        type === 'SALE_RETURN' ||
        type === 'STOCK_ADJUSTMENT_IN' ||
        type === 'PRODUCTION_OUTPUT' ||
        type === 'PRODUCTION_RETURN'
      ) {
        calculatedStock += m.quantity;
      } else if (
        type === 'SALE' ||
        type === 'PURCHASE_RETURN' ||
        type === 'STOCK_ADJUSTMENT_OUT' ||
        type === 'PRODUCTION_ISSUE'
      ) {
        calculatedStock -= m.quantity;
      }
    });

    const storedStock = product.currentStock;
    const isMatch = Math.abs(storedStock - calculatedStock) < 0.0001;

    return {
      productId: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category?.name || 'Uncategorized',
      unit: product.unit?.shortCode || 'pcs',
      storedStock,
      calculatedStock,
      status: isMatch ? 'MATCH' : 'MISMATCH',
      discrepancy: storedStock - calculatedStock,
      totalMovementsCount: productMovements.length,
    };
  });

  const totalProductsCount = results.length;
  const matchCount = results.filter((r) => r.status === 'MATCH').length;
  const mismatchCount = results.filter((r) => r.status === 'MISMATCH').length;

  return {
    summary: {
      totalProductsCount,
      matchCount,
      mismatchCount,
      isHealthy: mismatchCount === 0,
    },
    details: results,
  };
}

