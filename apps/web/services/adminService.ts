import { fetchApi } from '../lib/api';
import {
  CompanySummary,
  AccessRequestSummary,
  UserSummary,
  CreateCompanyInput,
  UpdateCompanyInput,
  SystemRole,
  CompanyRole,
  UserStatus,
  CompanyStatus,
  MemberStatus,
  AccessRequestStatus,
} from '@furniture-os/shared';

export interface AdminStats {
  totalCompanies: number;
  activeCompanies: number;
  suspendedCompanies: number;
  totalUsers: number;
  pendingAccessRequests: number;
  usersWithoutCompany: number;
}

export interface PaginatedResult<T> {
  success: boolean;
  data: T;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DetailedUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  systemRole: SystemRole;
  status: UserStatus;
  createdAt: string;
  lastLoginAt: string | null;
  memberships: {
    id: string;
    userId: string;
    companyId: string;
    role: CompanyRole;
    status: MemberStatus;
    createdAt: string;
    company: CompanySummary;
  }[];
  accessRequests: {
    id: string;
    requestedCompanyName: string;
    message: string | null;
    status: AccessRequestStatus;
    createdAt: string;
  }[];
  auditLogs: {
    id: string;
    action: string;
    entity: string;
    entityId: string | null;
    metadata: any;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
  }[];
}

export interface DetailedCompany extends CompanySummary {
  members: {
    id: string;
    userId: string;
    role: CompanyRole;
    status: MemberStatus;
    createdAt: string;
    user: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      status: UserStatus;
      lastLoginAt: string | null;
    };
  }[];
  accessRequests: {
    id: string;
    userId: string;
    requestedCompanyName: string;
    message: string | null;
    status: AccessRequestStatus;
    createdAt: string;
    user?: {
      name: string;
      email: string;
    };
  }[];
  auditLogs: {
    id: string;
    action: string;
    createdAt: string;
    metadata: any;
    user?: {
      name: string;
    } | null;
  }[];
}

export interface AuditLogItem {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  company: {
    id: string;
    name: string;
  } | null;
}

export const adminService = {
  async getStats() {
    return fetchApi<{ stats: AdminStats }>('/admin/stats');
  },

  async listCompanies(params?: { page?: number; limit?: number; search?: string; status?: CompanyStatus }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);

    return fetchApi<PaginatedResult<{ companies: CompanySummary[] }>>(`/admin/companies?${query.toString()}`);
  },

  async createCompany(data: CreateCompanyInput) {
    return fetchApi<{ company: CompanySummary }>('/admin/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getCompany(id: string) {
    return fetchApi<{ company: DetailedCompany }>(`/admin/companies/${id}`);
  },

  async updateCompany(id: string, data: UpdateCompanyInput) {
    return fetchApi<{ company: CompanySummary }>(`/admin/companies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async suspendCompany(id: string) {
    return fetchApi<{ company: CompanySummary }>(`/admin/companies/${id}/suspend`, {
      method: 'POST',
    });
  },

  async activateCompany(id: string) {
    return fetchApi<{ company: CompanySummary }>(`/admin/companies/${id}/activate`, {
      method: 'POST',
    });
  },

  async listAccessRequests(params?: { page?: number; limit?: number; search?: string; status?: AccessRequestStatus }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);

    return fetchApi<PaginatedResult<{ requests: AccessRequestSummary[] }>>(`/admin/access-requests?${query.toString()}`);
  },

  async approveAccessRequest(
    id: string,
    data: {
      option: 'create' | 'assign';
      companyId?: string;
      companyDetails?: {
        name: string;
        email?: string;
        phone?: string;
        address?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        gstNumber?: string;
      };
      role?: CompanyRole;
    }
  ) {
    return fetchApi<{ request: AccessRequestSummary }>(`/admin/access-requests/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async rejectAccessRequest(id: string) {
    return fetchApi<{ request: AccessRequestSummary }>(`/admin/access-requests/${id}/reject`, {
      method: 'POST',
    });
  },

  async listUsers(params?: { page?: number; limit?: number; search?: string; filter?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.filter) query.append('filter', params.filter);

    return fetchApi<PaginatedResult<{ users: UserSummary[] }>>(`/admin/users?${query.toString()}`);
  },

  async getUser(id: string) {
    return fetchApi<{ user: DetailedUser }>(`/admin/users/${id}`);
  },

  async updateUserStatus(id: string, status: UserStatus) {
    return fetchApi<{ user: UserSummary }>(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async assignUserToCompany(id: string, companyId: string, role: CompanyRole) {
    return fetchApi<{ membership: any }>(`/admin/users/${id}/assign-company`, {
      method: 'POST',
      body: JSON.stringify({ companyId, role }),
    });
  },

  async removeUserFromCompany(id: string, companyId: string) {
    return fetchApi<{ success: boolean }>(`/admin/users/${id}/company/${companyId}`, {
      method: 'DELETE',
    });
  },

  async listActivityLogs(params?: { page?: number; limit?: number; search?: string; companyId?: string; action?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.companyId) query.append('companyId', params.companyId);
    if (params?.action) query.append('action', params.action);

    return fetchApi<PaginatedResult<{ logs: AuditLogItem[] }>>(`/admin/activity?${query.toString()}`);
  },
};
