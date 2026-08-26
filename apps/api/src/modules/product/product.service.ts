import { prisma } from '../../config/prisma.js';
import { CreateProductInput, UpdateProductInput } from '@furniture-os/shared';
import { ConflictError, NotFoundError, BadRequestError } from '../../utils/errors.js';
import { createAuditLog } from '../audit/audit.service.js';
import { ProductType } from '@prisma/client';

export interface ProductFilters {
  search?: string;
  filterType?: 'ALL' | 'FINISHED_PRODUCT' | 'RAW_MATERIAL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'INACTIVE';
  categoryId?: string;
  sortBy?: 'name' | 'sku' | 'currentStock' | 'sellingPrice' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export async function getProducts(companyId: string, filters: ProductFilters) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { companyId };

  // By default, filter out inactive unless explicitly requested
  if (filters.filterType === 'INACTIVE') {
    where.isActive = false;
  } else {
    where.isActive = true;
  }

  // Handle specific filters
  if (filters.filterType === 'FINISHED_PRODUCT') {
    where.productType = 'FINISHED_PRODUCT';
  } else if (filters.filterType === 'RAW_MATERIAL') {
    where.productType = 'RAW_MATERIAL';
  } else if (filters.filterType === 'LOW_STOCK') {
    where.currentStock = { lte: prisma.product.fields.minimumStock };
  } else if (filters.filterType === 'OUT_OF_STOCK') {
    where.currentStock = { lte: 0 };
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  // Search by name, SKU, or Category Name
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { sku: { contains: filters.search, mode: 'insensitive' } },
      { category: { name: { contains: filters.search, mode: 'insensitive' } } },
    ];
  }

  // Sorting
  const sortBy = filters.sortBy || 'createdAt';
  const sortOrder = filters.sortOrder || 'desc';
  const orderBy: any = {};
  orderBy[sortBy] = sortOrder;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        unit: true,
        inventory: true,
      },
      orderBy,
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

export async function createProduct(companyId: string, input: CreateProductInput, userId: string) {
  // Check unique SKU within company
  const existing = await prisma.product.findUnique({
    where: {
      companyId_sku: {
        companyId,
        sku: input.sku.toUpperCase(),
      },
    },
  });

  if (existing) {
    throw new ConflictError('SKU already exists in this company', 'DUPLICATE_SKU');
  }

  // Check category exists and is active
  const category = await prisma.category.findFirst({
    where: { id: input.categoryId, companyId, isActive: true },
  });
  if (!category) {
    throw new BadRequestError('Invalid or inactive category selected');
  }

  // Check unit exists and is active
  const unit = await prisma.unit.findFirst({
    where: { id: input.unitId, companyId, isActive: true },
  });
  if (!unit) {
    throw new BadRequestError('Invalid or inactive unit selected');
  }

  const openingStock = input.openingStock || 0;

  // Transaction for atomic product creation (Requirement 56)
  const product = await prisma.$transaction(async (tx) => {
    // 1. Create Product
    const newProduct = await tx.product.create({
      data: {
        companyId,
        name: input.name,
        sku: input.sku.toUpperCase(),
        description: input.description,
        productType: input.productType as ProductType,
        categoryId: input.categoryId,
        unitId: input.unitId,
        purchasePrice: input.purchasePrice,
        sellingPrice: input.sellingPrice,
        minimumStock: input.minimumStock,
        openingStock: openingStock,
        currentStock: openingStock, // Opening stock sets the initial current stock
        imageUrl: input.imageUrl,
        isActive: true,
      },
    });

    // 2. Create Inventory Record
    await tx.inventory.create({
      data: {
        companyId,
        productId: newProduct.id,
        currentQuantity: openingStock,
        availableQuantity: openingStock,
        reservedQuantity: 0,
      },
    });

    // 3. Create Opening Stock Movement if openingStock > 0
    if (openingStock > 0) {
      await tx.stockMovement.create({
        data: {
          companyId,
          productId: newProduct.id,
          movementType: 'OPENING_STOCK',
          quantity: openingStock,
          previousQuantity: 0,
          newQuantity: openingStock,
          reason: 'Initial opening stock',
          notes: 'Created during product onboarding',
          createdBy: userId,
        },
      });
    }

    return newProduct;
  });

  // 4. Create Audit Log
  await createAuditLog({
    userId,
    companyId,
    action: openingStock > 0 ? 'OPENING_STOCK_CREATED' : 'PRODUCT_CREATED',
    entity: 'Product',
    entityId: product.id,
    metadata: { name: product.name, sku: product.sku, openingStock },
  });

  return product;
}

export async function getProductById(companyId: string, id: string) {
  const product = await prisma.product.findFirst({
    where: { id, companyId },
    include: {
      category: true,
      unit: true,
      inventory: true,
    },
  });

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // Get recent stock movements
  const movements = await prisma.stockMovement.findMany({
    where: { productId: id, companyId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { name: true },
      },
    },
    take: 10, // Get last 10 movements
  });

  return { product, movements };
}

export async function updateProduct(
  companyId: string,
  id: string,
  input: UpdateProductInput,
  userId: string
) {
  const product = await prisma.product.findFirst({
    where: { id, companyId },
  });

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // Verify category if changed
  if (input.categoryId && input.categoryId !== product.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: input.categoryId, companyId, isActive: true },
    });
    if (!category) {
      throw new BadRequestError('Invalid or inactive category selected');
    }
  }

  // Verify unit if changed
  if (input.unitId && input.unitId !== product.unitId) {
    const unit = await prisma.unit.findFirst({
      where: { id: input.unitId, companyId, isActive: true },
    });
    if (!unit) {
      throw new BadRequestError('Invalid or inactive unit selected');
    }
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      categoryId: input.categoryId,
      unitId: input.unitId,
      purchasePrice: input.purchasePrice,
      sellingPrice: input.sellingPrice,
      minimumStock: input.minimumStock,
      imageUrl: input.imageUrl,
      isActive: input.isActive,
    },
  });

  await createAuditLog({
    userId,
    companyId,
    action: 'PRODUCT_UPDATED',
    entity: 'Product',
    entityId: updated.id,
    metadata: {
      old: { name: product.name, purchasePrice: product.purchasePrice, sellingPrice: product.sellingPrice },
      new: { name: updated.name, purchasePrice: updated.purchasePrice, sellingPrice: updated.sellingPrice },
    },
  });

  return updated;
}

export async function deactivateProduct(companyId: string, id: string, userId: string) {
  const product = await prisma.product.findFirst({
    where: { id, companyId },
  });

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  const updated = await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });

  await createAuditLog({
    userId,
    companyId,
    action: 'PRODUCT_DEACTIVATED',
    entity: 'Product',
    entityId: updated.id,
    metadata: { name: updated.name, sku: updated.sku },
  });

  return updated;
}

export async function activateProduct(companyId: string, id: string, userId: string) {
  const product = await prisma.product.findFirst({
    where: { id, companyId },
  });

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  const updated = await prisma.product.update({
    where: { id },
    data: { isActive: true },
  });

  await createAuditLog({
    userId,
    companyId,
    action: 'PRODUCT_ACTIVATED',
    entity: 'Product',
    entityId: updated.id,
    metadata: { name: updated.name, sku: updated.sku },
  });

  return updated;
}
export async function getProductCount(companyId: string) {
  return prisma.product.count({
    where: { companyId, isActive: true },
  });
}
