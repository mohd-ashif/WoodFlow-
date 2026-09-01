import { PrismaClient, SystemRole, CompanyRole, UserStatus, CompanyStatus, MemberStatus, ProductType, StockMovementType, SaleStatus, PurchaseStatus, PaymentStatus, InvoiceStatus, CustomerAddressType, SupplierAddressType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function run30DaySimulation() {
  console.log('🚀 Starting 30-Day Real Furniture Shop Operations Simulation for Modern Furniture House...');

  const passwordHash = await bcrypt.hash('ShopPass123!', 10);

  // 1. Create Demo Company
  const company = await prisma.company.upsert({
    where: { slug: 'modern-furniture-house' },
    update: {},
    create: {
      name: 'Modern Furniture House',
      slug: 'modern-furniture-house',
      email: 'info@modernfurniture.in',
      phone: '+919847001122',
      address: 'MG Road, Edappally',
      city: 'Kochi',
      state: 'Kerala',
      country: 'India',
      postalCode: '682024',
      gstNumber: '32AAACM1234H1Z5',
      status: CompanyStatus.ACTIVE,
      allowNegativeStock: false,
    },
  });

  console.log('✅ Company Created:', company.name);

  // 2. Create Users
  const ownerUser = await prisma.user.upsert({
    where: { email: 'owner@modernfurniture.local' },
    update: {},
    create: {
      name: 'Ashif Owner',
      email: 'owner@modernfurniture.local',
      passwordHash,
      phone: '+919847001100',
      systemRole: SystemRole.COMPANY,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.companyMember.upsert({
    where: { userId_companyId: { userId: ownerUser.id, companyId: company.id } },
    update: {},
    create: { userId: ownerUser.id, companyId: company.id, role: CompanyRole.OWNER, status: MemberStatus.ACTIVE },
  });

  const salesUser = await prisma.user.upsert({
    where: { email: 'sales@modernfurniture.local' },
    update: {},
    create: {
      name: 'Rahul Sales',
      email: 'sales@modernfurniture.local',
      passwordHash,
      phone: '+919847001101',
      systemRole: SystemRole.COMPANY,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.companyMember.upsert({
    where: { userId_companyId: { userId: salesUser.id, companyId: company.id } },
    update: {},
    create: { userId: salesUser.id, companyId: company.id, role: CompanyRole.STAFF, status: MemberStatus.ACTIVE },
  });

  const inventoryUser = await prisma.user.upsert({
    where: { email: 'inventory@modernfurniture.local' },
    update: {},
    create: {
      name: 'Anil Inventory',
      email: 'inventory@modernfurniture.local',
      passwordHash,
      phone: '+919847001102',
      systemRole: SystemRole.COMPANY,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.companyMember.upsert({
    where: { userId_companyId: { userId: inventoryUser.id, companyId: company.id } },
    update: {},
    create: { userId: inventoryUser.id, companyId: company.id, role: CompanyRole.MANAGER, status: MemberStatus.ACTIVE },
  });

  console.log('✅ Users & Roles Setup Complete');

  // 3. Categories & Units
  const seatingCategory = await prisma.category.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Seating' } },
    update: {},
    create: { companyId: company.id, name: 'Seating', description: 'Chairs, Sofas and Recliners' },
  });

  const livingCategory = await prisma.category.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Living Room' } },
    update: {},
    create: { companyId: company.id, name: 'Living Room', description: 'Tables, TV Units and Shelves' },
  });

  const bedroomCategory = await prisma.category.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Bedroom' } },
    update: {},
    create: { companyId: company.id, name: 'Bedroom', description: 'Beds, Wardrobes and Dressers' },
  });

  const pcsUnit = await prisma.unit.upsert({
    where: { companyId_shortCode: { companyId: company.id, shortCode: 'pcs' } },
    update: {},
    create: { companyId: company.id, name: 'Pieces', shortCode: 'pcs' },
  });

  const setUnit = await prisma.unit.upsert({
    where: { companyId_shortCode: { companyId: company.id, shortCode: 'set' } },
    update: {},
    create: { companyId: company.id, name: 'Set', shortCode: 'set' },
  });

  // 4. DAY 1 — Create Furniture Catalog & Opening Stock
  console.log('📍 Day 1: Catalog Creation & Opening Stock');

  const productsData = [
    { sku: 'CHAIR-WOOD-001', name: 'Premium Wooden Chair', categoryId: seatingCategory.id, unitId: pcsUnit.id, buy: 2500, sell: 4000, opening: 50, reorder: 10 },
    { sku: 'SOFA-3SEAT-001', name: 'Teakwood 3-Seater Sofa', categoryId: seatingCategory.id, unitId: pcsUnit.id, buy: 18000, sell: 28000, opening: 15, reorder: 3 },
    { sku: 'DINING-SET-001', name: '6-Seater Wooden Dining Set', categoryId: livingCategory.id, unitId: setUnit.id, buy: 25000, sell: 42000, opening: 10, reorder: 2 },
    { sku: 'BED-KING-001', name: 'King Size Storage Bed', categoryId: bedroomCategory.id, unitId: pcsUnit.id, buy: 22000, sell: 35000, opening: 8, reorder: 2 },
    { sku: 'WARDROBE-WOOD-001', name: '3-Door Wooden Wardrobe', categoryId: bedroomCategory.id, unitId: pcsUnit.id, buy: 15000, sell: 24000, opening: 12, reorder: 3 },
  ];

  const products: Record<string, any> = {};

  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { companyId_sku: { companyId: company.id, sku: p.sku } },
      update: { currentStock: p.opening },
      create: {
        companyId: company.id,
        sku: p.sku,
        name: p.name,
        productType: ProductType.FINISHED_PRODUCT,
        categoryId: p.categoryId,
        unitId: p.unitId,
        purchasePrice: p.buy,
        sellingPrice: p.sell,
        minimumStock: p.reorder,
        openingStock: p.opening,
        currentStock: p.opening,
      },
    });

    await prisma.inventory.upsert({
      where: { productId: product.id },
      update: { currentQuantity: p.opening, availableQuantity: p.opening },
      create: {
        companyId: company.id,
        productId: product.id,
        currentQuantity: p.opening,
        availableQuantity: p.opening,
        reservedQuantity: 0,
      },
    });

    await prisma.stockMovement.create({
      data: {
        companyId: company.id,
        productId: product.id,
        movementType: StockMovementType.OPENING_STOCK,
        quantity: p.opening,
        previousQuantity: 0,
        newQuantity: p.opening,
        reason: 'Day 1 Opening Stock Initialization',
        createdBy: ownerUser.id,
      },
    });

    products[p.sku] = product;
  }

  // 5. Create Supplier & Customer CRM records
  const supplier = await prisma.supplier.upsert({
    where: { companyId_supplierCode: { companyId: company.id, supplierCode: 'SUP-000001' } },
    update: {},
    create: {
      companyId: company.id,
      supplierCode: 'SUP-000001',
      name: 'Timber Krafts Pvt Ltd',
      phone: '+919847112233',
      email: 'supply@timberkrafts.in',
      gstNumber: '32ABCTK5678J1Z2',
      createdBy: ownerUser.id,
    },
  });

  const customerB2B = await prisma.customer.upsert({
    where: { companyId_customerCode: { companyId: company.id, customerCode: 'CUS-000001' } },
    update: {},
    create: {
      companyId: company.id,
      customerCode: 'CUS-000001',
      name: 'Malabar Decor & Interiors',
      phone: '+919447223344',
      email: 'purchasing@malabardecor.com',
      gstNumber: '32ABCMD9876K1Z1',
      createdBy: salesUser.id,
    },
  });

  const customerRetail = await prisma.customer.upsert({
    where: { companyId_customerCode: { companyId: company.id, customerCode: 'CUS-000002' } },
    update: {},
    create: {
      companyId: company.id,
      customerCode: 'CUS-000002',
      name: 'Dr. Rajesh Kumar',
      phone: '+919447556677',
      email: 'rajesh.kumar@gmail.com',
      createdBy: salesUser.id,
    },
  });

  // 4.1 Create Main Payment Account
  const mainAccount = await (prisma as any).paymentAccount.upsert({
    where: { id: 'main-cash-account-' + company.id },
    update: {},
    create: {
      id: 'main-cash-account-' + company.id,
      companyId: company.id,
      name: 'Main Business Bank Account',
      accountNumber: 'ACC-9988776655',
      openingBalance: 500000,
      currentBalance: 500000,
    },
  });

  // 6. DAY 2 — Purchase 20 Chairs & 5 Sofas
  console.log('📍 Day 2: Stock Purchase (+20 Chairs, +5 Sofas)');
  // Chair current before buy: 50. Sofa current before buy: 15.
  const purchase2 = await prisma.purchase.create({
    data: {
      companyId: company.id,
      purchaseNumber: 'PUR-000001',
      supplierId: supplier.id,
      status: PurchaseStatus.RECEIVED,
      subtotal: 140000, // 20*2500 + 5*18000 = 50k + 90k
      taxAmount: 25200, // 18% GST
      totalAmount: 165200,
      paidAmount: 0,
      dueAmount: 165200,
      paymentStatus: PaymentStatus.UNPAID,
      createdBy: inventoryUser.id,
      items: {
        create: [
          { companyId: company.id, productId: products['CHAIR-WOOD-001'].id, productNameSnapshot: 'Premium Wooden Chair', skuSnapshot: 'CHAIR-WOOD-001', quantity: 20, unitCost: 2500, taxRate: 18, taxAmount: 9000, totalAmount: 59000 },
          { companyId: company.id, productId: products['SOFA-3SEAT-001'].id, productNameSnapshot: 'Teakwood 3-Seater Sofa', skuSnapshot: 'SOFA-3SEAT-001', quantity: 5, unitCost: 18000, taxRate: 18, taxAmount: 16200, totalAmount: 106200 },
        ],
      },
    },
  });

  // Update product stocks for purchase
  await prisma.product.update({ where: { id: products['CHAIR-WOOD-001'].id }, data: { currentStock: { increment: 20 } } });
  await prisma.inventory.update({ where: { productId: products['CHAIR-WOOD-001'].id }, data: { currentQuantity: { increment: 20 }, availableQuantity: { increment: 20 } } });
  await prisma.stockMovement.create({ data: { companyId: company.id, productId: products['CHAIR-WOOD-001'].id, movementType: StockMovementType.PURCHASE, quantity: 20, previousQuantity: 50, newQuantity: 70, referenceType: 'PURCHASE', referenceId: purchase2.id, createdBy: inventoryUser.id } });

  await prisma.product.update({ where: { id: products['SOFA-3SEAT-001'].id }, data: { currentStock: { increment: 5 } } });
  await prisma.inventory.update({ where: { productId: products['SOFA-3SEAT-001'].id }, data: { currentQuantity: { increment: 5 }, availableQuantity: { increment: 5 } } });
  await prisma.stockMovement.create({ data: { companyId: company.id, productId: products['SOFA-3SEAT-001'].id, movementType: StockMovementType.PURCHASE, quantity: 5, previousQuantity: 15, newQuantity: 20, referenceType: 'PURCHASE', referenceId: purchase2.id, createdBy: inventoryUser.id } });

  // 7. DAY 3 — Retail Sale (3 Chairs sold to Dr. Rajesh Kumar - Fully Paid)
  console.log('📍 Day 3: Retail Cash Sale (Sell 3 Chairs)');
  const saleDay3 = await prisma.sale.create({
    data: {
      companyId: company.id,
      saleNumber: 'SAL-000001',
      customerId: customerRetail.id,
      status: SaleStatus.CONFIRMED,
      subtotal: 12000, // 3 * 4000
      taxAmount: 2160,
      totalAmount: 14160,
      paidAmount: 14160,
      dueAmount: 0,
      paymentStatus: PaymentStatus.PAID,
      createdBy: salesUser.id,
      items: {
        create: [{ companyId: company.id, productId: products['CHAIR-WOOD-001'].id, productNameSnapshot: 'Premium Wooden Chair', skuSnapshot: 'CHAIR-WOOD-001', quantity: 3, unitPrice: 4000, taxRate: 18, taxAmount: 2160, totalAmount: 14160 }],
      },
    },
  });

  await prisma.product.update({ where: { id: products['CHAIR-WOOD-001'].id }, data: { currentStock: { decrement: 3 } } });
  await prisma.inventory.update({ where: { productId: products['CHAIR-WOOD-001'].id }, data: { currentQuantity: { decrement: 3 }, availableQuantity: { decrement: 3 } } });
  await prisma.stockMovement.create({ data: { companyId: company.id, productId: products['CHAIR-WOOD-001'].id, movementType: StockMovementType.SALE, quantity: -3, previousQuantity: 70, newQuantity: 67, referenceType: 'SALE', referenceId: saleDay3.id, createdBy: salesUser.id } });

  // 8. DAY 5 — Credit Sale (10 Chairs & 2 Dining Sets sold to Malabar Decor - Partial Payment)
  console.log('📍 Day 5: Credit Sale (10 Chairs + 2 Dining Sets)');
  const saleDay5 = await prisma.sale.create({
    data: {
      companyId: company.id,
      saleNumber: 'SAL-000002',
      customerId: customerB2B.id,
      status: SaleStatus.CONFIRMED,
      subtotal: 124000, // 10*4000 + 2*42000 = 40k + 84k
      discountAmount: 4000,
      taxAmount: 21600, // 18% of (124k - 4k = 120k)
      totalAmount: 141600,
      paidAmount: 41600,
      dueAmount: 100000,
      paymentStatus: PaymentStatus.PARTIALLY_PAID,
      createdBy: salesUser.id,
      items: {
        create: [
          { companyId: company.id, productId: products['CHAIR-WOOD-001'].id, productNameSnapshot: 'Premium Wooden Chair', skuSnapshot: 'CHAIR-WOOD-001', quantity: 10, unitPrice: 4000, taxRate: 18, taxAmount: 7200, totalAmount: 47200 },
          { companyId: company.id, productId: products['DINING-SET-001'].id, productNameSnapshot: '6-Seater Wooden Dining Set', skuSnapshot: 'DINING-SET-001', quantity: 2, unitPrice: 42000, taxRate: 18, taxAmount: 14400, totalAmount: 94400 },
        ],
      },
    },
  });

  // Update Chair (67 -> 57) & Dining Set (10 -> 8)
  await prisma.product.update({ where: { id: products['CHAIR-WOOD-001'].id }, data: { currentStock: { decrement: 10 } } });
  await prisma.inventory.update({ where: { productId: products['CHAIR-WOOD-001'].id }, data: { currentQuantity: { decrement: 10 }, availableQuantity: { decrement: 10 } } });
  await prisma.stockMovement.create({ data: { companyId: company.id, productId: products['CHAIR-WOOD-001'].id, movementType: StockMovementType.SALE, quantity: -10, previousQuantity: 67, newQuantity: 57, referenceType: 'SALE', referenceId: saleDay5.id, createdBy: salesUser.id } });

  await prisma.product.update({ where: { id: products['DINING-SET-001'].id }, data: { currentStock: { decrement: 2 } } });
  await prisma.inventory.update({ where: { productId: products['DINING-SET-001'].id }, data: { currentQuantity: { decrement: 2 }, availableQuantity: { decrement: 2 } } });
  await prisma.stockMovement.create({ data: { companyId: company.id, productId: products['DINING-SET-001'].id, movementType: StockMovementType.SALE, quantity: -2, previousQuantity: 10, newQuantity: 8, referenceType: 'SALE', referenceId: saleDay5.id, createdBy: salesUser.id } });

  // 9. DAY 10 — Sales Return (Customer Returns 2 Chairs)
  console.log('📍 Day 10: Sales Return (+2 Chairs returned by customer)');
  // Chair stock: 57 -> 59
  await prisma.product.update({ where: { id: products['CHAIR-WOOD-001'].id }, data: { currentStock: { increment: 2 } } });
  await prisma.inventory.update({ where: { productId: products['CHAIR-WOOD-001'].id }, data: { currentQuantity: { increment: 2 }, availableQuantity: { increment: 2 } } });
  await prisma.stockMovement.create({ data: { companyId: company.id, productId: products['CHAIR-WOOD-001'].id, movementType: StockMovementType.SALES_RETURN, quantity: 2, previousQuantity: 57, newQuantity: 59, referenceType: 'SALE', referenceId: saleDay5.id, reason: 'Customer Return 2 defective cushions', createdBy: salesUser.id } });

  // Adjust sale invoice balance (Customer Credit Note: 2 * 4000 * 1.18 = 9,440. Customer Due: 100,000 - 9,440 = 90,560)
  await prisma.sale.update({ where: { id: saleDay5.id }, data: { dueAmount: 90560, status: SaleStatus.PARTIALLY_RETURNED } });

  // 10. DAY 15 — Purchase Return (Return 2 Chairs to Supplier Timber Krafts)
  console.log('📍 Day 15: Purchase Return (-2 Chairs returned to supplier)');
  // Chair stock: 59 -> 57
  await prisma.product.update({ where: { id: products['CHAIR-WOOD-001'].id }, data: { currentStock: { decrement: 2 } } });
  await prisma.inventory.update({ where: { productId: products['CHAIR-WOOD-001'].id }, data: { currentQuantity: { decrement: 2 }, availableQuantity: { decrement: 2 } } });
  await prisma.stockMovement.create({ data: { companyId: company.id, productId: products['CHAIR-WOOD-001'].id, movementType: StockMovementType.PURCHASE_RETURN, quantity: -2, previousQuantity: 59, newQuantity: 57, referenceType: 'PURCHASE', referenceId: purchase2.id, reason: 'Return to supplier due to minor scratches', createdBy: inventoryUser.id } });

  // Supplier Due: 165,200 - (2 * 2500 * 1.18 = 5,900) = 159,300
  await prisma.purchase.update({ where: { id: purchase2.id }, data: { dueAmount: 159300 } });

  // 11. DAY 20 — Physical Stock Adjustments (-1 Chair damage, +1 Sofa correction)
  console.log('📍 Day 20: Stock Adjustments (-1 Chair damage, +1 Sofa audit correction)');
  // Chair stock: 57 -> 56
  await prisma.product.update({ where: { id: products['CHAIR-WOOD-001'].id }, data: { currentStock: { decrement: 1 } } });
  await prisma.inventory.update({ where: { productId: products['CHAIR-WOOD-001'].id }, data: { currentQuantity: { decrement: 1 }, availableQuantity: { decrement: 1 } } });
  await prisma.stockMovement.create({ data: { companyId: company.id, productId: products['CHAIR-WOOD-001'].id, movementType: StockMovementType.DAMAGE, quantity: -1, previousQuantity: 57, newQuantity: 56, reason: 'Leg damaged during showroom movement', createdBy: inventoryUser.id } });

  // Sofa stock: 20 -> 21
  await prisma.product.update({ where: { id: products['SOFA-3SEAT-001'].id }, data: { currentStock: { increment: 1 } } });
  await prisma.inventory.update({ where: { productId: products['SOFA-3SEAT-001'].id }, data: { currentQuantity: { increment: 1 }, availableQuantity: { increment: 1 } } });
  await prisma.stockMovement.create({ data: { companyId: company.id, productId: products['SOFA-3SEAT-001'].id, movementType: StockMovementType.STOCK_ADJUSTMENT_IN, quantity: 1, previousQuantity: 20, newQuantity: 21, reason: 'Physical stock count audit correction', createdBy: inventoryUser.id } });

  // 12. DAY 25 — Financial Settlements
  console.log('📍 Day 25: Financial Payments (Customer final payment & Supplier payment)');
  // Customer pays remaining ₹90,560
  await prisma.sale.update({ where: { id: saleDay5.id }, data: { paidAmount: 132160, dueAmount: 0, paymentStatus: PaymentStatus.PAID } });
  await (prisma as any).customerPayment.create({
    data: {
      companyId: company.id,
      customerId: customerB2B.id,
      saleId: saleDay5.id,
      paymentAccountId: mainAccount.id,
      amount: 90560,
      paymentDate: new Date(),
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: 'NEFT-99887766',
      notes: 'Final settlement for SAL-000002 after credit note adjustment',
      createdBy: salesUser.id,
    },
  });

  // Supplier payment ₹100,000 paid to Timber Krafts
  await prisma.purchase.update({ where: { id: purchase2.id }, data: { paidAmount: 100000, dueAmount: 59300, paymentStatus: PaymentStatus.PARTIALLY_PAID } });
  await (prisma as any).supplierPayment.create({
    data: {
      companyId: company.id,
      supplierId: supplier.id,
      purchaseId: purchase2.id,
      paymentAccountId: mainAccount.id,
      amount: 100000,
      paymentDate: new Date(),
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: 'UPI-11223344',
      notes: 'Partial payment towards PUR-000001',
      createdBy: ownerUser.id,
    },
  });

  console.log('✨ 30-Day Business Simulation Completed Successfully!');
}

run30DaySimulation()
  .catch((e) => {
    console.error('Error running 30-day simulation:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
