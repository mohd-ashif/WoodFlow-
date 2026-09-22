import { fetchApi } from '../lib/api';

export interface TimelineNode {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  status: string;
  timestamp: string;
  details?: any;
  link?: string;
}

export const traceabilityService = {
  async getDocumentTimeline(entityType: string, entityId: string) {
    return fetchApi<TimelineNode[]>(`/traceability/${entityType}/${entityId}`);
  },
};
