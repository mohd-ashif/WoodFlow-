import { prisma } from '../../config/prisma.js';
import { createAuditLog } from '../audit/audit.service.js';
import { BadRequestError } from '../../utils/errors.js';
import {
  CreatePaymentAccountInput,
  UpdatePaymentAccountInput,
  RecordCustomerPaymentInput,
  RecordSupplierPaymentInput,
  CreateExpenseCategoryInput,
  CreateExpenseInput,
  RecordAccountTransferInput,
} from '@furniture-os/shared';

const db = prisma as any;

let tablesInitialized = false;

async function ensureFinanceTablesExist() {
  if (tablesInitialized) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS payment_accounts (
        id TEXT PRIMARY KEY,
        "companyId" TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'CASH',
        "accountNumber" TEXT,
        "openingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS financial_transactions (
        id TEXT PRIMARY KEY,
        "companyId" TEXT NOT NULL,
        "accountId" TEXT NOT NULL,
        type TEXT NOT NULL,
        direction TEXT NOT NULL,
        amount DOUBLE PRECISION NOT NULL,
        "referenceType" TEXT,
        "referenceId" TEXT,
        description TEXT,
        "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS customer_payments (
        id TEXT PRIMARY KEY,
        "companyId" TEXT NOT NULL,
        "customerId" TEXT,
        "saleId" TEXT,
        "paymentAccountId" TEXT NOT NULL,
        amount DOUBLE PRECISION NOT NULL,
        "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
        "referenceNumber" TEXT,
        notes TEXT,
        "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS supplier_payments (
        id TEXT PRIMARY KEY,
        "companyId" TEXT NOT NULL,
        "supplierId" TEXT,
        "purchaseId" TEXT,
        "paymentAccountId" TEXT NOT NULL,
        amount DOUBLE PRECISION NOT NULL,
        "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
        "referenceNumber" TEXT,
        notes TEXT,
        "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS expense_categories (
        id TEXT PRIMARY KEY,
        "companyId" TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        "companyId" TEXT NOT NULL,
        "categoryId" TEXT,
        "paymentAccountId" TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        amount DOUBLE PRECISION NOT NULL,
        "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
        "referenceNumber" TEXT,
        "receiptUrl" TEXT,
        status TEXT NOT NULL DEFAULT 'PAID',
        "createdBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS account_transfers (
        id TEXT PRIMARY KEY,
        "companyId" TEXT NOT NULL,
        "fromAccountId" TEXT NOT NULL,
        "toAccountId" TEXT NOT NULL,
        amount DOUBLE PRECISION NOT NULL,
        "referenceNumber" TEXT,
        notes TEXT,
        "transferDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    tablesInitialized = true;
  } catch (e) {
    console.error('Failed to auto-create finance tables:', e);
  }
}

async function findFirstAccount(companyId: string, type: string) {
  let r: any = null;
  try {
    if (db.paymentAccount?.findFirst) {
      r = await db.paymentAccount.findFirst({ where: { companyId, type, isActive: true } });
    } else {
      throw new Error('Prisma model not available');
    }
  } catch {
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM payment_accounts WHERE "companyId" = $1 AND type = $2 AND ("isActive" = true OR "isActive" IS NULL) LIMIT 1`,
      companyId, type
    );
    r = rows[0];
  }
  if (!r) return null;
  return {
    id: r.id,
    companyId: r.companyId ?? r.companyid,
    name: r.name,
    type: r.type,
    accountNumber: r.accountNumber ?? r.accountnumber ?? null,
    openingBalance: Number(r.openingBalance ?? r.openingbalance ?? 0),
    currentBalance: Number(r.currentBalance ?? r.currentbalance ?? 0),
    isActive: r.isActive ?? r.isactive ?? true,
    createdAt: r.createdAt ?? r.createdat,
    updatedAt: r.updatedAt ?? r.updatedat,
  };
}

async function createAccountRecord(data: any) {
  let r: any = null;
  try {
    if (db.paymentAccount?.create) {
      r = await db.paymentAccount.create({ data });
    } else {
      throw new Error('Prisma model not available');
    }
  } catch {
    const id = 'acc_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    const rows: any[] = await prisma.$queryRawUnsafe(
      `INSERT INTO payment_accounts (id, "companyId", name, type, "accountNumber", "openingBalance", "currentBalance", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
       RETURNING *`,
      id, data.companyId, data.name, data.type || 'CASH', data.accountNumber || null, Number(data.openingBalance || 0), Number(data.currentBalance || 0)
    );
    r = rows[0];
  }
  if (!r) return null;
  return {
    id: r.id,
    companyId: r.companyId ?? r.companyid,
    name: r.name,
    type: r.type,
    accountNumber: r.accountNumber ?? r.accountnumber ?? null,
    openingBalance: Number(r.openingBalance ?? r.openingbalance ?? 0),
    currentBalance: Number(r.currentBalance ?? r.currentbalance ?? 0),
    isActive: r.isActive ?? r.isactive ?? true,
    createdAt: r.createdAt ?? r.createdat,
    updatedAt: r.updatedAt ?? r.updatedat,
  };
}

async function findManyAccounts(companyId: string) {
  let rows: any[] = [];
  try {
    if (db.paymentAccount?.findMany) {
      rows = await db.paymentAccount.findMany({ where: { companyId, isActive: true }, orderBy: { createdAt: 'asc' } });
    } else {
      throw new Error('Prisma model not available');
    }
  } catch {
    rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM payment_accounts WHERE "companyId" = $1 AND ("isActive" = true OR "isActive" IS NULL) ORDER BY "createdAt" ASC`,
      companyId
    );
  }
  return rows.map((r: any) => ({
    id: r.id,
    companyId: r.companyId ?? r.companyid,
    name: r.name,
    type: r.type,
    accountNumber: r.accountNumber ?? r.accountnumber ?? null,
    openingBalance: Number(r.openingBalance ?? r.openingbalance ?? 0),
    currentBalance: Number(r.currentBalance ?? r.currentbalance ?? 0),
    isActive: r.isActive ?? r.isactive ?? true,
    createdAt: r.createdAt ?? r.createdat,
    updatedAt: r.updatedAt ?? r.updatedat,
  }));
}

export class FinanceService {
  // Ensure default "Cash in Hand" account exists for company
  async getOrCreateDefaultCashAccount(companyId: string) {
    try {
      await ensureFinanceTablesExist();
      let account = await findFirstAccount(companyId, 'CASH');

      if (!account) {
        account = await createAccountRecord({
          companyId,
          name: 'Cash in Hand',
          type: 'CASH',
          openingBalance: 0,
          currentBalance: 0,
          isActive: true,
        });

        if (account) {
          try {
            await createAuditLog({
              companyId,
              action: 'PAYMENT_ACCOUNT_CREATED',
              entity: 'PaymentAccount',
              entityId: account.id,
              metadata: { name: account.name, type: account.type, autoCreated: true },
            });
          } catch {
            // Ignore audit log error
          }
        }
      }

      return account;
    } catch (err) {
      console.warn('Error in getOrCreateDefaultCashAccount:', err);
      return null;
    }
  }

  // Ensure default expense categories exist
  async seedDefaultExpenseCategories(companyId: string) {
    if (db.expenseCategory) {
      const existing = await db.expenseCategory.count({ where: { companyId } });
      if (existing > 0) return;
    } else {
      try {
        const existingRows: any[] = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*)::int as count FROM expense_categories WHERE "companyId" = $1`,
          companyId
        );
        if (Number(existingRows[0]?.count || 0) > 0) return;
      } catch {
        // Continue if table query fails
      }
    }

    const defaultCategories = [
      { name: 'Shop Rent', description: 'Workshop & Store rental expenses' },
      { name: 'Electricity', description: 'Power & utilities bills' },
      { name: 'Transportation', description: 'Freight, shipping & delivery costs' },
      { name: 'Fuel', description: 'Vehicle fuel & generator diesel' },
      { name: 'Worker Salary', description: 'Staff wages, overtime & allowances' },
      { name: 'Maintenance', description: 'Machine repair, tools & equipment upkeep' },
      { name: 'Marketing', description: 'Advertising, promotion & branding' },
      { name: 'Internet & Phone', description: 'Communication expenses' },
      { name: 'Office Supplies', description: 'Stationery, paper & office items' },
      { name: 'Miscellaneous', description: 'General & unclassified business expenses' },
    ];

    for (const cat of defaultCategories) {
      if (db.expenseCategory) {
        await db.expenseCategory.upsert({
          where: { companyId_name: { companyId, name: cat.name } },
          update: {},
          create: {
            companyId,
            name: cat.name,
            description: cat.description,
            isActive: true,
          },
        });
      } else {
        const catId = 'cat_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
        await prisma.$executeRawUnsafe(
          `INSERT INTO expense_categories (id, "companyId", name, description, "isActive", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, true, NOW(), NOW())
           ON CONFLICT DO NOTHING`,
          catId, companyId, cat.name, cat.description
        );
      }
    }
  }

  // --- PAYMENT ACCOUNTS ---
  async listPaymentAccounts(companyId: string) {
    try {
      await this.getOrCreateDefaultCashAccount(companyId);
    } catch (err) {
      console.warn('Could not auto-create default cash account:', err);
    }

    let accounts = await findManyAccounts(companyId);
    if (!accounts || accounts.length === 0) {
      const defaultCash = await createAccountRecord({
        companyId,
        name: 'Cash in Hand',
        type: 'CASH',
        openingBalance: 0,
        currentBalance: 0,
        isActive: true,
      });
      if (defaultCash) {
        accounts = [defaultCash];
      }
    }
    return accounts || [];
  }

  async createPaymentAccount(companyId: string, userId: string, input: CreatePaymentAccountInput) {
    await ensureFinanceTablesExist();
    const account = await createAccountRecord({
      companyId,
      name: input.name,
      type: input.type,
      accountNumber: input.accountNumber || null,
      openingBalance: Number(input.openingBalance || 0),
      currentBalance: Number(input.openingBalance || 0),
      isActive: true,
    });
    if (!account) throw new Error('Failed to create payment account');

    if (input.openingBalance > 0) {
      if (db.financialTransaction) {
        await db.financialTransaction.create({
          data: {
            companyId,
            accountId: account.id,
            type: 'OPENING_BALANCE',
            direction: 'CREDIT',
            amount: input.openingBalance,
            description: `Opening balance for ${account.name}`,
            createdBy: userId,
          },
        });
      } else {
        const txId = 'tx_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
        await prisma.$executeRawUnsafe(
          `INSERT INTO financial_transactions (id, "companyId", "accountId", type, direction, amount, description, "createdBy", "transactionDate", "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
          txId, companyId, account.id, 'OPENING_BALANCE', 'CREDIT', Number(input.openingBalance), `Opening balance for ${account.name}`, userId
        );
      }
    }

    await createAuditLog({
      companyId,
      userId,
      action: 'PAYMENT_ACCOUNT_CREATED',
      entity: 'PaymentAccount',
      entityId: account.id,
      metadata: { name: account.name, type: account.type, openingBalance: input.openingBalance },
    });

    return account;
  }

  async updatePaymentAccount(companyId: string, userId: string, accountId: string, input: UpdatePaymentAccountInput) {
    await ensureFinanceTablesExist();
    if (db.paymentAccount) {
      const existing = await db.paymentAccount.findFirst({
        where: { id: accountId, companyId },
      });
      if (!existing) throw new Error('Payment account not found');

      const updated = await db.paymentAccount.update({
        where: { id: accountId },
        data: {
          name: input.name ?? existing.name,
          type: input.type ?? existing.type,
          accountNumber: input.accountNumber !== undefined ? input.accountNumber : existing.accountNumber,
          isActive: input.isActive !== undefined ? input.isActive : existing.isActive,
        },
      });

      await createAuditLog({
        companyId,
        userId,
        action: 'PAYMENT_ACCOUNT_UPDATED',
        entity: 'PaymentAccount',
        entityId: accountId,
        metadata: input,
      });

      return updated;
    }

    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM payment_accounts WHERE id = $1 AND "companyId" = $2 LIMIT 1`,
      accountId, companyId
    );
    if (!rows.length) throw new Error('Payment account not found');
    const existing = rows[0];

    const updatedName = input.name ?? existing.name;
    const updatedType = input.type ?? existing.type;
    const updatedAccountNumber = input.accountNumber !== undefined ? input.accountNumber : existing.accountNumber;
    const updatedIsActive = input.isActive !== undefined ? input.isActive : existing.isActive;

    const res: any[] = await prisma.$queryRawUnsafe(
      `UPDATE payment_accounts
       SET name = $1, type = $2, "accountNumber" = $3, "isActive" = $4, "updatedAt" = NOW()
       WHERE id = $5 AND "companyId" = $6
       RETURNING *`,
      updatedName, updatedType, updatedAccountNumber, updatedIsActive, accountId, companyId
    );

    await createAuditLog({
      companyId,
      userId,
      action: 'PAYMENT_ACCOUNT_UPDATED',
      entity: 'PaymentAccount',
      entityId: accountId,
      metadata: input,
    });

    return res[0];
  }

  async deletePaymentAccount(companyId: string, userId: string, accountId: string) {
    await ensureFinanceTablesExist();
    if (db.paymentAccount) {
      const existing = await db.paymentAccount.findFirst({
        where: { id: accountId, companyId },
      });
      if (!existing) throw new Error('Payment account not found');

      const updated = await db.paymentAccount.update({
        where: { id: accountId },
        data: { isActive: false },
      });

      await createAuditLog({
        companyId,
        userId,
        action: 'PAYMENT_ACCOUNT_DELETED',
        entity: 'PaymentAccount',
        entityId: accountId,
        metadata: { name: existing.name },
      });

      return updated;
    }

    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM payment_accounts WHERE id = $1 AND "companyId" = $2 LIMIT 1`,
      accountId, companyId
    );
    if (!rows.length) throw new Error('Payment account not found');

    await prisma.$executeRawUnsafe(
      `UPDATE payment_accounts SET "isActive" = false, "updatedAt" = NOW() WHERE id = $1 AND "companyId" = $2`,
      accountId, companyId
    );

    await createAuditLog({
      companyId,
      userId,
      action: 'PAYMENT_ACCOUNT_DELETED',
      entity: 'PaymentAccount',
      entityId: accountId,
      metadata: { name: rows[0].name },
    });

    return { id: accountId, success: true };
  }

  async getAccountTransactions(companyId: string, accountId: string, options?: { page?: number; limit?: number }) {
    await ensureFinanceTablesExist();
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    let account: any = null;
    if (db.paymentAccount) {
      account = await db.paymentAccount.findFirst({
        where: { id: accountId, companyId },
      });
    } else {
      const accRows: any[] = await prisma.$queryRawUnsafe(
        `SELECT * FROM payment_accounts WHERE id = $1 AND "companyId" = $2 LIMIT 1`,
        accountId, companyId
      );
      account = accRows[0] || null;
    }
    if (!account) throw new Error('Payment account not found');

    let transactions: any[] = [];
    let total = 0;

    if (db.financialTransaction) {
      const [txs, count] = await Promise.all([
        db.financialTransaction.findMany({
          where: { companyId, accountId },
          include: {
            creator: { select: { id: true, name: true, email: true } },
          },
          orderBy: { transactionDate: 'desc' },
          skip,
          take: limit,
        }),
        db.financialTransaction.count({ where: { companyId, accountId } }),
      ]);
      transactions = txs;
      total = count;
    } else {
      transactions = await prisma.$queryRawUnsafe(
        `SELECT ft.*, u.name as "creatorName", u.email as "creatorEmail"
         FROM financial_transactions ft
         LEFT JOIN users u ON ft."createdBy" = u.id
         WHERE ft."companyId" = $1 AND ft."accountId" = $2
         ORDER BY ft."transactionDate" DESC
         OFFSET $3 LIMIT $4`,
        companyId, accountId, skip, limit
      );
      const countRes: any[] = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int as count FROM financial_transactions WHERE "companyId" = $1 AND "accountId" = $2`,
        companyId, accountId
      );
      total = countRes[0]?.count || 0;
    }

    return {
      account,
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // --- CUSTOMER PAYMENTS ---
  async recordCustomerPayment(companyId: string, userId: string, input: RecordCustomerPaymentInput) {
    await ensureFinanceTablesExist();
    if (db.customerPayment && db.financialTransaction && db.paymentAccount) {
      return db.$transaction(async (tx: any) => {
        let sale = null;
        let customerId = input.customerId || null;

        if (input.saleId) {
          sale = await tx.sale.findFirst({
            where: { id: input.saleId, companyId },
          });
          if (!sale) throw new Error('Sale order not found');

          customerId = sale.customerId || customerId;
          const currentPaid = sale.paidAmount || 0;
          const outstanding = sale.totalAmount - currentPaid;

          if (input.amount > outstanding + 0.01) {
            throw new Error(`Payment amount (₹${input.amount}) exceeds outstanding balance (₹${outstanding.toFixed(2)})`);
          }
        }

        const account = await tx.paymentAccount.findFirst({
          where: { id: input.paymentAccountId, companyId, isActive: true },
        });
        if (!account) throw new Error('Payment account not found or inactive');

        const payment = await tx.customerPayment.create({
          data: {
            companyId,
            customerId,
            saleId: input.saleId || null,
            paymentAccountId: input.paymentAccountId,
            amount: input.amount,
            paymentMethod: input.paymentMethod || 'CASH',
            referenceNumber: input.referenceNumber || null,
            notes: input.notes || null,
            paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
            createdBy: userId,
          },
        });

        await tx.financialTransaction.create({
          data: {
            companyId,
            accountId: input.paymentAccountId,
            type: 'CUSTOMER_PAYMENT',
            direction: 'CREDIT',
            amount: input.amount,
            referenceType: 'CUSTOMER_PAYMENT',
            referenceId: payment.id,
            description: sale
              ? `Customer Payment for Sale ${sale.saleNumber}`
              : `Customer Payment from Customer`,
            transactionDate: payment.paymentDate,
            createdBy: userId,
          },
        });

        await tx.paymentAccount.update({
          where: { id: input.paymentAccountId },
          data: { currentBalance: { increment: input.amount } },
        });

        if (sale) {
          const newPaidAmount = (sale.paidAmount || 0) + input.amount;
          const newDueAmount = Math.max(0, sale.totalAmount - newPaidAmount);
          let newPaymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' = 'PARTIALLY_PAID';

          if (newDueAmount <= 0.01) {
            newPaymentStatus = 'PAID';
          } else if (newPaidAmount <= 0) {
            newPaymentStatus = 'UNPAID';
          }

          await tx.sale.update({
            where: { id: sale.id },
            data: {
              paidAmount: newPaidAmount,
              dueAmount: newDueAmount,
              paymentStatus: newPaymentStatus,
            },
          });
        } else if (customerId) {
          let remainingPayment = input.amount;
          const openSales = await tx.sale.findMany({
            where: { companyId, customerId, dueAmount: { gt: 0 } },
            orderBy: { saleDate: 'asc' },
          });

          for (const s of openSales) {
            if (remainingPayment <= 0) break;
            const currentPaid = s.paidAmount || 0;
            const due = s.dueAmount || Math.max(0, s.totalAmount - currentPaid);
            const payForThisSale = Math.min(remainingPayment, due);
            const newPaidAmount = currentPaid + payForThisSale;
            const newDueAmount = Math.max(0, s.totalAmount - newPaidAmount);
            const newPaymentStatus = newDueAmount <= 0.01 ? 'PAID' : 'PARTIALLY_PAID';

            await tx.sale.update({
              where: { id: s.id },
              data: {
                paidAmount: newPaidAmount,
                dueAmount: newDueAmount,
                paymentStatus: newPaymentStatus,
              },
            });

            remainingPayment -= payForThisSale;
          }
        }

        await createAuditLog({
          companyId,
          userId,
          action: 'CUSTOMER_PAYMENT_RECEIVED',
          entity: 'CustomerPayment',
          entityId: payment.id,
          metadata: { amount: input.amount, saleId: input.saleId, customerId, paymentAccountId: input.paymentAccountId },
        });

        return payment;
      });
    }

    // RAW SQL fallback
    let sale: any = null;
    let customerId = input.customerId || null;

    if (input.saleId) {
      const saleRows: any[] = await prisma.$queryRawUnsafe(
        `SELECT * FROM sales WHERE id = $1 AND "companyId" = $2 LIMIT 1`,
        input.saleId, companyId
      );
      if (!saleRows.length) throw new Error('Sale order not found');
      sale = saleRows[0];

      customerId = sale.customerId || customerId;
      const currentPaid = Number(sale.paidAmount || 0);
      const outstanding = Number(sale.totalAmount || 0) - currentPaid;

      if (input.amount > outstanding + 0.01) {
        throw new Error(`Payment amount (₹${input.amount}) exceeds outstanding balance (₹${outstanding.toFixed(2)})`);
      }
    }

    const accRows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM payment_accounts WHERE id = $1 AND "companyId" = $2 AND "isActive" = true LIMIT 1`,
      input.paymentAccountId, companyId
    );
    if (!accRows.length) throw new Error('Payment account not found or inactive');

    const paymentId = 'pay_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    const paymentDate = input.paymentDate ? new Date(input.paymentDate) : new Date();

    await prisma.$executeRawUnsafe(
      `INSERT INTO customer_payments (id, "companyId", "customerId", "saleId", "paymentAccountId", amount, "paymentMethod", "referenceNumber", notes, "paymentDate", "createdBy", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
      paymentId, companyId, customerId, input.saleId || null, input.paymentAccountId, Number(input.amount), input.paymentMethod || 'CASH', input.referenceNumber || null, input.notes || null, paymentDate, userId
    );

    const txId = 'tx_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    const description = sale ? `Customer Payment for Sale ${sale.saleNumber}` : `Customer Payment from Customer`;

    await prisma.$executeRawUnsafe(
      `INSERT INTO financial_transactions (id, "companyId", "accountId", type, direction, amount, "referenceType", "referenceId", description, "transactionDate", "createdBy", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
      txId, companyId, input.paymentAccountId, 'CUSTOMER_PAYMENT', 'CREDIT', Number(input.amount), 'CUSTOMER_PAYMENT', paymentId, description, paymentDate, userId
    );

    await prisma.$executeRawUnsafe(
      `UPDATE payment_accounts SET "currentBalance" = "currentBalance" + $1, "updatedAt" = NOW() WHERE id = $2`,
      Number(input.amount), input.paymentAccountId
    );

    if (sale) {
      const newPaidAmount = Number(sale.paidAmount || 0) + Number(input.amount);
      const newDueAmount = Math.max(0, Number(sale.totalAmount || 0) - newPaidAmount);
      let newPaymentStatus = 'PARTIALLY_PAID';
      if (newDueAmount <= 0.01) newPaymentStatus = 'PAID';
      else if (newPaidAmount <= 0) newPaymentStatus = 'UNPAID';

      await prisma.$executeRawUnsafe(
        `UPDATE sales SET "paidAmount" = $1, "dueAmount" = $2, "paymentStatus" = $3, "updatedAt" = NOW() WHERE id = $4`,
        newPaidAmount, newDueAmount, newPaymentStatus, sale.id
      );
    }

    await createAuditLog({
      companyId,
      userId,
      action: 'CUSTOMER_PAYMENT_RECEIVED',
      entity: 'CustomerPayment',
      entityId: paymentId,
      metadata: { amount: input.amount, saleId: input.saleId, customerId, paymentAccountId: input.paymentAccountId },
    });

    return { id: paymentId, amount: input.amount, paymentAccountId: input.paymentAccountId };
  }

  async listCustomerPayments(companyId: string, options?: { page?: number; limit?: number; customerId?: string; saleId?: string }) {
    await ensureFinanceTablesExist();
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    if (db.customerPayment) {
      const where: any = { companyId };
      if (options?.customerId) where.customerId = options.customerId;
      if (options?.saleId) where.saleId = options.saleId;

      const [payments, total] = await Promise.all([
        db.customerPayment.findMany({
          where,
          include: {
            customer: { select: { id: true, name: true, customerCode: true } },
            sale: { select: { id: true, saleNumber: true, totalAmount: true } },
            paymentAccount: { select: { id: true, name: true, type: true } },
            creator: { select: { id: true, name: true } },
          },
          orderBy: { paymentDate: 'desc' },
          skip,
          take: limit,
        }),
        db.customerPayment.count({ where }),
      ]);

      return {
        payments,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    }

    const payments: any[] = await prisma.$queryRawUnsafe(
      `SELECT cp.*, c.name as "customerName", c."customerCode", s."saleNumber", pa.name as "accountName", pa.type as "accountType"
       FROM customer_payments cp
       LEFT JOIN customers c ON cp."customerId" = c.id
       LEFT JOIN sales s ON cp."saleId" = s.id
       LEFT JOIN payment_accounts pa ON cp."paymentAccountId" = pa.id
       WHERE cp."companyId" = $1
       ORDER BY cp."paymentDate" DESC
       OFFSET $2 LIMIT $3`,
      companyId, skip, limit
    );
    const countRes: any[] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int as count FROM customer_payments WHERE "companyId" = $1`,
      companyId
    );
    const total = countRes[0]?.count || 0;

    return {
      payments,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // --- SUPPLIER PAYMENTS ---
  async recordSupplierPayment(companyId: string, userId: string, input: RecordSupplierPaymentInput) {
    await ensureFinanceTablesExist();
    if (db.supplierPayment && db.financialTransaction && db.paymentAccount) {
      return db.$transaction(async (tx: any) => {
        let purchase = null;
        let supplierId = input.supplierId || null;

        if (input.purchaseId) {
          purchase = await tx.purchase.findFirst({
            where: { id: input.purchaseId, companyId },
          });
          if (!purchase) throw new Error('Purchase order not found');

          supplierId = purchase.supplierId || supplierId;
          const currentPaid = purchase.paidAmount || 0;
          const outstanding = purchase.totalAmount - currentPaid;

          if (input.amount > outstanding + 0.01) {
            throw new Error(`Payment amount (₹${input.amount}) exceeds outstanding payable balance (₹${outstanding.toFixed(2)})`);
          }
        }

        const account = await tx.paymentAccount.findFirst({
          where: { id: input.paymentAccountId, companyId, isActive: true },
        });
        if (!account) throw new Error('Payment account not found or inactive');

        if (account.currentBalance < input.amount) {
          throw new Error(`Insufficient account balance (₹${account.currentBalance.toFixed(2)}) to pay ₹${input.amount}`);
        }

        const payment = await tx.supplierPayment.create({
          data: {
            companyId,
            supplierId,
            purchaseId: input.purchaseId || null,
            paymentAccountId: input.paymentAccountId,
            amount: input.amount,
            paymentMethod: input.paymentMethod || 'CASH',
            referenceNumber: input.referenceNumber || null,
            notes: input.notes || null,
            paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
            createdBy: userId,
          },
        });

        await tx.financialTransaction.create({
          data: {
            companyId,
            accountId: input.paymentAccountId,
            type: 'SUPPLIER_PAYMENT',
            direction: 'DEBIT',
            amount: input.amount,
            referenceType: 'SUPPLIER_PAYMENT',
            referenceId: payment.id,
            description: purchase
              ? `Supplier Payment for Purchase ${purchase.purchaseNumber}`
              : `Supplier Payment to Supplier`,
            transactionDate: payment.paymentDate,
            createdBy: userId,
          },
        });

        await tx.paymentAccount.update({
          where: { id: input.paymentAccountId },
          data: { currentBalance: { decrement: input.amount } },
        });

        if (purchase) {
          const newPaidAmount = (purchase.paidAmount || 0) + input.amount;
          const newDueAmount = Math.max(0, purchase.totalAmount - newPaidAmount);
          let newPaymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' = 'PARTIALLY_PAID';

          if (newDueAmount <= 0.01) {
            newPaymentStatus = 'PAID';
          } else if (newPaidAmount <= 0) {
            newPaymentStatus = 'UNPAID';
          }

          await tx.purchase.update({
            where: { id: purchase.id },
            data: {
              paidAmount: newPaidAmount,
              dueAmount: newDueAmount,
              paymentStatus: newPaymentStatus,
            },
          });
        } else if (supplierId) {
          let remainingPayment = input.amount;
          const openPurchases = await tx.purchase.findMany({
            where: { companyId, supplierId, dueAmount: { gt: 0 } },
            orderBy: { purchaseDate: 'asc' },
          });

          for (const p of openPurchases) {
            if (remainingPayment <= 0) break;
            const currentPaid = p.paidAmount || 0;
            const due = p.dueAmount || Math.max(0, p.totalAmount - currentPaid);
            const payForThisPurchase = Math.min(remainingPayment, due);
            const newPaidAmount = currentPaid + payForThisPurchase;
            const newDueAmount = Math.max(0, p.totalAmount - newPaidAmount);
            const newPaymentStatus = newDueAmount <= 0.01 ? 'PAID' : 'PARTIALLY_PAID';

            await tx.purchase.update({
              where: { id: p.id },
              data: {
                paidAmount: newPaidAmount,
                dueAmount: newDueAmount,
                paymentStatus: newPaymentStatus,
              },
            });

            remainingPayment -= payForThisPurchase;
          }
        }

        await createAuditLog({
          companyId,
          userId,
          action: 'SUPPLIER_PAYMENT_CREATED',
          entity: 'SupplierPayment',
          entityId: payment.id,
          metadata: { amount: input.amount, purchaseId: input.purchaseId, supplierId, paymentAccountId: input.paymentAccountId },
        });

        return payment;
      });
    }

    // RAW SQL fallback
    let purchase: any = null;
    let supplierId = input.supplierId || null;

    if (input.purchaseId) {
      const pRows: any[] = await prisma.$queryRawUnsafe(
        `SELECT * FROM purchases WHERE id = $1 AND "companyId" = $2 LIMIT 1`,
        input.purchaseId, companyId
      );
      if (!pRows.length) throw new Error('Purchase order not found');
      purchase = pRows[0];

      supplierId = purchase.supplierId || supplierId;
      const currentPaid = Number(purchase.paidAmount || 0);
      const outstanding = Number(purchase.totalAmount || 0) - currentPaid;

      if (input.amount > outstanding + 0.01) {
        throw new Error(`Payment amount (₹${input.amount}) exceeds outstanding payable balance (₹${outstanding.toFixed(2)})`);
      }
    }

    const accRows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM payment_accounts WHERE id = $1 AND "companyId" = $2 AND "isActive" = true LIMIT 1`,
      input.paymentAccountId, companyId
    );
    if (!accRows.length) throw new Error('Payment account not found or inactive');
    const account = accRows[0];

    if (Number(account.currentBalance) < Number(input.amount)) {
      throw new Error(`Insufficient account balance (₹${Number(account.currentBalance).toFixed(2)}) to pay ₹${input.amount}`);
    }

    const paymentId = 'spay_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    const paymentDate = input.paymentDate ? new Date(input.paymentDate) : new Date();

    await prisma.$executeRawUnsafe(
      `INSERT INTO supplier_payments (id, "companyId", "supplierId", "purchaseId", "paymentAccountId", amount, "paymentMethod", "referenceNumber", notes, "paymentDate", "createdBy", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
      paymentId, companyId, supplierId, input.purchaseId || null, input.paymentAccountId, Number(input.amount), input.paymentMethod || 'CASH', input.referenceNumber || null, input.notes || null, paymentDate, userId
    );

    const txId = 'tx_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    const description = purchase ? `Supplier Payment for Purchase ${purchase.purchaseNumber}` : `Supplier Payment to Supplier`;

    await prisma.$executeRawUnsafe(
      `INSERT INTO financial_transactions (id, "companyId", "accountId", type, direction, amount, "referenceType", "referenceId", description, "transactionDate", "createdBy", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
      txId, companyId, input.paymentAccountId, 'SUPPLIER_PAYMENT', 'DEBIT', Number(input.amount), 'SUPPLIER_PAYMENT', paymentId, description, paymentDate, userId
    );

    await prisma.$executeRawUnsafe(
      `UPDATE payment_accounts SET "currentBalance" = "currentBalance" - $1, "updatedAt" = NOW() WHERE id = $2`,
      Number(input.amount), input.paymentAccountId
    );

    if (purchase) {
      const newPaidAmount = Number(purchase.paidAmount || 0) + Number(input.amount);
      const newDueAmount = Math.max(0, Number(purchase.totalAmount || 0) - newPaidAmount);
      let newPaymentStatus = 'PARTIALLY_PAID';
      if (newDueAmount <= 0.01) newPaymentStatus = 'PAID';
      else if (newPaidAmount <= 0) newPaymentStatus = 'UNPAID';

      await prisma.$executeRawUnsafe(
        `UPDATE purchases SET "paidAmount" = $1, "dueAmount" = $2, "paymentStatus" = $3, "updatedAt" = NOW() WHERE id = $4`,
        newPaidAmount, newDueAmount, newPaymentStatus, purchase.id
      );
    }

    await createAuditLog({
      companyId,
      userId,
      action: 'SUPPLIER_PAYMENT_CREATED',
      entity: 'SupplierPayment',
      entityId: paymentId,
      metadata: { amount: input.amount, purchaseId: input.purchaseId, supplierId, paymentAccountId: input.paymentAccountId },
    });

    return { id: paymentId, amount: input.amount, paymentAccountId: input.paymentAccountId };
  }

  async listSupplierPayments(companyId: string, options?: { page?: number; limit?: number; supplierId?: string; purchaseId?: string }) {
    await ensureFinanceTablesExist();
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    if (db.supplierPayment) {
      const where: any = { companyId };
      if (options?.supplierId) where.supplierId = options.supplierId;
      if (options?.purchaseId) where.purchaseId = options.purchaseId;

      const [payments, total] = await Promise.all([
        db.supplierPayment.findMany({
          where,
          include: {
            supplier: { select: { id: true, name: true, supplierCode: true } },
            purchase: { select: { id: true, purchaseNumber: true, totalAmount: true } },
            paymentAccount: { select: { id: true, name: true, type: true } },
            creator: { select: { id: true, name: true } },
          },
          orderBy: { paymentDate: 'desc' },
          skip,
          take: limit,
        }),
        db.supplierPayment.count({ where }),
      ]);

      return {
        payments,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    }

    const payments: any[] = await prisma.$queryRawUnsafe(
      `SELECT sp.*, s.name as "supplierName", s."supplierCode", p."purchaseNumber", pa.name as "accountName", pa.type as "accountType"
       FROM supplier_payments sp
       LEFT JOIN suppliers s ON sp."supplierId" = s.id
       LEFT JOIN purchases p ON sp."purchaseId" = p.id
       LEFT JOIN payment_accounts pa ON sp."paymentAccountId" = pa.id
       WHERE sp."companyId" = $1
       ORDER BY sp."paymentDate" DESC
       OFFSET $2 LIMIT $3`,
      companyId, skip, limit
    );
    const countRes: any[] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int as count FROM supplier_payments WHERE "companyId" = $1`,
      companyId
    );
    const total = countRes[0]?.count || 0;

    return {
      payments,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // --- EXPENSE CATEGORIES & EXPENSES ---
  async listExpenseCategories(companyId: string) {
    await ensureFinanceTablesExist();
    try {
      await this.seedDefaultExpenseCategories(companyId);
    } catch (err) {
      console.warn('Could not seed expense categories:', err);
    }

    let categories: any[] = [];
    if (db.expenseCategory) {
      categories = await db.expenseCategory.findMany({
        where: { companyId, isActive: true },
        orderBy: { name: 'asc' },
      });
    } else {
      categories = await prisma.$queryRawUnsafe(
        `SELECT * FROM expense_categories WHERE "companyId" = $1 AND "isActive" = true ORDER BY name ASC`,
        companyId
      );
    }

    const seen = new Set<string>();
    return categories.filter((cat: any) => {
      const key = (cat.name || '').toLowerCase().trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async createExpenseCategory(companyId: string, userId: string, input: CreateExpenseCategoryInput) {
    await ensureFinanceTablesExist();
    if (db.expenseCategory) {
      const category = await db.expenseCategory.create({
        data: {
          companyId,
          name: input.name,
          description: input.description || null,
          isActive: true,
        },
      });

      await createAuditLog({
        companyId,
        userId,
        action: 'EXPENSE_CATEGORY_CREATED',
        entity: 'ExpenseCategory',
        entityId: category.id,
        metadata: { name: category.name },
      });

      return category;
    }

    const catId = 'cat_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    const rows: any[] = await prisma.$queryRawUnsafe(
      `INSERT INTO expense_categories (id, "companyId", name, description, "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, true, NOW(), NOW())
       RETURNING *`,
      catId, companyId, input.name, input.description || null
    );

    await createAuditLog({
      companyId,
      userId,
      action: 'EXPENSE_CATEGORY_CREATED',
      entity: 'ExpenseCategory',
      entityId: catId,
      metadata: { name: input.name },
    });

    return rows[0];
  }

  async createExpense(companyId: string, userId: string, input: CreateExpenseInput) {
    await ensureFinanceTablesExist();
    if (db.expense && db.financialTransaction && db.paymentAccount) {
      return db.$transaction(async (tx: any) => {
        const account = await tx.paymentAccount.findFirst({
          where: { id: input.paymentAccountId, companyId, isActive: true },
        });
        if (!account) throw new BadRequestError('Payment account not found or inactive');

        if (account.currentBalance < input.amount) {
          throw new BadRequestError(`Insufficient account balance (₹${account.currentBalance.toFixed(2)}) for expense ₹${input.amount.toFixed(2)}`);
        }

        let categoryId = input.categoryId || null;
        if (categoryId && categoryId.trim()) {
          const existingCat = await tx.expenseCategory.findFirst({
            where: { companyId, OR: [{ id: categoryId }, { name: categoryId }] },
          });
          if (existingCat) {
            categoryId = existingCat.id;
          } else {
            const newCat = await tx.expenseCategory.create({
              data: { companyId, name: categoryId, isActive: true },
            });
            categoryId = newCat.id;
          }
        }

        const expense = await tx.expense.create({
          data: {
            companyId,
            categoryId,
            paymentAccountId: input.paymentAccountId,
            title: input.title,
            description: input.description || null,
            amount: input.amount,
            expenseDate: input.expenseDate ? new Date(input.expenseDate) : new Date(),
            paymentMethod: input.paymentMethod || 'CASH',
            referenceNumber: input.referenceNumber || null,
            receiptUrl: input.receiptUrl || null,
            status: 'PAID',
            createdBy: userId,
          },
        });

        await tx.financialTransaction.create({
          data: {
            companyId,
            accountId: input.paymentAccountId,
            type: 'EXPENSE',
            direction: 'DEBIT',
            amount: input.amount,
            referenceType: 'EXPENSE',
            referenceId: expense.id,
            description: `Expense: ${expense.title}`,
            transactionDate: expense.expenseDate,
            createdBy: userId,
          },
        });

        await tx.paymentAccount.update({
          where: { id: input.paymentAccountId },
          data: { currentBalance: { decrement: input.amount } },
        });

        await createAuditLog({
          companyId,
          userId,
          action: 'EXPENSE_CREATED',
          entity: 'Expense',
          entityId: expense.id,
          metadata: { title: input.title, amount: input.amount, paymentAccountId: input.paymentAccountId },
        });

        return expense;
      });
    }

    // RAW SQL fallback
    const accRows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM payment_accounts WHERE id = $1 AND "companyId" = $2 AND "isActive" = true LIMIT 1`,
      input.paymentAccountId, companyId
    );
    if (!accRows.length) throw new Error('Payment account not found or inactive');
    const account = accRows[0];

    if (Number(account.currentBalance) < Number(input.amount)) {
      throw new Error(`Insufficient account balance (₹${Number(account.currentBalance).toFixed(2)}) for expense ₹${input.amount}`);
    }

    const expenseId = 'exp_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    const expenseDate = input.expenseDate ? new Date(input.expenseDate) : new Date();

    await prisma.$executeRawUnsafe(
      `INSERT INTO expenses (id, "companyId", "categoryId", "paymentAccountId", title, description, amount, "expenseDate", "paymentMethod", "referenceNumber", "receiptUrl", status, "createdBy", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PAID', $12, NOW(), NOW())`,
      expenseId, companyId, input.categoryId || null, input.paymentAccountId, input.title, input.description || null, Number(input.amount), expenseDate, input.paymentMethod || 'CASH', input.referenceNumber || null, input.receiptUrl || null, userId
    );

    const txId = 'tx_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    await prisma.$executeRawUnsafe(
      `INSERT INTO financial_transactions (id, "companyId", "accountId", type, direction, amount, "referenceType", "referenceId", description, "transactionDate", "createdBy", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
      txId, companyId, input.paymentAccountId, 'EXPENSE', 'DEBIT', Number(input.amount), 'EXPENSE', expenseId, `Expense: ${input.title}`, expenseDate, userId
    );

    await prisma.$executeRawUnsafe(
      `UPDATE payment_accounts SET "currentBalance" = "currentBalance" - $1, "updatedAt" = NOW() WHERE id = $2`,
      Number(input.amount), input.paymentAccountId
    );

    await createAuditLog({
      companyId,
      userId,
      action: 'EXPENSE_CREATED',
      entity: 'Expense',
      entityId: expenseId,
      metadata: { title: input.title, amount: input.amount, paymentAccountId: input.paymentAccountId },
    });

    return { id: expenseId, title: input.title, amount: input.amount };
  }

  async voidExpense(companyId: string, userId: string, expenseId: string) {
    await ensureFinanceTablesExist();
    if (db.expense && db.financialTransaction && db.paymentAccount) {
      return db.$transaction(async (tx: any) => {
        const expense = await tx.expense.findFirst({
          where: { id: expenseId, companyId },
        });
        if (!expense) throw new Error('Expense record not found');
        if (expense.status === 'VOID') throw new Error('Expense is already voided');

        const updated = await tx.expense.update({
          where: { id: expenseId },
          data: { status: 'VOID' },
        });

        await tx.financialTransaction.create({
          data: {
            companyId,
            accountId: expense.paymentAccountId,
            type: 'EXPENSE',
            direction: 'CREDIT',
            amount: expense.amount,
            referenceType: 'EXPENSE_VOID',
            referenceId: expense.id,
            description: `Reversal for Voided Expense: ${expense.title}`,
            transactionDate: new Date(),
            createdBy: userId,
          },
        });

        await tx.paymentAccount.update({
          where: { id: expense.paymentAccountId },
          data: { currentBalance: { increment: expense.amount } },
        });

        await createAuditLog({
          companyId,
          userId,
          action: 'EXPENSE_VOIDED',
          entity: 'Expense',
          entityId: expenseId,
          metadata: { title: expense.title, amount: expense.amount },
        });

        return updated;
      });
    }

    // RAW SQL fallback
    const expRows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM expenses WHERE id = $1 AND "companyId" = $2 LIMIT 1`,
      expenseId, companyId
    );
    if (!expRows.length) throw new Error('Expense record not found');
    const expense = expRows[0];
    if (expense.status === 'VOID') throw new Error('Expense is already voided');

    await prisma.$executeRawUnsafe(
      `UPDATE expenses SET status = 'VOID', "updatedAt" = NOW() WHERE id = $1`,
      expenseId
    );

    const txId = 'tx_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    await prisma.$executeRawUnsafe(
      `INSERT INTO financial_transactions (id, "companyId", "accountId", type, direction, amount, "referenceType", "referenceId", description, "transactionDate", "createdBy", "createdAt")
       VALUES ($1, $2, $3, 'EXPENSE', 'CREDIT', $4, 'EXPENSE_VOID', $5, $6, NOW(), $7, NOW())`,
      txId, companyId, expense.paymentAccountId, Number(expense.amount), expense.id, `Reversal for Voided Expense: ${expense.title}`, userId
    );

    await prisma.$executeRawUnsafe(
      `UPDATE payment_accounts SET "currentBalance" = "currentBalance" + $1, "updatedAt" = NOW() WHERE id = $2`,
      Number(expense.amount), expense.paymentAccountId
    );

    await createAuditLog({
      companyId,
      userId,
      action: 'EXPENSE_VOIDED',
      entity: 'Expense',
      entityId: expenseId,
      metadata: { title: expense.title, amount: expense.amount },
    });

    return { id: expenseId, status: 'VOID' };
  }

  async listExpenses(companyId: string, options?: { page?: number; limit?: number; categoryId?: string; status?: string }) {
    await ensureFinanceTablesExist();
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    if (db.expense) {
      const where: any = { companyId };
      if (options?.categoryId) where.categoryId = options.categoryId;
      if (options?.status) where.status = options.status;

      const [expenses, total, stats] = await Promise.all([
        db.expense.findMany({
          where,
          include: {
            category: { select: { id: true, name: true } },
            paymentAccount: { select: { id: true, name: true, type: true } },
            creator: { select: { id: true, name: true } },
          },
          orderBy: { expenseDate: 'desc' },
          skip,
          take: limit,
        }),
        db.expense.count({ where }),
        db.expense.aggregate({
          where: { companyId, status: 'PAID' },
          _sum: { amount: true },
        }),
      ]);

      return {
        expenses,
        totalExpensesAmount: stats._sum.amount || 0,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    }

    const expenses: any[] = await prisma.$queryRawUnsafe(
      `SELECT e.*, ec.name as "categoryName", pa.name as "accountName", pa.type as "accountType"
       FROM expenses e
       LEFT JOIN expense_categories ec ON e."categoryId" = ec.id
       LEFT JOIN payment_accounts pa ON e."paymentAccountId" = pa.id
       WHERE e."companyId" = $1
       ORDER BY e."expenseDate" DESC
       OFFSET $2 LIMIT $3`,
      companyId, skip, limit
    );
    const countRes: any[] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int as count FROM expenses WHERE "companyId" = $1`,
      companyId
    );
    const sumRes: any[] = await prisma.$queryRawUnsafe(
      `SELECT COALESCE(SUM(amount), 0)::float as sum FROM expenses WHERE "companyId" = $1 AND status = 'PAID'`,
      companyId
    );

    const total = countRes[0]?.count || 0;

    return {
      expenses,
      totalExpensesAmount: sumRes[0]?.sum || 0,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // --- ACCOUNT TRANSFERS ---
  async recordAccountTransfer(companyId: string, userId: string, input: RecordAccountTransferInput) {
    await ensureFinanceTablesExist();
    if (db.accountTransfer && db.paymentAccount && db.financialTransaction) {
      return db.$transaction(async (tx: any) => {
        const fromAccount = await tx.paymentAccount.findFirst({
          where: { id: input.fromAccountId, companyId, isActive: true },
        });
        const toAccount = await tx.paymentAccount.findFirst({
          where: { id: input.toAccountId, companyId, isActive: true },
        });

        if (!fromAccount) throw new Error('Source payment account not found or inactive');
        if (!toAccount) throw new Error('Destination payment account not found or inactive');

        if (fromAccount.currentBalance < input.amount) {
          throw new Error(`Insufficient balance in ${fromAccount.name} (₹${fromAccount.currentBalance.toFixed(2)}) for transfer ₹${input.amount}`);
        }

        const transfer = await tx.accountTransfer.create({
          data: {
            companyId,
            fromAccountId: input.fromAccountId,
            toAccountId: input.toAccountId,
            amount: input.amount,
            referenceNumber: input.referenceNumber || null,
            notes: input.notes || null,
            transferDate: input.transferDate ? new Date(input.transferDate) : new Date(),
            createdBy: userId,
          },
        });

        await tx.financialTransaction.create({
          data: {
            companyId,
            accountId: input.fromAccountId,
            type: 'ACCOUNT_TRANSFER_OUT',
            direction: 'DEBIT',
            amount: input.amount,
            referenceType: 'ACCOUNT_TRANSFER',
            referenceId: transfer.id,
            description: `Internal Transfer to ${toAccount.name}`,
            transactionDate: transfer.transferDate,
            createdBy: userId,
          },
        });

        await tx.financialTransaction.create({
          data: {
            companyId,
            accountId: input.toAccountId,
            type: 'ACCOUNT_TRANSFER_IN',
            direction: 'CREDIT',
            amount: input.amount,
            referenceType: 'ACCOUNT_TRANSFER',
            referenceId: transfer.id,
            description: `Internal Transfer from ${fromAccount.name}`,
            transactionDate: transfer.transferDate,
            createdBy: userId,
          },
        });

        await tx.paymentAccount.update({
          where: { id: input.fromAccountId },
          data: { currentBalance: { decrement: input.amount } },
        });
        await tx.paymentAccount.update({
          where: { id: input.toAccountId },
          data: { currentBalance: { increment: input.amount } },
        });

        await createAuditLog({
          companyId,
          userId,
          action: 'ACCOUNT_TRANSFER_CREATED',
          entity: 'AccountTransfer',
          entityId: transfer.id,
          metadata: { amount: input.amount, fromAccount: fromAccount.name, toAccount: toAccount.name },
        });

        return transfer;
      });
    }

    // RAW SQL fallback
    const fromRows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM payment_accounts WHERE id = $1 AND "companyId" = $2 AND "isActive" = true LIMIT 1`,
      input.fromAccountId, companyId
    );
    const toRows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM payment_accounts WHERE id = $1 AND "companyId" = $2 AND "isActive" = true LIMIT 1`,
      input.toAccountId, companyId
    );

    if (!fromRows.length) throw new Error('Source payment account not found or inactive');
    if (!toRows.length) throw new Error('Destination payment account not found or inactive');
    const fromAccount = fromRows[0];
    const toAccount = toRows[0];

    if (Number(fromAccount.currentBalance) < Number(input.amount)) {
      throw new Error(`Insufficient balance in ${fromAccount.name} (₹${Number(fromAccount.currentBalance).toFixed(2)}) for transfer ₹${input.amount}`);
    }

    const transferId = 'trf_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    const transferDate = input.transferDate ? new Date(input.transferDate) : new Date();

    await prisma.$executeRawUnsafe(
      `INSERT INTO account_transfers (id, "companyId", "fromAccountId", "toAccountId", amount, "referenceNumber", notes, "transferDate", "createdBy", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      transferId, companyId, input.fromAccountId, input.toAccountId, Number(input.amount), input.referenceNumber || null, input.notes || null, transferDate, userId
    );

    const txIdOut = 'tx_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    await prisma.$executeRawUnsafe(
      `INSERT INTO financial_transactions (id, "companyId", "accountId", type, direction, amount, "referenceType", "referenceId", description, "transactionDate", "createdBy", "createdAt")
       VALUES ($1, $2, $3, 'ACCOUNT_TRANSFER_OUT', 'DEBIT', $4, 'ACCOUNT_TRANSFER', $5, $6, $7, $8, NOW())`,
      txIdOut, companyId, input.fromAccountId, Number(input.amount), transferId, `Internal Transfer to ${toAccount.name}`, transferDate, userId
    );

    const txIdIn = 'tx_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    await prisma.$executeRawUnsafe(
      `INSERT INTO financial_transactions (id, "companyId", "accountId", type, direction, amount, "referenceType", "referenceId", description, "transactionDate", "createdBy", "createdAt")
       VALUES ($1, $2, $3, 'ACCOUNT_TRANSFER_IN', 'CREDIT', $4, 'ACCOUNT_TRANSFER', $5, $6, $7, $8, NOW())`,
      txIdIn, companyId, input.toAccountId, Number(input.amount), transferId, `Internal Transfer from ${fromAccount.name}`, transferDate, userId
    );

    await prisma.$executeRawUnsafe(
      `UPDATE payment_accounts SET "currentBalance" = "currentBalance" - $1, "updatedAt" = NOW() WHERE id = $2`,
      Number(input.amount), input.fromAccountId
    );
    await prisma.$executeRawUnsafe(
      `UPDATE payment_accounts SET "currentBalance" = "currentBalance" + $1, "updatedAt" = NOW() WHERE id = $2`,
      Number(input.amount), input.toAccountId
    );

    await createAuditLog({
      companyId,
      userId,
      action: 'ACCOUNT_TRANSFER_CREATED',
      entity: 'AccountTransfer',
      entityId: transferId,
      metadata: { amount: input.amount, fromAccount: fromAccount.name, toAccount: toAccount.name },
    });

    return { id: transferId, amount: input.amount };
  }

  async listAccountTransfers(companyId: string, options?: { page?: number; limit?: number }) {
    await ensureFinanceTablesExist();
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    if (db.accountTransfer) {
      const [transfers, total] = await Promise.all([
        db.accountTransfer.findMany({
          where: { companyId },
          include: {
            fromAccount: { select: { id: true, name: true, type: true } },
            toAccount: { select: { id: true, name: true, type: true } },
            creator: { select: { id: true, name: true } },
          },
          orderBy: { transferDate: 'desc' },
          skip,
          take: limit,
        }),
        db.accountTransfer.count({ where: { companyId } }),
      ]);

      return {
        transfers,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    }

    const transfers: any[] = await prisma.$queryRawUnsafe(
      `SELECT at.*, fa.name as "fromAccountName", ta.name as "toAccountName"
       FROM account_transfers at
       LEFT JOIN payment_accounts fa ON at."fromAccountId" = fa.id
       LEFT JOIN payment_accounts ta ON at."toAccountId" = ta.id
       WHERE at."companyId" = $1
       ORDER BY at."transferDate" DESC
       OFFSET $2 LIMIT $3`,
      companyId, skip, limit
    );
    const countRes: any[] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int as count FROM account_transfers WHERE "companyId" = $1`,
      companyId
    );

    return {
      transfers,
      pagination: { total: countRes[0]?.count || 0, page, limit, totalPages: Math.ceil((countRes[0]?.count || 0) / limit) },
    };
  }

  // --- OUTSTANDING RECEIVABLES & PAYABLES ---
  async getReceivables(companyId: string) {
    if (db.customer) {
      const customers = await db.customer.findMany({
        where: { companyId, status: 'ACTIVE' },
        include: {
          sales: {
            select: { id: true, saleNumber: true, totalAmount: true, paidAmount: true, dueAmount: true, paymentStatus: true, saleDate: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      const formatted = customers
        .map((c: any) => {
          const totalSales = c.sales.reduce((acc: number, s: any) => acc + s.totalAmount, 0);
          const totalPaid = c.sales.reduce((acc: number, s: any) => acc + (s.paidAmount || 0), 0);
          const outstanding = Math.max(0, totalSales - totalPaid);

          return {
            customer: { id: c.id, name: c.name, customerCode: c.customerCode, phone: c.phone, email: c.email },
            totalSales,
            totalPaid,
            outstanding,
            unpaidSalesCount: c.sales.filter((s: any) => s.dueAmount > 0.01).length,
          };
        })
        .filter((c: any) => c.outstanding > 0 || c.totalSales > 0);

      const totalReceivables = formatted.reduce((acc: number, c: any) => acc + c.outstanding, 0);

      return {
        receivables: formatted,
        totalReceivables,
      };
    }

    return { receivables: [], totalReceivables: 0 };
  }

  async getPayables(companyId: string) {
    if (db.supplier) {
      const suppliers = await db.supplier.findMany({
        where: { companyId, status: 'ACTIVE' },
        include: {
          purchases: {
            select: { id: true, purchaseNumber: true, totalAmount: true, paidAmount: true, dueAmount: true, paymentStatus: true, purchaseDate: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      const formatted = suppliers
        .map((s: any) => {
          const totalPurchases = s.purchases.reduce((acc: number, p: any) => acc + p.totalAmount, 0);
          const totalPaid = s.purchases.reduce((acc: number, p: any) => acc + (p.paidAmount || 0), 0);
          const outstanding = Math.max(0, totalPurchases - totalPaid);

          return {
            supplier: { id: s.id, name: s.name, supplierCode: s.supplierCode, phone: s.phone, email: s.email },
            totalPurchases,
            totalPaid,
            outstanding,
            unpaidPurchasesCount: s.purchases.filter((p: any) => p.dueAmount > 0.01).length,
          };
        })
        .filter((s: any) => s.outstanding > 0 || s.totalPurchases > 0);

      const totalPayables = formatted.reduce((acc: number, s: any) => acc + s.outstanding, 0);

      return {
        payables: formatted,
        totalPayables,
      };
    }

    return { payables: [], totalPayables: 0 };
  }

  // --- FINANCIAL DASHBOARD ---
  async getFinanceDashboard(companyId: string, startDate?: string, endDate?: string) {
    await this.getOrCreateDefaultCashAccount(companyId);

    let accounts: any[] = [];
    let recentTransactions: any[] = [];
    let totalMoneyReceived = 0;
    let totalSupplierPaid = 0;
    let totalExpenses = 0;

    if (db.paymentAccount) {
      accounts = await db.paymentAccount.findMany({ where: { companyId, isActive: true } });
    } else {
      accounts = await prisma.$queryRawUnsafe(
        `SELECT * FROM payment_accounts WHERE "companyId" = $1 AND "isActive" = true ORDER BY "createdAt" ASC`,
        companyId
      );
    }

    if (db.financialTransaction) {
      const dateWhere: any = { companyId };
      if (startDate || endDate) {
        dateWhere.transactionDate = {};
        if (startDate) dateWhere.transactionDate.gte = new Date(startDate);
        if (endDate) dateWhere.transactionDate.lte = new Date(endDate);
      }
      recentTransactions = await db.financialTransaction.findMany({
        where: dateWhere,
        include: {
          account: { select: { name: true, type: true } },
          creator: { select: { name: true } },
        },
        orderBy: { transactionDate: 'desc' },
        take: 15,
      });
    } else {
      recentTransactions = await prisma.$queryRawUnsafe(
        `SELECT ft.*, pa.name as "accountName", pa.type as "accountType", u.name as "creatorName"
         FROM financial_transactions ft
         LEFT JOIN payment_accounts pa ON ft."accountId" = pa.id
         LEFT JOIN users u ON ft."createdBy" = u.id
         WHERE ft."companyId" = $1
         ORDER BY ft."transactionDate" DESC LIMIT 15`,
        companyId
      );
    }

    if (db.customerPayment) {
      const custAgg = await db.customerPayment.aggregate({ where: { companyId }, _sum: { amount: true } });
      totalMoneyReceived = custAgg._sum.amount || 0;
    } else {
      const res: any[] = await prisma.$queryRawUnsafe(
        `SELECT COALESCE(SUM(amount), 0)::float as sum FROM customer_payments WHERE "companyId" = $1`,
        companyId
      );
      totalMoneyReceived = res[0]?.sum || 0;
    }

    if (db.supplierPayment) {
      const suppAgg = await db.supplierPayment.aggregate({ where: { companyId }, _sum: { amount: true } });
      totalSupplierPaid = suppAgg._sum.amount || 0;
    } else {
      const res: any[] = await prisma.$queryRawUnsafe(
        `SELECT COALESCE(SUM(amount), 0)::float as sum FROM supplier_payments WHERE "companyId" = $1`,
        companyId
      );
      totalSupplierPaid = res[0]?.sum || 0;
    }

    if (db.expense) {
      const expAgg = await db.expense.aggregate({ where: { companyId, status: 'PAID' }, _sum: { amount: true } });
      totalExpenses = expAgg._sum.amount || 0;
    } else {
      const res: any[] = await prisma.$queryRawUnsafe(
        `SELECT COALESCE(SUM(amount), 0)::float as sum FROM expenses WHERE "companyId" = $1 AND status = 'PAID'`,
        companyId
      );
      totalExpenses = res[0]?.sum || 0;
    }

    const [receivablesData, payablesData] = await Promise.all([
      this.getReceivables(companyId),
      this.getPayables(companyId),
    ]);

    const totalMoneyPaid = totalSupplierPaid + totalExpenses;
    const netCashFlow = totalMoneyReceived - totalMoneyPaid;
    const totalLiquidCash = accounts.reduce((acc: number, a: any) => acc + Number(a.currentBalance || 0), 0);

    return {
      totalLiquidCash,
      totalMoneyReceived,
      totalMoneyPaid,
      totalSupplierPaid,
      totalExpenses,
      netCashFlow,
      totalReceivables: receivablesData.totalReceivables,
      totalPayables: payablesData.totalPayables,
      accounts,
      recentTransactions,
    };
  }
}

export const financeService = new FinanceService();

