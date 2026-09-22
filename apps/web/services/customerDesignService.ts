import { fetchApi } from '../lib/api';

export const customerDesignService = {
  async getDesigns(customerId?: string) {
    const query = customerId ? `?customerId=${customerId}` : '';
    return fetchApi<any[]>(`/customer-designs${query}`);
  },

  async getDesignById(id: string) {
    return fetchApi<any>(`/customer-designs/${id}`);
  },

  async createDesign(data: any) {
    return fetchApi<any>('/customer-designs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateDesign(id: string, data: any) {
    return fetchApi<any>(`/customer-designs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
