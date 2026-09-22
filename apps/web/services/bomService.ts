import { fetchApi } from '../lib/api';

export const bomService = {
  async getBOMs(productId?: string) {
    const query = productId ? `?productId=${productId}` : '';
    return fetchApi<any[]>(`/bom${query}`);
  },

  async getBOMById(id: string) {
    return fetchApi<any>(`/bom/${id}`);
  },

  async createBOM(data: any) {
    return fetchApi<any>('/bom', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async explodeBOM(productId: string, quantity: number = 1) {
    return fetchApi<{ productId: string; targetQuantity: number; materials: any[] }>(
      `/bom/${productId}/explode?quantity=${quantity}`,
      { method: 'POST' }
    );
  },
};
