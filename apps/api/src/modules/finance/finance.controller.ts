import { Request, Response, NextFunction } from 'express';
import { financeService } from './finance.service.js';
import { financeReconciliationService } from './financeReconciliation.service.js';

export async function getFinanceDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate } = req.query;
    const data = await financeService.getFinanceDashboard(
      req.tenantId!,
      startDate as string,
      endDate as string
    );
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

// PAYMENT ACCOUNTS
export async function getAccounts(req: Request, res: Response, next: NextFunction) {
  try {
    const accounts = await financeService.listPaymentAccounts(req.tenantId!);
    return res.json({ success: true, data: accounts });
  } catch (error) {
    next(error);
  }
}

export async function createAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const account = await financeService.createPaymentAccount(req.tenantId!, req.user!.id, req.body);
    return res.status(201).json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
}

export async function updateAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const account = await financeService.updatePaymentAccount(req.tenantId!, req.user!.id, req.params.id, req.body);
    return res.json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
}

export async function deleteAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await financeService.deletePaymentAccount(req.tenantId!, req.user!.id, req.params.id);
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getAccountTransactions(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await financeService.getAccountTransactions(req.tenantId!, req.params.id, {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
    });
    return res.json({ success: true, data: result.transactions, account: result.account, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
}

// CUSTOMER PAYMENTS
export async function getCustomerPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await financeService.listCustomerPayments(req.tenantId!, {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      customerId: req.query.customerId as string,
      saleId: req.query.saleId as string,
    });
    return res.json({ success: true, data: result.payments, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
}

export async function recordCustomerPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const payment = await financeService.recordCustomerPayment(req.tenantId!, req.user!.id, req.body);
    return res.status(201).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
}

// SUPPLIER PAYMENTS
export async function getSupplierPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await financeService.listSupplierPayments(req.tenantId!, {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      supplierId: req.query.supplierId as string,
      purchaseId: req.query.purchaseId as string,
    });
    return res.json({ success: true, data: result.payments, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
}

export async function recordSupplierPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const payment = await financeService.recordSupplierPayment(req.tenantId!, req.user!.id, req.body);
    return res.status(201).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
}

// EXPENSES & CATEGORIES
export async function getExpenseCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await financeService.listExpenseCategories(req.tenantId!);
    return res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
}

export async function createExpenseCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await financeService.createExpenseCategory(req.tenantId!, req.user!.id, req.body);
    return res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
}

export async function getExpenses(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await financeService.listExpenses(req.tenantId!, {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      categoryId: req.query.categoryId as string,
      status: req.query.status as string,
    });
    return res.json({
      success: true,
      data: result.expenses,
      totalExpensesAmount: result.totalExpensesAmount,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function createExpense(req: Request, res: Response, next: NextFunction) {
  try {
    const expense = await financeService.createExpense(req.tenantId!, req.user!.id, req.body);
    return res.status(201).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
}

export async function voidExpense(req: Request, res: Response, next: NextFunction) {
  try {
    const expense = await financeService.voidExpense(req.tenantId!, req.user!.id, req.params.id);
    return res.json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
}

// TRANSFERS
export async function getTransfers(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await financeService.listAccountTransfers(req.tenantId!, {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
    });
    return res.json({ success: true, data: result.transfers, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
}

export async function recordTransfer(req: Request, res: Response, next: NextFunction) {
  try {
    const transfer = await financeService.recordAccountTransfer(req.tenantId!, req.user!.id, req.body);
    return res.status(201).json({ success: true, data: transfer });
  } catch (error) {
    next(error);
  }
}

// RECEIVABLES & PAYABLES
export async function getReceivables(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await financeService.getReceivables(req.tenantId!);
    return res.json({ success: true, data: data.receivables, totalReceivables: data.totalReceivables });
  } catch (error) {
    next(error);
  }
}

export async function getPayables(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await financeService.getPayables(req.tenantId!);
    return res.json({ success: true, data: data.payables, totalPayables: data.totalPayables });
  } catch (error) {
    next(error);
  }
}

// RECONCILIATION & DATA INTEGRITY
export async function reconcileAccounts(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await financeReconciliationService.reconcilePaymentAccounts(req.tenantId!);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function reconcileSales(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await financeReconciliationService.reconcileCustomerPaymentsAndSales(req.tenantId!);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function reconcilePurchases(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await financeReconciliationService.reconcileSupplierPaymentsAndPurchases(req.tenantId!);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function auditOrphans(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await financeReconciliationService.auditOrphanAndDuplicateTransactions(req.tenantId!);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getFinancialHealthCheck(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await financeReconciliationService.getFinancialHealthCheck(req.tenantId!);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function fixAccountBalance(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await financeReconciliationService.fixPaymentAccountBalance(req.tenantId!, req.user!.id, req.params.id);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function fixSalePaymentStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await financeReconciliationService.fixSalePaymentStatus(req.tenantId!, req.user!.id, req.params.id);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function fixPurchasePaymentStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await financeReconciliationService.fixPurchasePaymentStatus(req.tenantId!, req.user!.id, req.params.id);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
