import { prisma } from '../../config/prisma.js';
import { createAuditLog } from '../audit/audit.service.js';

const db = prisma as any;

export class FinanceReconciliationService {
  /**
   * 1. RECONCILE PAYMENT ACCOUNTS
   * Compares stored `currentBalance` vs (Opening Balance + Total Credits - Total Debits)
   */
  async reconcilePaymentAccounts(companyId: string) {
    let accounts: any[] = [];
    if (db.paymentAccount) {
      accounts = await db.paymentAccount.findMany({ where: { companyId } });
    } else {
      accounts = await prisma.$queryRawUnsafe(
        `SELECT * FROM payment_accounts WHERE "companyId" = $1 ORDER BY name ASC`,
        companyId
      );
    }

    const reconciliationResults = [];
    let matchedCount = 0;
    let mismatchedCount = 0;
    let totalDifference = 0;

    for (const acc of accounts) {
      const openingBalance = Number(acc.openingBalance || 0);
      const storedBalance = Number(acc.currentBalance || 0);

      // Fetch credits & debits from financial_transactions
      let totalCredits = 0;
      let totalDebits = 0;

      if (db.financialTransaction) {
        const creditAgg = await db.financialTransaction.aggregate({
          where: { companyId, accountId: acc.id, direction: 'CREDIT', type: { not: 'OPENING_BALANCE' } },
          _sum: { amount: true },
        });
        const debitAgg = await db.financialTransaction.aggregate({
          where: { companyId, accountId: acc.id, direction: 'DEBIT' },
          _sum: { amount: true },
        });
        totalCredits = creditAgg._sum.amount || 0;
        totalDebits = debitAgg._sum.amount || 0;
      } else {
        const creditRes: any[] = await prisma.$queryRawUnsafe(
          `SELECT COALESCE(SUM(amount), 0)::float as sum
           FROM financial_transactions
           WHERE "companyId" = $1 AND "accountId" = $2 AND direction = 'CREDIT' AND type != 'OPENING_BALANCE'`,
          companyId, acc.id
        );
        const debitRes: any[] = await prisma.$queryRawUnsafe(
          `SELECT COALESCE(SUM(amount), 0)::float as sum
           FROM financial_transactions
           WHERE "companyId" = $1 AND "accountId" = $2 AND direction = 'DEBIT'`,
          companyId, acc.id
        );
        totalCredits = creditRes[0]?.sum || 0;
        totalDebits = debitRes[0]?.sum || 0;
      }

      const expectedBalance = openingBalance + totalCredits - totalDebits;
      const difference = Number((storedBalance - expectedBalance).toFixed(2));
      const status = Math.abs(difference) < 0.01 ? 'MATCHED' : 'MISMATCH';

      if (status === 'MATCHED') matchedCount++;
      else {
        mismatchedCount++;
        totalDifference += Math.abs(difference);
      }

      reconciliationResults.push({
        accountId: acc.id,
        accountName: acc.name,
        type: acc.type,
        accountNumber: acc.accountNumber,
        openingBalance,
        totalCredits,
        totalDebits,
        calculatedBalance: expectedBalance,
        storedBalance,
        difference,
        status,
      });
    }

    return {
      summary: {
        totalAccountsChecked: accounts.length,
        matchedCount,
        mismatchedCount,
        totalDifference: Number(totalDifference.toFixed(2)),
        reconciliationStatus: mismatchedCount === 0 ? 'MATCHED' : 'MISMATCH',
      },
      accounts: reconciliationResults,
    };
  }

  /**
   * 2. RECONCILE CUSTOMER PAYMENTS & SALES OUTSTANDING
   * Verifies Sale.paidAmount, Sale.dueAmount, Sale.paymentStatus against sum of customer_payments
   */
  async reconcileCustomerPaymentsAndSales(companyId: string) {
    let sales: any[] = [];
    if (db.sale) {
      sales = await db.sale.findMany({
        where: { companyId },
        include: {
          customer: { select: { id: true, name: true, customerCode: true } },
          payments: true,
        },
      });
    } else {
      sales = await prisma.$queryRawUnsafe(
        `SELECT s.*, c.name as "customerName", c."customerCode"
         FROM sales s
         LEFT JOIN customers c ON s."customerId" = c.id
         WHERE s."companyId" = $1`,
        companyId
      );
    }

    const salesReconciliation = [];
    let matchedCount = 0;
    let mismatchedCount = 0;

    for (const sale of sales) {
      let paidSum = 0;
      if (sale.payments && Array.isArray(sale.payments)) {
        paidSum = sale.payments.reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);
      } else {
        const payRes: any[] = await prisma.$queryRawUnsafe(
          `SELECT COALESCE(SUM(amount), 0)::float as sum FROM customer_payments WHERE "saleId" = $1 AND "companyId" = $2`,
          sale.id, companyId
        );
        paidSum = payRes[0]?.sum || 0;
      }

      const totalAmount = Number(sale.totalAmount || 0);
      const expectedPaidAmount = Number(paidSum.toFixed(2));
      const expectedDueAmount = Math.max(0, Number((totalAmount - expectedPaidAmount).toFixed(2)));

      let expectedPaymentStatus = 'PARTIALLY_PAID';
      if (expectedDueAmount <= 0.01) {
        expectedPaymentStatus = 'PAID';
      } else if (expectedPaidAmount <= 0) {
        expectedPaymentStatus = 'UNPAID';
      }

      const storedPaidAmount = Number(sale.paidAmount || 0);
      const storedDueAmount = Number(sale.dueAmount || 0);
      const storedPaymentStatus = sale.paymentStatus || 'UNPAID';

      const paidDiff = Math.abs(storedPaidAmount - expectedPaidAmount);
      const dueDiff = Math.abs(storedDueAmount - expectedDueAmount);
      const statusMatch = storedPaymentStatus === expectedPaymentStatus;

      const isMatched = paidDiff < 0.01 && dueDiff < 0.01 && statusMatch;
      const status = isMatched ? 'MATCHED' : 'MISMATCH';

      if (isMatched) matchedCount++;
      else mismatchedCount++;

      salesReconciliation.push({
        saleId: sale.id,
        saleNumber: sale.saleNumber,
        customerName: sale.customerName || sale.customer?.name || 'Walk-in Customer',
        totalAmount,
        storedPaidAmount,
        expectedPaidAmount,
        paidDifference: Number(paidDiff.toFixed(2)),
        storedDueAmount,
        expectedDueAmount,
        dueDifference: Number(dueDiff.toFixed(2)),
        storedPaymentStatus,
        expectedPaymentStatus,
        status,
      });
    }

    return {
      summary: {
        totalSalesChecked: sales.length,
        matchedCount,
        mismatchedCount,
        reconciliationStatus: mismatchedCount === 0 ? 'MATCHED' : 'MISMATCH',
      },
      sales: salesReconciliation,
    };
  }

  /**
   * 3. RECONCILE SUPPLIER PAYMENTS & PURCHASES OUTSTANDING
   */
  async reconcileSupplierPaymentsAndPurchases(companyId: string) {
    let purchases: any[] = [];
    if (db.purchase) {
      purchases = await db.purchase.findMany({
        where: { companyId },
        include: {
          supplier: { select: { id: true, name: true, supplierCode: true } },
          payments: true,
        },
      });
    } else {
      purchases = await prisma.$queryRawUnsafe(
        `SELECT p.*, s.name as "supplierName", s."supplierCode"
         FROM purchases p
         LEFT JOIN suppliers s ON p."supplierId" = s.id
         WHERE p."companyId" = $1`,
        companyId
      );
    }

    const purchasesReconciliation = [];
    let matchedCount = 0;
    let mismatchedCount = 0;

    for (const p of purchases) {
      let paidSum = 0;
      if (p.payments && Array.isArray(p.payments)) {
        paidSum = p.payments.reduce((acc: number, pay: any) => acc + Number(pay.amount || 0), 0);
      } else {
        const payRes: any[] = await prisma.$queryRawUnsafe(
          `SELECT COALESCE(SUM(amount), 0)::float as sum FROM supplier_payments WHERE "purchaseId" = $1 AND "companyId" = $2`,
          p.id, companyId
        );
        paidSum = payRes[0]?.sum || 0;
      }

      const totalAmount = Number(p.totalAmount || 0);
      const expectedPaidAmount = Number(paidSum.toFixed(2));
      const expectedDueAmount = Math.max(0, Number((totalAmount - expectedPaidAmount).toFixed(2)));

      let expectedPaymentStatus = 'PARTIALLY_PAID';
      if (expectedDueAmount <= 0.01) {
        expectedPaymentStatus = 'PAID';
      } else if (expectedPaidAmount <= 0) {
        expectedPaymentStatus = 'UNPAID';
      }

      const storedPaidAmount = Number(p.paidAmount || 0);
      const storedDueAmount = Number(p.dueAmount || 0);
      const storedPaymentStatus = p.paymentStatus || 'UNPAID';

      const paidDiff = Math.abs(storedPaidAmount - expectedPaidAmount);
      const dueDiff = Math.abs(storedDueAmount - expectedDueAmount);
      const statusMatch = storedPaymentStatus === expectedPaymentStatus;

      const isMatched = paidDiff < 0.01 && dueDiff < 0.01 && statusMatch;
      const status = isMatched ? 'MATCHED' : 'MISMATCH';

      if (isMatched) matchedCount++;
      else mismatchedCount++;

      purchasesReconciliation.push({
        purchaseId: p.id,
        purchaseNumber: p.purchaseNumber,
        supplierName: p.supplierName || p.supplier?.name || 'Direct Supplier',
        totalAmount,
        storedPaidAmount,
        expectedPaidAmount,
        paidDifference: Number(paidDiff.toFixed(2)),
        storedDueAmount,
        expectedDueAmount,
        dueDifference: Number(dueDiff.toFixed(2)),
        storedPaymentStatus,
        expectedPaymentStatus,
        status,
      });
    }

    return {
      summary: {
        totalPurchasesChecked: purchases.length,
        matchedCount,
        mismatchedCount,
        reconciliationStatus: mismatchedCount === 0 ? 'MATCHED' : 'MISMATCH',
      },
      purchases: purchasesReconciliation,
    };
  }

  /**
   * 4. AUDIT ORPHAN & DUPLICATE TRANSACTIONS
   */
  async auditOrphanAndDuplicateTransactions(companyId: string) {
    // 1. Orphan Customer Payments (no financial_transaction record)
    const orphanCustomerPayments: any[] = await prisma.$queryRawUnsafe(
      `SELECT cp.id, cp.amount, cp."paymentDate", cp."paymentAccountId"
       FROM customer_payments cp
       LEFT JOIN financial_transactions ft ON ft."referenceId" = cp.id AND ft."referenceType" = 'CUSTOMER_PAYMENT'
       WHERE cp."companyId" = $1 AND ft.id IS NULL`,
      companyId
    );

    // 2. Orphan Supplier Payments
    const orphanSupplierPayments: any[] = await prisma.$queryRawUnsafe(
      `SELECT sp.id, sp.amount, sp."paymentDate", sp."paymentAccountId"
       FROM supplier_payments sp
       LEFT JOIN financial_transactions ft ON ft."referenceId" = sp.id AND ft."referenceType" = 'SUPPLIER_PAYMENT'
       WHERE sp."companyId" = $1 AND ft.id IS NULL`,
      companyId
    );

    // 3. Orphan Expenses
    const orphanExpenses: any[] = await prisma.$queryRawUnsafe(
      `SELECT e.id, e.title, e.amount, e."expenseDate", e."paymentAccountId"
       FROM expenses e
       LEFT JOIN financial_transactions ft ON ft."referenceId" = e.id AND ft."referenceType" = 'EXPENSE'
       WHERE e."companyId" = $1 AND e.status = 'PAID' AND ft.id IS NULL`,
      companyId
    );

    // 4. Broken Account Transfers (transfer missing either DEBIT or CREDIT tx)
    const brokenAccountTransfers: any[] = await prisma.$queryRawUnsafe(
      `SELECT at.id, at.amount, at."transferDate", at."fromAccountId", at."toAccountId",
              COUNT(ft.id)::int as "txCount"
       FROM account_transfers at
       LEFT JOIN financial_transactions ft ON ft."referenceId" = at.id AND ft."referenceType" = 'ACCOUNT_TRANSFER'
       WHERE at."companyId" = $1
       GROUP BY at.id, at.amount, at."transferDate", at."fromAccountId", at."toAccountId"
       HAVING COUNT(ft.id) < 2`,
      companyId
    );

    // 5. Duplicate Customer Payments (same sale, amount, user within 60s)
    const duplicateCustomerPayments: any[] = await prisma.$queryRawUnsafe(
      `SELECT cp1.id as "id1", cp2.id as "id2", cp1."saleId", cp1.amount, cp1."createdBy", cp1."createdAt"
       FROM customer_payments cp1
       JOIN customer_payments cp2 ON cp1."saleId" = cp2."saleId"
                                 AND cp1.amount = cp2.amount
                                 AND cp1.id < cp2.id
                                 AND cp1."companyId" = cp2."companyId"
                                 AND ABS(EXTRACT(EPOCH FROM (cp1."createdAt" - cp2."createdAt"))) <= 60
       WHERE cp1."companyId" = $1`,
      companyId
    );

    // 6. Duplicate Expenses
    const duplicateExpenses: any[] = await prisma.$queryRawUnsafe(
      `SELECT e1.id as "id1", e2.id as "id2", e1.title, e1.amount, e1."createdBy", e1."createdAt"
       FROM expenses e1
       JOIN expenses e2 ON e1.title = e2.title
                       AND e1.amount = e2.amount
                       AND e1.id < e2.id
                       AND e1."companyId" = e2."companyId"
                       AND ABS(EXTRACT(EPOCH FROM (e1."createdAt" - e2."createdAt"))) <= 60
       WHERE e1."companyId" = $1`,
      companyId
    );

    const totalOrphans =
      orphanCustomerPayments.length +
      orphanSupplierPayments.length +
      orphanExpenses.length +
      brokenAccountTransfers.length;

    const totalDuplicates = duplicateCustomerPayments.length + duplicateExpenses.length;

    return {
      totalOrphans,
      totalDuplicates,
      orphanCustomerPayments,
      orphanSupplierPayments,
      orphanExpenses,
      brokenAccountTransfers,
      duplicateCustomerPayments,
      duplicateExpenses,
      status: totalOrphans === 0 && totalDuplicates === 0 ? 'CLEAN' : 'WARNING',
    };
  }

  /**
   * 5. COMPREHENSIVE FINANCIAL HEALTH CHECK
   */
  async getFinancialHealthCheck(companyId: string) {
    const [accountRec, saleRec, purchaseRec, anomalyAudit] = await Promise.all([
      this.reconcilePaymentAccounts(companyId),
      this.reconcileCustomerPaymentsAndSales(companyId),
      this.reconcileSupplierPaymentsAndPurchases(companyId),
      this.auditOrphanAndDuplicateTransactions(companyId),
    ]);

    const hasAccountMismatch = accountRec.summary.mismatchedCount > 0;
    const hasOrphanError = anomalyAudit.totalOrphans > 0;
    const hasPaymentMismatch = saleRec.summary.mismatchedCount > 0 || purchaseRec.summary.mismatchedCount > 0;

    let overallHealthStatus: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
    if (hasAccountMismatch || hasOrphanError) {
      overallHealthStatus = 'RED';
    } else if (hasPaymentMismatch || anomalyAudit.totalDuplicates > 0) {
      overallHealthStatus = 'YELLOW';
    }

    return {
      overallHealthStatus,
      accountReconciliation: accountRec.summary,
      salesReconciliation: saleRec.summary,
      purchasesReconciliation: purchaseRec.summary,
      anomalyAudit: {
        totalOrphans: anomalyAudit.totalOrphans,
        totalDuplicates: anomalyAudit.totalDuplicates,
        status: anomalyAudit.status,
      },
      healthCheckTimestamp: new Date().toISOString(),
    };
  }

  /**
   * 6. CONTROLLED RESYNC WORKFLOW: Fix Account Balance
   */
  async fixPaymentAccountBalance(companyId: string, userId: string, accountId: string) {
    const accRec = await this.reconcilePaymentAccounts(companyId);
    const target = accRec.accounts.find((a: any) => a.accountId === accountId);
    if (!target) throw new Error('Payment account not found');

    if (db.paymentAccount) {
      await db.paymentAccount.update({
        where: { id: accountId },
        data: { currentBalance: target.calculatedBalance },
      });
    } else {
      await prisma.$executeRawUnsafe(
        `UPDATE payment_accounts SET "currentBalance" = $1, "updatedAt" = NOW() WHERE id = $2 AND "companyId" = $3`,
        target.calculatedBalance, accountId, companyId
      );
    }

    await createAuditLog({
      companyId,
      userId,
      action: 'PAYMENT_ACCOUNT_RECONCILED',
      entity: 'PaymentAccount',
      entityId: accountId,
      metadata: {
        previousBalance: target.storedBalance,
        newBalance: target.calculatedBalance,
        difference: target.difference,
      },
    });

    return { success: true, accountId, newBalance: target.calculatedBalance };
  }

  /**
   * 7. CONTROLLED RESYNC WORKFLOW: Fix Sale Payment Status
   */
  async fixSalePaymentStatus(companyId: string, userId: string, saleId: string) {
    const saleRec = await this.reconcileCustomerPaymentsAndSales(companyId);
    const target = saleRec.sales.find((s: any) => s.saleId === saleId);
    if (!target) throw new Error('Sale order not found');

    if (db.sale) {
      await db.sale.update({
        where: { id: saleId },
        data: {
          paidAmount: target.expectedPaidAmount,
          dueAmount: target.expectedDueAmount,
          paymentStatus: target.expectedPaymentStatus,
        },
      });
    } else {
      await prisma.$executeRawUnsafe(
        `UPDATE sales
         SET "paidAmount" = $1, "dueAmount" = $2, "paymentStatus" = $3, "updatedAt" = NOW()
         WHERE id = $4 AND "companyId" = $5`,
        target.expectedPaidAmount, target.expectedDueAmount, target.expectedPaymentStatus, saleId, companyId
      );
    }

    await createAuditLog({
      companyId,
      userId,
      action: 'SALE_PAYMENT_RECONCILED',
      entity: 'Sale',
      entityId: saleId,
      metadata: {
        previousPaid: target.storedPaidAmount,
        newPaid: target.expectedPaidAmount,
        newDue: target.expectedDueAmount,
        newStatus: target.expectedPaymentStatus,
      },
    });

    return { success: true, saleId, expectedStatus: target.expectedPaymentStatus };
  }

  /**
   * 8. CONTROLLED RESYNC WORKFLOW: Fix Purchase Payment Status
   */
  async fixPurchasePaymentStatus(companyId: string, userId: string, purchaseId: string) {
    const pRec = await this.reconcileSupplierPaymentsAndPurchases(companyId);
    const target = pRec.purchases.find((p: any) => p.purchaseId === purchaseId);
    if (!target) throw new Error('Purchase order not found');

    if (db.purchase) {
      await db.purchase.update({
        where: { id: purchaseId },
        data: {
          paidAmount: target.expectedPaidAmount,
          dueAmount: target.expectedDueAmount,
          paymentStatus: target.expectedPaymentStatus,
        },
      });
    } else {
      await prisma.$executeRawUnsafe(
        `UPDATE purchases
         SET "paidAmount" = $1, "dueAmount" = $2, "paymentStatus" = $3, "updatedAt" = NOW()
         WHERE id = $4 AND "companyId" = $5`,
        target.expectedPaidAmount, target.expectedDueAmount, target.expectedPaymentStatus, purchaseId, companyId
      );
    }

    await createAuditLog({
      companyId,
      userId,
      action: 'PURCHASE_PAYMENT_RECONCILED',
      entity: 'Purchase',
      entityId: purchaseId,
      metadata: {
        previousPaid: target.storedPaidAmount,
        newPaid: target.expectedPaidAmount,
        newDue: target.expectedDueAmount,
        newStatus: target.expectedPaymentStatus,
      },
    });

    return { success: true, purchaseId, expectedStatus: target.expectedPaymentStatus };
  }
}

export const financeReconciliationService = new FinanceReconciliationService();
