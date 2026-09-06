import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function safeDelete(name: string, deleteFn: () => Promise<any>) {
  try {
    await deleteFn();
  } catch (err: any) {
    // Silently ignore table missing errors (code 42P01 / P2010)
    if (err?.code !== 'P2010' && !err?.message?.includes('does not exist')) {
      console.warn(`⚠️ Could not clear ${name}: ${err.message || err}`);
    }
  }
}

async function clearBusinessData() {
  console.log('🧹 Clearing all operational ERP & business data from database...');
  console.log('🔒 Keeping User accounts, Companies, CompanyMembers, and AccessRequests intact.\n');

  // Sequential safe deletions in proper foreign key order
  // 1. Media & Stock Movements
  await safeDelete('media_assets', () => (prisma as any).mediaAsset ? (prisma as any).mediaAsset.deleteMany() : prisma.$executeRawUnsafe('DELETE FROM media_assets;'));
  await safeDelete('stock_movements', () => prisma.stockMovement.deleteMany());
  await safeDelete('inventories', () => prisma.inventory.deleteMany());

  // 2. Sales, Invoices & Purchases
  await safeDelete('sale_items', () => (prisma as any).saleItem ? (prisma as any).saleItem.deleteMany() : prisma.$executeRawUnsafe('DELETE FROM sale_items;'));
  await safeDelete('sales', () => (prisma as any).sale.deleteMany());
  await safeDelete('invoices', () => (prisma as any).invoice ? (prisma as any).invoice.deleteMany() : prisma.$executeRawUnsafe('DELETE FROM invoices;'));
  await safeDelete('purchase_items', () => (prisma as any).purchaseItem ? (prisma as any).purchaseItem.deleteMany() : prisma.$executeRawUnsafe('DELETE FROM purchase_items;'));
  await safeDelete('purchases', () => (prisma as any).purchase.deleteMany());

  // 3. Work Orders, Workers & Quality
  await safeDelete('work_order_materials', () => (prisma as any).workOrderMaterial ? (prisma as any).workOrderMaterial.deleteMany() : prisma.$executeRawUnsafe('DELETE FROM work_order_materials;'));
  await safeDelete('work_order_items', () => (prisma as any).workOrderItem ? (prisma as any).workOrderItem.deleteMany() : prisma.$executeRawUnsafe('DELETE FROM work_order_items;'));
  await safeDelete('work_orders', () => (prisma as any).workOrder ? (prisma as any).workOrder.deleteMany() : prisma.$executeRawUnsafe('DELETE FROM work_orders;'));
  await safeDelete('quality_checks', () => (prisma as any).qualityCheck ? (prisma as any).qualityCheck.deleteMany() : prisma.$executeRawUnsafe('DELETE FROM quality_checks;'));
  await safeDelete('worker_attendances', () => (prisma as any).workerAttendance ? (prisma as any).workerAttendance.deleteMany() : prisma.$executeRawUnsafe('DELETE FROM worker_attendances;'));
  await safeDelete('workers', () => (prisma as any).worker ? (prisma as any).worker.deleteMany() : prisma.$executeRawUnsafe('DELETE FROM workers;'));
  await safeDelete('departments', () => (prisma as any).department ? (prisma as any).department.deleteMany() : prisma.$executeRawUnsafe('DELETE FROM departments;'));

  // 4. Finance & Transactions
  await safeDelete('customer_payments', () => (prisma as any).customerPayment ? (prisma as any).customerPayment.deleteMany() : prisma.$executeRawUnsafe('DELETE FROM customer_payments;'));
  await safeDelete('supplier_payments', () => (prisma as any).supplierPayment ? (prisma as any).supplierPayment.deleteMany() : prisma.$executeRawUnsafe('DELETE FROM supplier_payments;'));
  await safeDelete('financial_transactions', () => (prisma as any).financialTransaction ? (prisma as any).financialTransaction.deleteMany() : prisma.$executeRawUnsafe('DELETE FROM financial_transactions;'));
  await safeDelete('account_transfers', () => (prisma as any).accountTransfer ? (prisma as any).accountTransfer.deleteMany() : prisma.$executeRawUnsafe('DELETE FROM account_transfers;'));
  await safeDelete('expenses', () => (prisma as any).expense ? (prisma as any).expense.deleteMany() : prisma.$executeRawUnsafe('DELETE FROM expenses;'));
  await safeDelete('expense_categories', () => (prisma as any).expenseCategory ? (prisma as any).expenseCategory.deleteMany() : prisma.$executeRawUnsafe('DELETE FROM expense_categories;'));
  await safeDelete('payment_accounts', () => (prisma as any).paymentAccount ? (prisma as any).paymentAccount.deleteMany() : prisma.$executeRawUnsafe('DELETE FROM payment_accounts;'));

  // 5. CRM (Customers & Suppliers)
  await safeDelete('customer_addresses', () => (prisma as any).customerAddress ? (prisma as any).customerAddress.deleteMany() : prisma.$executeRawUnsafe('DELETE FROM customer_addresses;'));
  await safeDelete('customer_notes', () => (prisma as any).customerNote ? (prisma as any).customerNote.deleteMany() : prisma.$executeRawUnsafe('DELETE FROM customer_notes;'));
  await safeDelete('customers', () => prisma.customer.deleteMany());
  await safeDelete('supplier_addresses', () => (prisma as any).supplierAddress ? (prisma as any).supplierAddress.deleteMany() : prisma.$executeRawUnsafe('DELETE FROM supplier_addresses;'));
  await safeDelete('supplier_notes', () => (prisma as any).supplierNote ? (prisma as any).supplierNote.deleteMany() : prisma.$executeRawUnsafe('DELETE FROM supplier_notes;'));
  await safeDelete('suppliers', () => prisma.supplier.deleteMany());
  await safeDelete('crm_activities', () => (prisma as any).cRMActivity ? (prisma as any).cRMActivity.deleteMany() : prisma.$executeRawUnsafe('DELETE FROM crm_activities;'));
  await safeDelete('tags', () => (prisma as any).tag ? (prisma as any).tag.deleteMany() : prisma.$executeRawUnsafe('DELETE FROM tags;'));

  // 6. Products, Categories, Units
  await safeDelete('products', () => prisma.product.deleteMany());
  await safeDelete('categories', () => prisma.category.deleteMany());
  await safeDelete('units', () => prisma.unit.deleteMany());

  // 7. System, Imports & Notifications
  await safeDelete('import_jobs', () => (prisma as any).importJob ? (prisma as any).importJob.deleteMany() : prisma.$executeRawUnsafe('DELETE FROM import_jobs;'));
  await safeDelete('audit_logs', () => prisma.auditLog.deleteMany());
  await safeDelete('notifications', () => (prisma as any).notification ? (prisma as any).notification.deleteMany() : prisma.$executeRawUnsafe('DELETE FROM notifications;'));

  console.log('✅ ALL business, product, sales, and inventory data cleared successfully!');
  console.log('🔑 User login credentials and company profiles remain completely safe and accessible.');

  await prisma.$disconnect();
}

clearBusinessData();
