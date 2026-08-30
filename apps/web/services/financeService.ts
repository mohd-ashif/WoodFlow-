import { fetchApi } from '../lib/api';
import {
  CreatePaymentAccountInput,
  UpdatePaymentAccountInput,
  RecordCustomerPaymentInput,
  RecordSupplierPaymentInput,
  CreateExpenseCategoryInput,
  CreateExpenseInput,
  RecordAccountTransferInput,
} from '@furniture-os/shared';

export const financeService = {
  // Dashboard
  async getDashboard(params?: { startDate?: string; endDate?: string }): Promise<{ success: boolean; data: any }> {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchApi(`/finance/dashboard${queryString}`);
  },

  // Accounts
  async getAccounts(): Promise<{ success: boolean; data: any[] }> {
    return fetchApi('/finance/accounts');
  },

  async createAccount(input: CreatePaymentAccountInput): Promise<{ success: boolean; data: any }> {
    return fetchApi('/finance/accounts', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateAccount(id: string, input: UpdatePaymentAccountInput): Promise<{ success: boolean; data: any }> {
    return fetchApi(`/finance/accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  async deleteAccount(id: string): Promise<{ success: boolean; data: any }> {
    return fetchApi(`/finance/accounts/${id}`, {
      method: 'DELETE',
    });
  },

  async getAccountTransactions(id: string, params?: { page?: number; limit?: number }): Promise<{ success: boolean; data: any[]; account: any; pagination: any }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchApi(`/finance/accounts/${id}/transactions${queryString}`);
  },

  // Customer Payments
  async getCustomerPayments(params?: { page?: number; limit?: number; customerId?: string; saleId?: string }): Promise<{ success: boolean; data: any[]; pagination: any }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.customerId) query.set('customerId', params.customerId);
    if (params?.saleId) query.set('saleId', params.saleId);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchApi(`/finance/customer-payments${queryString}`);
  },

  async recordCustomerPayment(input: RecordCustomerPaymentInput): Promise<{ success: boolean; data: any }> {
    return fetchApi('/finance/customer-payments', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  // Supplier Payments
  async getSupplierPayments(params?: { page?: number; limit?: number; supplierId?: string; purchaseId?: string }): Promise<{ success: boolean; data: any[]; pagination: any }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.supplierId) query.set('supplierId', params.supplierId);
    if (params?.purchaseId) query.set('purchaseId', params.purchaseId);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchApi(`/finance/supplier-payments${queryString}`);
  },

  async recordSupplierPayment(input: RecordSupplierPaymentInput): Promise<{ success: boolean; data: any }> {
    return fetchApi('/finance/supplier-payments', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  // Expense Categories & Expenses
  async getExpenseCategories(): Promise<{ success: boolean; data: any[] }> {
    return fetchApi('/finance/expense-categories');
  },

  async createExpenseCategory(input: CreateExpenseCategoryInput): Promise<{ success: boolean; data: any }> {
    return fetchApi('/finance/expense-categories', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async getExpenses(params?: { page?: number; limit?: number; categoryId?: string; status?: string }): Promise<{ success: boolean; data: any[]; totalExpensesAmount: number; pagination: any }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.categoryId) query.set('categoryId', params.categoryId);
    if (params?.status) query.set('status', params.status);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchApi(`/finance/expenses${queryString}`);
  },

  async createExpense(input: CreateExpenseInput): Promise<{ success: boolean; data: any }> {
    return fetchApi('/finance/expenses', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async voidExpense(id: string): Promise<{ success: boolean; data: any }> {
    return fetchApi(`/finance/expenses/${id}/void`, {
      method: 'POST',
    });
  },

  // Account Transfers
  async getTransfers(params?: { page?: number; limit?: number }): Promise<{ success: boolean; data: any[]; pagination: any }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchApi(`/finance/transfers${queryString}`);
  },

  async recordTransfer(input: RecordAccountTransferInput): Promise<{ success: boolean; data: any }> {
    return fetchApi('/finance/transfers', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  // Receivables & Payables
  async getReceivables(): Promise<{ success: boolean; data: any[]; totalReceivables: number }> {
    return fetchApi('/finance/receivables');
  },

  async getPayables(): Promise<{ success: boolean; data: any[]; totalPayables: number }> {
    return fetchApi('/finance/payables');
  },

  // Reconciliation & Audit
  async getHealthCheck(): Promise<{ success: boolean; data: any }> {
    return fetchApi('/finance/reconciliation/health');
  },

  async reconcileAccounts(): Promise<{ success: boolean; data: any }> {
    return fetchApi('/finance/reconciliation/accounts');
  },

  async reconcileSales(): Promise<{ success: boolean; data: any }> {
    return fetchApi('/finance/reconciliation/sales');
  },

  async reconcilePurchases(): Promise<{ success: boolean; data: any }> {
    return fetchApi('/finance/reconciliation/purchases');
  },

  async auditOrphans(): Promise<{ success: boolean; data: any }> {
    return fetchApi('/finance/reconciliation/orphans');
  },

  async fixAccountBalance(id: string): Promise<{ success: boolean; data: any }> {
    return fetchApi(`/finance/reconciliation/accounts/${id}/fix`, { method: 'POST' });
  },

  async fixSalePaymentStatus(id: string): Promise<{ success: boolean; data: any }> {
    return fetchApi(`/finance/reconciliation/sales/${id}/fix`, { method: 'POST' });
  },

  async fixPurchasePaymentStatus(id: string): Promise<{ success: boolean; data: any }> {
    return fetchApi(`/finance/reconciliation/purchases/${id}/fix`, { method: 'POST' });
  },
};
