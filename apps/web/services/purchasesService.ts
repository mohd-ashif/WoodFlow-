import { fetchApi } from '../lib/api';
import { PurchaseSummary, CreatePurchaseInput } from '@furniture-os/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const purchasesService = {
  async getPurchases(filters: Record<string, any> = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, String(val));
      }
    });
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<PurchaseSummary[]>(`/purchases${queryString}`);
  },

  async getPurchaseOverview() {
    return fetchApi<any>('/purchases/overview');
  },

  async getPurchaseById(id: string) {
    return fetchApi<PurchaseSummary>(`/purchases/${id}`);
  },

  async createPurchase(data: CreatePurchaseInput) {
    return fetchApi<PurchaseSummary>('/purchases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async confirmPurchase(id: string) {
    return fetchApi<PurchaseSummary>(`/purchases/${id}/confirm`, {
      method: 'POST',
    });
  },

  async cancelPurchase(id: string, reason: string) {
    return fetchApi<PurchaseSummary>(`/purchases/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async sharePurchaseWhatsApp(id: string) {
    return fetchApi<any>(`/purchases/${id}/share/whatsapp`, {
      method: 'POST',
    });
  },

  getPdfPreviewUrl(id: string) {
    return `${API_BASE_URL}/purchases/${id}/pdf/preview`;
  },

  getPdfDownloadUrl(id: string) {
    return `${API_BASE_URL}/purchases/${id}/pdf?download=true`;
  },
};
