import { fetchApi } from '../lib/api';
import {
  CompanySummary,
  CompanyProfileDTO,
  TenantBrandingSummary,
  CompanyMemberInfo,
  UpdateCompanyInput,
  UpdateBrandingInput,
  CompanyRole,
  MemberStatus,
} from '@furniture-os/shared';

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

  async getCompanyProfile() {
    return fetchApi<{ company: CompanyProfileDTO; branding: TenantBrandingSummary }>('/company/profile');
  },

  async updateCompanyProfile(data: UpdateCompanyInput) {
    return fetchApi<{ company: CompanyProfileDTO; branding: TenantBrandingSummary }>('/company/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getBranding() {
    return fetchApi<{ branding: TenantBrandingSummary }>('/company/branding');
  },

  async updateBranding(data: UpdateBrandingInput) {
    return fetchApi<{ branding: TenantBrandingSummary }>('/company/branding', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async uploadLogo(formData: FormData) {
    return fetchApi<{
      success: boolean;
      message: string;
      logoUrl: string;
      logoObjectKey: string;
      data: { logoUrl: string; logoObjectKey: string; branding: TenantBrandingSummary };
    }>('/company/logo', {
      method: 'POST',
      body: formData,
    });
  },

  async removeLogo() {
    return fetchApi<{ success: boolean; message: string; data: { branding: TenantBrandingSummary } }>(
      '/company/logo',
      {
        method: 'DELETE',
      }
    );
  },

  async uploadInvoiceLogo(formData: FormData) {
    return fetchApi<{
      success: boolean;
      message: string;
      invoiceLogoUrl: string;
      invoiceLogoObjectKey: string;
      data: { invoiceLogoUrl: string; invoiceLogoObjectKey: string; branding: TenantBrandingSummary };
    }>('/company/invoice-logo', {
      method: 'POST',
      body: formData,
    });
  },

  async removeInvoiceLogo() {
    return fetchApi<{ success: boolean; message: string; data: { branding: TenantBrandingSummary } }>(
      '/company/invoice-logo',
      {
        method: 'DELETE',
      }
    );
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
