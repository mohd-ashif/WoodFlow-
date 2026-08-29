import { fetchApi } from '../lib/api';
import {
  WorkerSummary,
  DepartmentSummary,
  CreateWorkerInput,
  UpdateWorkerInput,
  CreateDepartmentInput,
  UpdateDepartmentInput,
  RecordAttendanceInput,
} from '@furniture-os/shared';

export interface PaginatedResult<T> {
  success: boolean;
  data?: T;
  workers?: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const workerService = {
  // Departments
  async getDepartments(): Promise<{ success: boolean; data: DepartmentSummary[] }> {
    return fetchApi('/workers/departments');
  },

  async createDepartment(input: CreateDepartmentInput): Promise<{ success: boolean; data: DepartmentSummary }> {
    return fetchApi('/workers/departments', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateDepartment(id: string, input: UpdateDepartmentInput): Promise<{ success: boolean; data: DepartmentSummary }> {
    return fetchApi(`/workers/departments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  // Workers
  async listWorkers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    status?: string;
  }): Promise<{ success: boolean; data: WorkerSummary[]; workers: WorkerSummary[]; pagination: any }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.search) query.set('search', params.search);
    if (params?.departmentId) query.set('departmentId', params.departmentId);
    if (params?.status) query.set('status', params.status);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res: any = await fetchApi(`/workers${queryString}`);
    const items = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : res?.workers || []);
    return {
      success: res?.success ?? true,
      data: items,
      workers: items,
      pagination: res?.pagination,
    };
  },

  async getWorker(id: string): Promise<{ success: boolean; data: WorkerSummary }> {
    const res: any = await fetchApi(`/workers/${id}`);
    const data = res?.data || res;
    return { success: true, data };
  },

  async createWorker(input: CreateWorkerInput): Promise<{ success: boolean; data: WorkerSummary }> {
    return fetchApi('/workers', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateWorker(id: string, input: UpdateWorkerInput): Promise<{ success: boolean; data: WorkerSummary }> {
    return fetchApi(`/workers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  // Attendance
  async recordAttendance(input: RecordAttendanceInput): Promise<{ success: boolean; data: any }> {
    return fetchApi('/workers/attendance', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};
