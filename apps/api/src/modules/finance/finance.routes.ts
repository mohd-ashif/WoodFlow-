import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { requirePermission } from '../../middleware/rbac.js';
import * as financeController from './finance.controller.js';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

// Dashboard
router.get('/dashboard', requirePermission('finance.view'), financeController.getFinanceDashboard);

// Accounts
router.get('/accounts', requirePermission('finance.view'), financeController.getAccounts);
router.post('/accounts', requirePermission('finance.manage'), financeController.createAccount);
router.patch('/accounts/:id', requirePermission('finance.manage'), financeController.updateAccount);
router.delete('/accounts/:id', requirePermission('finance.manage'), financeController.deleteAccount);
router.get('/accounts/:id/transactions', requirePermission('finance.view'), financeController.getAccountTransactions);

// Customer Payments
router.get('/customer-payments', requirePermission('finance.view'), financeController.getCustomerPayments);
router.post('/customer-payments', requirePermission('finance.manage'), financeController.recordCustomerPayment);

// Supplier Payments
router.get('/supplier-payments', requirePermission('finance.view'), financeController.getSupplierPayments);
router.post('/supplier-payments', requirePermission('finance.manage'), financeController.recordSupplierPayment);

// Expense Categories & Expenses
router.get('/expense-categories', requirePermission('finance.view'), financeController.getExpenseCategories);
router.post('/expense-categories', requirePermission('finance.manage'), financeController.createExpenseCategory);

router.get('/expenses', requirePermission('finance.view'), financeController.getExpenses);
router.post('/expenses', requirePermission('finance.manage'), financeController.createExpense);
router.post('/expenses/:id/void', requirePermission('finance.manage'), financeController.voidExpense);

// Transfers
router.get('/transfers', requirePermission('finance.view'), financeController.getTransfers);
router.post('/transfers', requirePermission('finance.manage'), financeController.recordTransfer);

// Receivables & Payables
router.get('/receivables', requirePermission('finance.view'), financeController.getReceivables);
router.get('/payables', requirePermission('finance.view'), financeController.getPayables);

// Reconciliation & Audit
router.get('/reconciliation/health', requirePermission('finance.view'), financeController.getFinancialHealthCheck);
router.get('/reconciliation/accounts', requirePermission('finance.view'), financeController.reconcileAccounts);
router.get('/reconciliation/sales', requirePermission('finance.view'), financeController.reconcileSales);
router.get('/reconciliation/purchases', requirePermission('finance.view'), financeController.reconcilePurchases);
router.get('/reconciliation/orphans', requirePermission('finance.view'), financeController.auditOrphans);

router.post('/reconciliation/accounts/:id/fix', requirePermission('finance.manage'), financeController.fixAccountBalance);
router.post('/reconciliation/sales/:id/fix', requirePermission('finance.manage'), financeController.fixSalePaymentStatus);
router.post('/reconciliation/purchases/:id/fix', requirePermission('finance.manage'), financeController.fixPurchasePaymentStatus);

export default router;
