import { fetchApi } from '../lib/api';
import {
  CustomerSummary,
  SupplierSummary,
  CustomerAddressSummary,
  SupplierAddressSummary,
  CustomerNoteSummary,
  SupplierNoteSummary,
  CRMActivitySummary,
  TagSummary,
  CRMDashboardStats,
} from '@furniture-os/shared';

export const crmService = {
  // CRM Dashboard
  async getDashboard() {
    return fetchApi<{
      stats: CRMDashboardStats;
      recentCustomers: any[];
      recentSuppliers: any[];
      recentActivities: any[];
    }>('/crm/dashboard');
  },

  // Customers
  async getCustomers(filters: Record<string, any> = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, String(val));
      }
    });
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<CustomerSummary[]>(`/customers${queryString}`);
  },

  async getCustomerById(id: string) {
    return fetchApi<CustomerSummary>(`/customers/${id}`);
  },

  async createCustomer(data: any) {
    return fetchApi<CustomerSummary>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCustomer(id: string, data: any) {
    return fetchApi<CustomerSummary>(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async archiveCustomer(id: string) {
    return fetchApi<CustomerSummary>(`/customers/${id}/archive`, {
      method: 'POST',
    });
  },

  async restoreCustomer(id: string) {
    return fetchApi<CustomerSummary>(`/customers/${id}/restore`, {
      method: 'POST',
    });
  },

  async checkCustomerDuplicate(phone?: string, email?: string, excludeId?: string) {
    const params = new URLSearchParams();
    if (phone) params.append('phone', phone);
    if (email) params.append('email', email);
    if (excludeId) params.append('excludeId', excludeId);
    return fetchApi<{ hasDuplicates: boolean; duplicates: any[] }>(
      `/customers/check-duplicate?${params.toString()}`
    );
  },

  async addCustomerAddress(customerId: string, addressData: any) {
    return fetchApi<CustomerAddressSummary>(`/customers/${customerId}/addresses`, {
      method: 'POST',
      body: JSON.stringify(addressData),
    });
  },

  async updateCustomerAddress(customerId: string, addressId: string, addressData: any) {
    return fetchApi<CustomerAddressSummary>(`/customers/${customerId}/addresses/${addressId}`, {
      method: 'PATCH',
      body: JSON.stringify(addressData),
    });
  },

  async deleteCustomerAddress(customerId: string, addressId: string) {
    return fetchApi<{ message: string }>(`/customers/${customerId}/addresses/${addressId}`, {
      method: 'DELETE',
    });
  },

  async addCustomerNote(customerId: string, content: string) {
    return fetchApi<CustomerNoteSummary>(`/customers/${customerId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  async deleteCustomerNote(customerId: string, noteId: string) {
    return fetchApi<{ message: string }>(`/customers/${customerId}/notes/${noteId}`, {
      method: 'DELETE',
    });
  },

  async getCustomerActivities(customerId: string, page = 1, limit = 20) {
    return fetchApi<CRMActivitySummary[]>(`/customers/${customerId}/activities?page=${page}&limit=${limit}`);
  },

  // Suppliers
  async getSuppliers(filters: Record<string, any> = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, String(val));
      }
    });
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<SupplierSummary[]>(`/suppliers${queryString}`);
  },

  async getSupplierById(id: string) {
    return fetchApi<SupplierSummary>(`/suppliers/${id}`);
  },

  async createSupplier(data: any) {
    return fetchApi<SupplierSummary>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateSupplier(id: string, data: any) {
    return fetchApi<SupplierSummary>(`/suppliers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async archiveSupplier(id: string) {
    return fetchApi<SupplierSummary>(`/suppliers/${id}/archive`, {
      method: 'POST',
    });
  },

  async restoreSupplier(id: string) {
    return fetchApi<SupplierSummary>(`/suppliers/${id}/restore`, {
      method: 'POST',
    });
  },

  async checkSupplierDuplicate(phone?: string, email?: string, gstNumber?: string, excludeId?: string) {
    const params = new URLSearchParams();
    if (phone) params.append('phone', phone);
    if (email) params.append('email', email);
    if (gstNumber) params.append('gstNumber', gstNumber);
    if (excludeId) params.append('excludeId', excludeId);
    return fetchApi<{ hasDuplicates: boolean; hasGstMatch: boolean; duplicates: any[] }>(
      `/suppliers/check-duplicate?${params.toString()}`
    );
  },

  async addSupplierAddress(supplierId: string, addressData: any) {
    return fetchApi<SupplierAddressSummary>(`/suppliers/${supplierId}/addresses`, {
      method: 'POST',
      body: JSON.stringify(addressData),
    });
  },

  async updateSupplierAddress(supplierId: string, addressId: string, addressData: any) {
    return fetchApi<SupplierAddressSummary>(`/suppliers/${supplierId}/addresses/${addressId}`, {
      method: 'PATCH',
      body: JSON.stringify(addressData),
    });
  },

  async deleteSupplierAddress(supplierId: string, addressId: string) {
    return fetchApi<{ message: string }>(`/suppliers/${supplierId}/addresses/${addressId}`, {
      method: 'DELETE',
    });
  },

  async addSupplierNote(supplierId: string, content: string) {
    return fetchApi<SupplierNoteSummary>(`/suppliers/${supplierId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  async deleteSupplierNote(supplierId: string, noteId: string) {
    return fetchApi<{ message: string }>(`/suppliers/${supplierId}/notes/${noteId}`, {
      method: 'DELETE',
    });
  },

  async getSupplierActivities(supplierId: string, page = 1, limit = 20) {
    return fetchApi<CRMActivitySummary[]>(`/suppliers/${supplierId}/activities?page=${page}&limit=${limit}`);
  },

  // Activities
  async getActivities(filters: Record<string, any> = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, String(val));
      }
    });
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<CRMActivitySummary[]>(`/crm/activities${queryString}`);
  },

  async createActivity(data: any) {
    return fetchApi<CRMActivitySummary>('/crm/activities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Tags
  async getTags(type?: 'CUSTOMER' | 'SUPPLIER') {
    const query = type ? `?type=${type}` : '';
    return fetchApi<TagSummary[]>(`/crm/tags${query}`);
  },

  async createTag(data: { name: string; type: 'CUSTOMER' | 'SUPPLIER' }) {
    return fetchApi<TagSummary>('/crm/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateTag(id: string, data: { name?: string; isActive?: boolean }) {
    return fetchApi<TagSummary>(`/crm/tags/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deactivateTag(id: string) {
    return fetchApi<TagSummary>(`/crm/tags/${id}/deactivate`, {
      method: 'POST',
    });
  },
};
