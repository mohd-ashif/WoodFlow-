import { fetchApi } from '../lib/api';

export const quotationService = {
  async getQuotations(customerId?: string) {
    const query = customerId ? `?customerId=${customerId}` : '';
    return fetchApi<any[]>(`/quotations${query}`);
  },

  async getQuotationById(id: string) {
    return fetchApi<any>(`/quotations/${id}`);
  },

  async createQuotation(data: any) {
    return fetchApi<any>('/quotations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async convertToSalesOrder(id: string) {
    return fetchApi<any>(`/quotations/${id}/convert`, {
      method: 'POST',
    });
  },
};
