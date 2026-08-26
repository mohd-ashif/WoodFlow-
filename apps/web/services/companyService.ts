import { fetchApi } from '../lib/api';
import { CompanySummary, CompanyMemberInfo, UpdateCompanyInput, CompanyRole, MemberStatus } from '@furniture-os/shared';

export const companyService = {
  async getMyCompany() {
    return fetchApi<{ company: CompanySummary }>('/company');
  },

  async updateMyCompany(data: UpdateCompanyInput) {
    return fetchApi<{ company: CompanySummary }>('/company', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async getMembers() {
    return fetchApi<{ members: CompanyMemberInfo[] }>('/company/members');
  },

  async updateMemberRole(memberId: string, role: CompanyRole) {
    return fetchApi<{ member: CompanyMemberInfo }>(`/company/members/${memberId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  async updateMemberStatus(memberId: string, status: MemberStatus) {
    return fetchApi<{ member: CompanyMemberInfo }>(`/company/members/${memberId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async createMember(data: any) {
    return fetchApi<{ member: CompanyMemberInfo }>('/company/members', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
