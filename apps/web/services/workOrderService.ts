import { fetchApi } from '../lib/api';
import {
  WorkOrderSummary,
  ProductionDashboardStats,
  CreateWorkOrderInput,
  UpdateWorkOrderInput,
  CreateProductionTaskInput,
  UpdateTaskStatusInput,
  AssignWorkerTaskInput,
  IssueMaterialInput,
  ReturnMaterialInput,
  QualityCheckInput,
} from '@furniture-os/shared';

export const workOrderService = {
  // Dashboard Metrics
  async getDashboardStats(): Promise<{ success: boolean; data: ProductionDashboardStats }> {
    return fetchApi('/work-orders/dashboard/stats');
  },

  // Work Orders
  async listWorkOrders(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    priority?: string;
    customerId?: string;
  }): Promise<{ success: boolean; data: WorkOrderSummary[]; workOrders: WorkOrderSummary[]; pagination: any }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.customerId) query.set('customerId', params.customerId);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res: any = await fetchApi(`/work-orders${queryString}`);
    const items = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : res?.workOrders || []);
    return {
      success: res?.success ?? true,
      data: items,
      workOrders: items,
      pagination: res?.pagination,
    };
  },

  async getWorkOrder(id: string): Promise<{ success: boolean; data: WorkOrderSummary }> {
    const res: any = await fetchApi(`/work-orders/${id}`);
    const data = res?.data || res;
    return { success: true, data };
  },

  async createWorkOrder(input: CreateWorkOrderInput): Promise<{ success: boolean; data: WorkOrderSummary }> {
    return fetchApi('/work-orders', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateWorkOrderStatus(id: string, status: string): Promise<{ success: boolean; data: WorkOrderSummary }> {
    return fetchApi(`/work-orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Tasks
  async createProductionTask(input: CreateProductionTaskInput): Promise<{ success: boolean; data: any }> {
    return fetchApi(`/work-orders/${input.workOrderId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async assignWorkersToTask(taskId: string, input: AssignWorkerTaskInput): Promise<{ success: boolean; data: any }> {
    return fetchApi(`/work-orders/tasks/${taskId}/assign`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateTaskStatus(taskId: string, input: UpdateTaskStatusInput): Promise<{ success: boolean; data: any }> {
    return fetchApi(`/work-orders/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  // Materials
  async issueMaterial(workOrderId: string, input: IssueMaterialInput): Promise<{ success: boolean; data: any }> {
    return fetchApi(`/work-orders/${workOrderId}/materials/issue`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async returnMaterial(workOrderId: string, materialId: string, input: ReturnMaterialInput): Promise<{ success: boolean; data: any }> {
    return fetchApi(`/work-orders/${workOrderId}/materials/${materialId}/return`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  // Quality Check
  async performQualityCheck(workOrderId: string, input: QualityCheckInput): Promise<{ success: boolean; data: any }> {
    return fetchApi(`/work-orders/${workOrderId}/quality-check`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  // Completion
  async completeWorkOrder(workOrderId: string): Promise<{ success: boolean; data: WorkOrderSummary }> {
    return fetchApi(`/work-orders/${workOrderId}/complete`, {
      method: 'POST',
    });
  },
};
