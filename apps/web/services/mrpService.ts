import { fetchApi } from '../lib/api';

export interface MaterialRequirement {
  materialProductId: string;
  materialName: string;
  sku: string;
  unitCost: number;
  grossRequirement: number;
  onHandStock: number;
  reservedStock: number;
  availableStock: number;
  incomingSupply: number;
  netRequirement: number;
  status: 'READY' | 'PARTIAL' | 'SHORTAGE' | 'PURCHASE_REQUIRED';
}

export interface MRPRunResult {
  timestamp: string;
  totalDemandsProcessed: number;
  materialRequirements: MaterialRequirement[];
  hasShortage: boolean;
}

export const mrpService = {
  async runMRP(input: Record<string, any> = {}) {
    return fetchApi<MRPRunResult>('/mrp/run', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async getMaterialRequirements() {
    return fetchApi<MaterialRequirement[]>('/mrp/requirements');
  },

  async reserveStock(data: {
    productId: string;
    quantity: number;
    sourceType: string;
    sourceId: string;
    workOrderId?: string;
    salesOrderId?: string;
  }) {
    return fetchApi('/mrp/reserve', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async releaseReservation(reservationId: string) {
    return fetchApi(`/mrp/reservations/${reservationId}/release`, {
      method: 'POST',
    });
  },
};
