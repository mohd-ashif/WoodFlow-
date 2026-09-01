/**
 * Centralized Query Keys Factory with Multi-Tenant Scoping
 * Guarantees zero cross-tenant cache pollution.
 */

export const queryKeys = {
  // Authentication & User Context
  auth: {
    me: () => ['auth', 'me'] as const,
  },

  // Company & Settings
  company: {
    detail: (companyId?: string) => ['company', companyId] as const,
    members: (companyId?: string) => ['company', companyId, 'members'] as const,
  },

  // Products & Categories
  products: {
    all: (companyId?: string) => ['products', companyId] as const,
    list: (companyId?: string, filters?: Record<string, any>) => ['products', companyId, 'list', filters] as const,
    detail: (companyId?: string, id?: string) => ['products', companyId, 'detail', id] as const,
    categories: (companyId?: string) => ['products', companyId, 'categories'] as const,
    units: (companyId?: string) => ['products', companyId, 'units'] as const,
  },

  // Inventory & Stock
  inventory: {
    all: (companyId?: string) => ['inventory', companyId] as const,
    list: (companyId?: string, filters?: Record<string, any>) => ['inventory', companyId, 'list', filters] as const,
    lowStock: (companyId?: string) => ['inventory', companyId, 'low-stock'] as const,
    outOfStock: (companyId?: string) => ['inventory', companyId, 'out-of-stock'] as const,
    movements: (companyId?: string, filters?: Record<string, any>) => ['inventory', companyId, 'movements', filters] as const,
  },

  // Customer & Supplier CRM
  crm: {
    customers: (companyId?: string, filters?: Record<string, any>) => ['crm', companyId, 'customers', filters] as const,
    customerDetail: (companyId?: string, id?: string) => ['crm', companyId, 'customer', id] as const,
    suppliers: (companyId?: string, filters?: Record<string, any>) => ['crm', companyId, 'suppliers', filters] as const,
    supplierDetail: (companyId?: string, id?: string) => ['crm', companyId, 'supplier', id] as const,
    activities: (companyId?: string, entityId?: string) => ['crm', companyId, 'activities', entityId] as const,
  },

  // Sales & Invoicing
  sales: {
    all: (companyId?: string) => ['sales', companyId] as const,
    list: (companyId?: string, filters?: Record<string, any>) => ['sales', companyId, 'list', filters] as const,
    detail: (companyId?: string, id?: string) => ['sales', companyId, 'detail', id] as const,
    invoices: (companyId?: string, filters?: Record<string, any>) => ['sales', companyId, 'invoices', filters] as const,
  },

  // Purchases
  purchases: {
    all: (companyId?: string) => ['purchases', companyId] as const,
    list: (companyId?: string, filters?: Record<string, any>) => ['purchases', companyId, 'list', filters] as const,
    detail: (companyId?: string, id?: string) => ['purchases', companyId, 'detail', id] as const,
  },

  // Workers & Production
  workers: {
    all: (companyId?: string) => ['workers', companyId] as const,
    list: (companyId?: string, filters?: Record<string, any>) => ['workers', companyId, 'list', filters] as const,
    detail: (companyId?: string, id?: string) => ['workers', companyId, 'detail', id] as const,
    workOrders: (companyId?: string, filters?: Record<string, any>) => ['workers', companyId, 'work-orders', filters] as const,
  },

  // Finance & Ledger
  finance: {
    accounts: (companyId?: string) => ['finance', companyId, 'accounts'] as const,
    receivables: (companyId?: string) => ['finance', companyId, 'receivables'] as const,
    payables: (companyId?: string) => ['finance', companyId, 'payables'] as const,
    reconciliation: (companyId?: string, filters?: Record<string, any>) => ['finance', companyId, 'reconciliation', filters] as const,
  },

  // Reports & Analytics
  analytics: {
    overview: (companyId?: string, preset?: string) => ['analytics', companyId, 'overview', preset] as const,
    sales: (companyId?: string, preset?: string) => ['analytics', companyId, 'sales', preset] as const,
    purchases: (companyId?: string, preset?: string) => ['analytics', companyId, 'purchases', preset] as const,
    inventory: (companyId?: string) => ['analytics', companyId, 'inventory'] as const,
    pnl: (companyId?: string, preset?: string) => ['analytics', companyId, 'pnl', preset] as const,
  },
};
