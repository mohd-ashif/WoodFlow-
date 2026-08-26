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

export interface CategorySummary {
  id: string;
  companyId: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UnitSummary {
  id: string;
  companyId: string;
  name: string;
  shortCode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventorySummary {
  id: string;
  companyId: string;
  productId: string;
  currentQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  updatedAt: string;
}

export interface ProductSummary {
  id: string;
  companyId: string;
  name: string;
  sku: string;
  description?: string | null;
  productType: 'FINISHED_PRODUCT' | 'RAW_MATERIAL';
  categoryId: string;
  unitId: string;
  purchasePrice: number;
  sellingPrice: number;
  minimumStock: number;
  openingStock: number;
  currentStock: number;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: CategorySummary;
  unit?: UnitSummary;
  inventory?: InventorySummary;
}

export interface StockMovementSummary {
  id: string;
  companyId: string;
  productId: string;
  movementType: string;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  referenceType?: string | null;
  referenceId?: string | null;
  reason?: string | null;
  notes?: string | null;
  createdBy?: string | null;
  createdAt: string;
  product?: {
    name: string;
    sku: string;
  };
  user?: {
    name: string;
  };
}

export interface InventoryDashboardStats {
  totalProducts: number;
  totalFinishedProducts: number;
  totalRawMaterials: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  estimatedInventoryValue: number;
}

