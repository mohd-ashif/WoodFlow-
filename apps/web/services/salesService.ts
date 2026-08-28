import { fetchApi } from '../lib/api';
import { SaleSummary, InvoiceSummary, CreateSaleInput } from '@furniture-os/shared';

export const salesService = {
  // Sales
  async getSales(filters: Record<string, any> = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, String(val));
      }
    });
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<SaleSummary[]>(`/sales${queryString}`);
  },

  async getSaleById(id: string) {
    return fetchApi<SaleSummary>(`/sales/${id}`);
  },

  async createSale(data: CreateSaleInput) {
    return fetchApi<SaleSummary>('/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async confirmSale(id: string) {
    return fetchApi<SaleSummary>(`/sales/${id}/confirm`, {
      method: 'POST',
    });
  },

  async cancelSale(id: string, reason: string) {
    return fetchApi<SaleSummary>(`/sales/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Invoices
  async getInvoices(filters: Record<string, any> = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, String(val));
      }
    });
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<InvoiceSummary[]>(`/invoices${queryString}`);
  },

  async getInvoiceById(id: string) {
    return fetchApi<InvoiceSummary>(`/invoices/${id}`);
  },
};
