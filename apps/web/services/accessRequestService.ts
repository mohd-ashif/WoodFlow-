import { fetchApi } from '../lib/api';
import { CreateAccessRequestInput, AccessRequestSummary } from '@furniture-os/shared';

export const accessRequestService = {
  async submitRequest(data: CreateAccessRequestInput) {
    return fetchApi<{ request: AccessRequestSummary }>('/access-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMyRequest() {
    return fetchApi<{ request: AccessRequestSummary | null }>('/access-requests/me');
  },
};
