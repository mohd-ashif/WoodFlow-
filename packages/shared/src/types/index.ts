export type SystemRole = 'PLATFORM_ADMIN' | 'COMPANY';
export type CompanyRole = 'OWNER' | 'MEMBER';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type CompanyStatus = 'ACTIVE' | 'SUSPENDED';
export type MemberStatus = 'ACTIVE' | 'INACTIVE';
export type AccessRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  systemRole: SystemRole;
  status: UserStatus;
  createdAt: string;
  lastLoginAt?: string | null;
  memberships?: CompanyMemberInfo[];
}

export interface CompanySummary {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  gstNumber?: string | null;
  status: CompanyStatus;
  createdAt: string;
}

export interface CompanyMemberInfo {
  id: string;
  userId: string;
  companyId: string;
  role: CompanyRole;
  status: MemberStatus;
  createdAt: string;
  company?: CompanySummary;
  user?: UserSummary;
}

export interface AuthUserContext {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  systemRole: SystemRole;
  isPlatformAdmin: boolean;
  activeMembership: CompanyMemberInfo | null;
  memberships: CompanyMemberInfo[];
}

export interface AccessRequestSummary {
  id: string;
  userId: string;
  requestedCompanyName: string;
  message?: string | null;
  status: AccessRequestStatus;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
}
