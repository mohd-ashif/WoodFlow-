import { prisma } from '../../../config/prisma.js';
import { ImportModuleType, DuplicateStrategy } from '../types/import.types.js';

export class ImportTransactionService {
  /**
   * Execute DB transaction for importing validated data rows
   */
  public async executeImportTransaction(
    companyId: string,
    userId: string,
    module: ImportModuleType,
    rows: Record<string, any>[],
    duplicateStrategy: DuplicateStrategy,
    userPermissions: string[] = []
  ): Promise<{ successfulCount: number; failedCount: number; errors: any[] }> {
    let successfulCount = 0;
    let failedCount = 0;
    const errors: any[] = [];

    // Run transaction
    await prisma.$transaction(
      async (tx: any) => {
        switch (module) {
          case 'PRODUCTS': {
            for (const row of rows) {
              try {
                // Ensure category exists
                let category = await tx.category.findFirst({
                  where: { companyId, name: { equals: row.category, mode: 'insensitive' } }
                });
                if (!category) {
                  category = await tx.category.create({
                    data: { companyId, name: row.category.trim() }
                  });
                }

                // Ensure unit exists
                let unit = await tx.unit.findFirst({
                  where: { companyId, name: { equals: row.unit, mode: 'insensitive' } }
                });
                if (!unit) {
                  const shortCode = row.unit.trim().slice(0, 5).toUpperCase();
                  unit = await tx.unit.create({
                    data: { companyId, name: row.unit.trim(), shortCode }
                  });
                }

                const existingProduct = await tx.product.findUnique({
                  where: { companyId_sku: { companyId, sku: row.sku.trim() } }
                });

                const costPrice = Number(row.costPrice) || 0;
                const sellingPrice = Number(row.sellingPrice) || 0;
                const openingStock = Number(row.openingStock) || 0;
                const minStock = Number(row.minimumStock) || 0;

                if (existingProduct) {
                  if (duplicateStrategy === 'SKIP') {
                    continue;
                  } else if (duplicateStrategy === 'UPDATE') {
                    await tx.product.update({
                      where: { id: existingProduct.id },
                      data: {
                        name: row.name.trim(),
                        categoryId: category.id,
                        unitId: unit.id,
                        purchasePrice: costPrice,
                        sellingPrice,
                        minimumStock: minStock,
                        description: row.description || null
                      }
                    });
                    successfulCount++;
                    continue;
                  }
                }

                // Create new product
                const product = await tx.product.create({
                  data: {
                    companyId,
                    name: row.name.trim(),
                    sku: row.sku.trim(),
                    productType: 'FINISHED_PRODUCT',
                    categoryId: category.id,
                    unitId: unit.id,
                    purchasePrice: costPrice,
                    sellingPrice,
                    minimumStock: minStock,
                    openingStock,
                    currentStock: openingStock,
                    description: row.description || null
                  }
                });

                // Create Inventory record
                await tx.inventory.create({
                  data: {
                    companyId,
                    productId: product.id,
                    currentQuantity: openingStock,
                    availableQuantity: openingStock,
                    reservedQuantity: 0
                  }
                });

                // Log opening stock movement if stock > 0
                if (openingStock > 0) {
                  await tx.stockMovement.create({
                    data: {
                      companyId,
                      productId: product.id,
                      movementType: 'OPENING_STOCK',
                      quantity: openingStock,
                      previousQuantity: 0,
                      newQuantity: openingStock,
                      referenceType: 'INITIAL_IMPORT',
                      reason: 'Bulk Data Import Opening Stock',
                      createdBy: userId
                    }
                  });
                }

                successfulCount++;
              } catch (err: any) {
                failedCount++;
                errors.push({ row: row._rowNum, error: err.message || 'Failed to import product row' });
              }
            }
            break;
          }

          case 'CATEGORIES': {
            for (const row of rows) {
              try {
                const existing = await tx.category.findFirst({
                  where: { companyId, name: { equals: row.name.trim(), mode: 'insensitive' } }
                });

                if (existing) {
                  if (duplicateStrategy === 'SKIP') continue;
                  if (duplicateStrategy === 'UPDATE') {
                    await tx.category.update({
                      where: { id: existing.id },
                      data: { description: row.description || null }
                    });
                    successfulCount++;
                    continue;
                  }
                }

                await tx.category.create({
                  data: {
                    companyId,
                    name: row.name.trim(),
                    description: row.description || null
                  }
                });
                successfulCount++;
              } catch (err: any) {
                failedCount++;
                errors.push({ row: row._rowNum, error: err.message });
              }
            }
            break;
          }

          case 'UNITS': {
            for (const row of rows) {
              try {
                const existing = await tx.unit.findFirst({
                  where: { companyId, name: { equals: row.name.trim(), mode: 'insensitive' } }
                });

                if (existing) {
                  if (duplicateStrategy === 'SKIP') continue;
                  if (duplicateStrategy === 'UPDATE') {
                    await tx.unit.update({
                      where: { id: existing.id },
                      data: { shortCode: row.shortCode.trim() }
                    });
                    successfulCount++;
                    continue;
                  }
                }

                await tx.unit.create({
                  data: {
                    companyId,
                    name: row.name.trim(),
                    shortCode: row.shortCode.trim()
                  }
                });
                successfulCount++;
              } catch (err: any) {
                failedCount++;
                errors.push({ row: row._rowNum, error: err.message });
              }
            }
            break;
          }

          case 'CUSTOMERS': {
            for (const row of rows) {
              try {
                const existing = await tx.customer.findFirst({
                  where: { companyId, phone: row.phone.trim() }
                });

                if (existing) {
                  if (duplicateStrategy === 'SKIP') continue;
                  if (duplicateStrategy === 'UPDATE') {
                    await tx.customer.update({
                      where: { id: existing.id },
                      data: {
                        name: row.name.trim(),
                        email: row.email ? row.email.trim() : null,
                        gstNumber: row.gstNumber ? row.gstNumber.trim() : null,
                        notes: row.notes || null
                      }
                    });
                    successfulCount++;
                    continue;
                  }
                }

                const custCode = row.customerCode || `CUST-${Math.floor(100000 + Math.random() * 900000)}`;

                const customer = await tx.customer.create({
                  data: {
                    companyId,
                    name: row.name.trim(),
                    phone: row.phone.trim(),
                    email: row.email ? row.email.trim() : null,
                    customerCode: custCode,
                    gstNumber: row.gstNumber ? row.gstNumber.trim() : null,
                    notes: row.notes || null,
                    createdBy: userId
                  }
                });

                if (row.address && row.city && row.state) {
                  await tx.customerAddress.create({
                    data: {
                      companyId,
                      customerId: customer.id,
                      addressLine1: row.address,
                      city: row.city,
                      state: row.state,
                      postalCode: row.postalCode || '000000',
                      isDefault: true
                    }
                  });
                }

                successfulCount++;
              } catch (err: any) {
                failedCount++;
                errors.push({ row: row._rowNum, error: err.message });
              }
            }
            break;
          }

          case 'SUPPLIERS': {
            for (const row of rows) {
              try {
                const existing = await tx.supplier.findFirst({
                  where: { companyId, phone: row.phone.trim() }
                });

                if (existing) {
                  if (duplicateStrategy === 'SKIP') continue;
                  if (duplicateStrategy === 'UPDATE') {
                    await tx.supplier.update({
                      where: { id: existing.id },
                      data: {
                        name: row.name.trim(),
                        email: row.email ? row.email.trim() : null,
                        gstNumber: row.gstNumber ? row.gstNumber.trim() : null,
                        notes: row.notes || null
                      }
                    });
                    successfulCount++;
                    continue;
                  }
                }

                const suppCode = row.supplierCode || `SUPP-${Math.floor(100000 + Math.random() * 900000)}`;

                const supplier = await tx.supplier.create({
                  data: {
                    companyId,
                    name: row.name.trim(),
                    phone: row.phone.trim(),
                    email: row.email ? row.email.trim() : null,
                    supplierCode: suppCode,
                    gstNumber: row.gstNumber ? row.gstNumber.trim() : null,
                    notes: row.notes || null,
                    createdBy: userId
                  }
                });

                if (row.address && row.city && row.state) {
                  await tx.supplierAddress.create({
                    data: {
                      companyId,
                      supplierId: supplier.id,
                      addressLine1: row.address,
                      city: row.city,
                      state: row.state,
                      postalCode: row.postalCode || '000000',
                      isDefault: true
                    }
                  });
                }

                successfulCount++;
              } catch (err: any) {
                failedCount++;
                errors.push({ row: row._rowNum, error: err.message });
              }
            }
            break;
          }

          case 'WORKERS': {
            // Check sensitive salary field permission
            const canManagePayroll = userPermissions.includes('*') || userPermissions.includes('worker.import') || userPermissions.includes('payroll.manage');

            for (const row of rows) {
              try {
                const empCode = row.employeeCode.trim();
                const existing = await tx.worker.findUnique({
                  where: { companyId_employeeCode: { companyId, employeeCode: empCode } }
                });

                if (existing) {
                  if (duplicateStrategy === 'SKIP') continue;
                  if (duplicateStrategy === 'UPDATE') {
                    await tx.worker.update({
                      where: { id: existing.id },
                      data: {
                        firstName: row.firstName.trim(),
                        lastName: row.lastName ? row.lastName.trim() : '',
                        phone: row.phone ? row.phone.trim() : null,
                        email: row.email ? row.email.trim() : null,
                        monthlySalary: canManagePayroll && row.monthlySalary ? Number(row.monthlySalary) : existing.monthlySalary,
                        dailyWage: canManagePayroll && row.dailyWage ? Number(row.dailyWage) : existing.dailyWage
                      }
                    });
                    successfulCount++;
                    continue;
                  }
                }

                await tx.worker.create({
                  data: {
                    companyId,
                    employeeCode: empCode,
                    firstName: row.firstName.trim(),
                    lastName: row.lastName ? row.lastName.trim() : '',
                    phone: row.phone ? row.phone.trim() : null,
                    email: row.email ? row.email.trim() : null,
                    address: row.address || null,
                    joiningDate: row.joiningDate ? new Date(row.joiningDate) : null,
                    monthlySalary: canManagePayroll && row.monthlySalary ? Number(row.monthlySalary) : null,
                    dailyWage: canManagePayroll && row.dailyWage ? Number(row.dailyWage) : null
                  }
                });
                successfulCount++;
              } catch (err: any) {
                failedCount++;
                errors.push({ row: row._rowNum, error: err.message });
              }
            }
            break;
          }

          case 'INVENTORY': {
            for (const row of rows) {
              try {
                let product = await tx.product.findUnique({
                  where: { companyId_sku: { companyId, sku: row.sku.trim() } }
                });

                const openingQty = Number(row.openingStock) || 0;
                const costPrice = Number(row.costPrice) || 0;
                const sellingPrice = Number(row.sellingPrice) || 0;

                if (!product) {
                  // Create category if missing
                  const catName = row.category ? row.category.trim() : 'General';
                  let category = await tx.category.findFirst({
                    where: { companyId, name: { equals: catName, mode: 'insensitive' } }
                  });
                  if (!category) {
                    category = await tx.category.create({ data: { companyId, name: catName } });
                  }

                  let unit = await tx.unit.findFirst({ where: { companyId } });
                  if (!unit) {
                    unit = await tx.unit.create({ data: { companyId, name: 'Piece', shortCode: 'Pcs' } });
                  }

                  product = await tx.product.create({
                    data: {
                      companyId,
                      name: row.name.trim(),
                      sku: row.sku.trim(),
                      productType: 'FINISHED_PRODUCT',
                      categoryId: category.id,
                      unitId: unit.id,
                      purchasePrice: costPrice,
                      sellingPrice,
                      openingStock: openingQty,
                      currentStock: openingQty
                    }
                  });

                  await tx.inventory.create({
                    data: {
                      companyId,
                      productId: product.id,
                      currentQuantity: openingQty,
                      availableQuantity: openingQty
                    }
                  });
                } else {
                  // Update product stock and inventory
                  const inv = await tx.inventory.findUnique({ where: { productId: product.id } });
                  const prevQty = inv ? inv.currentQuantity : 0;
                  const newQty = prevQty + openingQty;

                  await tx.product.update({
                    where: { id: product.id },
                    data: { currentStock: newQty }
                  });

                  await tx.inventory.upsert({
                    where: { productId: product.id },
                    update: { currentQuantity: newQty, availableQuantity: newQty },
                    create: { companyId, productId: product.id, currentQuantity: newQty, availableQuantity: newQty }
                  });
                }

                // Log Stock Movement
                await tx.stockMovement.create({
                  data: {
                    companyId,
                    productId: product.id,
                    movementType: 'OPENING_STOCK',
                    quantity: openingQty,
                    previousQuantity: 0,
                    newQuantity: openingQty,
                    referenceType: 'INVENTORY_IMPORT',
                    reason: 'Bulk Inventory Import',
                    createdBy: userId
                  }
                });

                successfulCount++;
              } catch (err: any) {
                failedCount++;
                errors.push({ row: row._rowNum, error: err.message });
              }
            }
            break;
          }

          case 'PURCHASES': {
            for (const row of rows) {
              try {
                // Find or create supplier
                let supplier = null;
                if (row.supplierName) {
                  supplier = await tx.supplier.findFirst({
                    where: { companyId, name: { equals: row.supplierName.trim(), mode: 'insensitive' } }
                  });
                  if (!supplier) {
                    supplier = await tx.supplier.create({
                      data: {
                        companyId,
                        name: row.supplierName.trim(),
                        phone: '0000000000',
                        supplierCode: `SUPP-${Math.floor(100000 + Math.random() * 900000)}`
                      }
                    });
                  }
                }

                // Find product by SKU
                let product = await tx.product.findUnique({
                  where: { companyId_sku: { companyId, sku: row.sku.trim() } }
                });

                if (!product) {
                  let category = await tx.category.findFirst({ where: { companyId } });
                  if (!category) category = await tx.category.create({ data: { companyId, name: 'General' } });
                  let unit = await tx.unit.findFirst({ where: { companyId } });
                  if (!unit) unit = await tx.unit.create({ data: { companyId, name: 'Piece', shortCode: 'Pcs' } });

                  product = await tx.product.create({
                    data: {
                      companyId,
                      name: row.productName ? row.productName.trim() : row.sku.trim(),
                      sku: row.sku.trim(),
                      productType: 'FINISHED_PRODUCT',
                      categoryId: category.id,
                      unitId: unit.id,
                      purchasePrice: Number(row.unitPrice) || 0,
                      sellingPrice: Number(row.unitPrice) * 1.5 || 0
                    }
                  });
                  await tx.inventory.create({
                    data: { companyId, productId: product.id, currentQuantity: 0, availableQuantity: 0 }
                  });
                }

                const qty = Number(row.quantity) || 1;
                const unitCost = Number(row.unitPrice) || 0;
                const discount = Number(row.discountAmount) || 0;
                const taxRate = Number(row.taxRate) || 0;
                const subtotal = qty * unitCost;
                const taxAmount = (subtotal - discount) * (taxRate / 100);
                const totalAmount = subtotal - discount + taxAmount;
                const isPaid = (row.paymentStatus || '').toUpperCase() === 'PAID';
                const paidAmount = isPaid ? totalAmount : 0;
                const dueAmount = totalAmount - paidAmount;

                const poNumber = row.purchaseNumber.trim();
                const existingPO = await tx.purchase.findUnique({
                  where: { companyId_purchaseNumber: { companyId, purchaseNumber: poNumber } }
                });

                if (existingPO && duplicateStrategy === 'SKIP') {
                  continue;
                }

                const purchase = await tx.purchase.create({
                  data: {
                    companyId,
                    purchaseNumber: poNumber,
                    supplierId: supplier ? supplier.id : null,
                    status: 'RECEIVED',
                    subtotal,
                    discountAmount: discount,
                    taxAmount,
                    totalAmount,
                    paidAmount,
                    dueAmount,
                    paymentStatus: isPaid ? 'PAID' : 'UNPAID',
                    purchaseDate: row.purchaseDate ? new Date(row.purchaseDate) : new Date(),
                    createdBy: userId,
                    items: {
                      create: [
                        {
                          companyId,
                          productId: product.id,
                          productNameSnapshot: product.name,
                          skuSnapshot: product.sku,
                          quantity: qty,
                          unitCost,
                          discountAmount: discount,
                          taxRate,
                          taxAmount,
                          totalAmount
                        }
                      ]
                    }
                  }
                });

                // Update stock and inventory
                const inv = await tx.inventory.findUnique({ where: { productId: product.id } });
                const prevStock = inv ? inv.currentQuantity : 0;
                const newStock = prevStock + qty;

                await tx.product.update({
                  where: { id: product.id },
                  data: { currentStock: newStock }
                });

                await tx.inventory.upsert({
                  where: { productId: product.id },
                  update: { currentQuantity: newStock, availableQuantity: newStock },
                  create: { companyId, productId: product.id, currentQuantity: newStock, availableQuantity: newStock }
                });

                // Log Stock Movement
                await tx.stockMovement.create({
                  data: {
                    companyId,
                    productId: product.id,
                    movementType: 'PURCHASE',
                    quantity: qty,
                    previousQuantity: prevStock,
                    newQuantity: newStock,
                    referenceType: 'PURCHASE',
                    referenceId: purchase.id,
                    reason: `Bulk Purchase Import PO #${poNumber}`,
                    createdBy: userId
                  }
                });

                successfulCount++;
              } catch (err: any) {
                failedCount++;
                errors.push({ row: row._rowNum, error: err.message });
              }
            }
            break;
          }

          case 'SALES': {
            const company = await tx.company.findUnique({ where: { id: companyId } });
            const allowNegative = company?.allowNegativeStock ?? false;

            for (const row of rows) {
              try {
                // Find or create customer
                let customer = null;
                if (row.customerName) {
                  customer = await tx.customer.findFirst({
                    where: { companyId, name: { equals: row.customerName.trim(), mode: 'insensitive' } }
                  });
                  if (!customer) {
                    customer = await tx.customer.create({
                      data: {
                        companyId,
                        name: row.customerName.trim(),
                        phone: '0000000000',
                        customerCode: `CUST-${Math.floor(100000 + Math.random() * 900000)}`
                      }
                    });
                  }
                }

                // Find product by SKU
                const product = await tx.product.findUnique({
                  where: { companyId_sku: { companyId, sku: row.sku.trim() } }
                });

                if (!product) {
                  throw new Error(`Product with SKU "${row.sku}" not found in inventory.`);
                }

                const qty = Number(row.quantity) || 1;
                const inv = await tx.inventory.findUnique({ where: { productId: product.id } });
                const currentAvailable = inv ? inv.availableQuantity : 0;

                if (!allowNegative && currentAvailable < qty) {
                  throw new Error(`Insufficient stock for product "${product.name}" (SKU: ${product.sku}). Available: ${currentAvailable}, Requested: ${qty}`);
                }

                const unitPrice = Number(row.unitPrice) || product.sellingPrice;
                const discount = Number(row.discountAmount) || 0;
                const taxRate = Number(row.taxRate) || 0;
                const subtotal = qty * unitPrice;
                const taxAmount = (subtotal - discount) * (taxRate / 100);
                const totalAmount = subtotal - discount + taxAmount;
                const isPaid = (row.paymentStatus || '').toUpperCase() === 'PAID';
                const paidAmount = isPaid ? totalAmount : 0;
                const dueAmount = totalAmount - paidAmount;

                const invNumber = row.invoiceNumber.trim();
                const existingSale = await tx.sale.findUnique({
                  where: { companyId_saleNumber: { companyId, saleNumber: invNumber } }
                });

                if (existingSale && duplicateStrategy === 'SKIP') {
                  continue;
                }

                const sale = await tx.sale.create({
                  data: {
                    companyId,
                    saleNumber: invNumber,
                    customerId: customer ? customer.id : null,
                    status: 'CONFIRMED',
                    subtotal,
                    discountAmount: discount,
                    taxAmount,
                    totalAmount,
                    paidAmount,
                    dueAmount,
                    paymentStatus: isPaid ? 'PAID' : 'UNPAID',
                    saleDate: row.invoiceDate ? new Date(row.invoiceDate) : new Date(),
                    createdBy: userId,
                    items: {
                      create: [
                        {
                          companyId,
                          productId: product.id,
                          productNameSnapshot: product.name,
                          skuSnapshot: product.sku,
                          quantity: qty,
                          unitPrice,
                          discountAmount: discount,
                          taxRate,
                          taxAmount,
                          totalAmount
                        }
                      ]
                    }
                  }
                });

                // Update stock and inventory
                const prevStock = inv ? inv.currentQuantity : 0;
                const newStock = Math.max(0, prevStock - qty);

                await tx.product.update({
                  where: { id: product.id },
                  data: { currentStock: newStock }
                });

                await tx.inventory.update({
                  where: { productId: product.id },
                  data: { currentQuantity: newStock, availableQuantity: newStock }
                });

                // Log Stock Movement
                await tx.stockMovement.create({
                  data: {
                    companyId,
                    productId: product.id,
                    movementType: 'SALE',
                    quantity: -qty,
                    previousQuantity: prevStock,
                    newQuantity: newStock,
                    referenceType: 'SALE',
                    referenceId: sale.id,
                    reason: `Bulk Sale Import Inv #${invNumber}`,
                    createdBy: userId
                  }
                });

                successfulCount++;
              } catch (err: any) {
                failedCount++;
                errors.push({ row: row._rowNum, error: err.message });
              }
            }
            break;
          }
        }
      },
      { timeout: 60000 }
    );

    return { successfulCount, failedCount, errors };
  }
}

export const importTransactionService = new ImportTransactionService();
