export type SystemRole = 'PLATFORM_ADMIN' | 'COMPANY';
export type CompanyRole = 'OWNER' | 'MANAGER' | 'STAFF' | 'WORKER' | 'MEMBER';

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

export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type SupplierStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type CustomerAddressType = 'HOME' | 'OFFICE' | 'DELIVERY' | 'OTHER';
export type SupplierAddressType = 'OFFICE' | 'WAREHOUSE' | 'BILLING' | 'OTHER';
export type CRMEntityType = 'CUSTOMER' | 'SUPPLIER';
export type CRMActivityType = 'NOTE' | 'CALL' | 'EMAIL' | 'FOLLOW_UP' | 'STATUS_CHANGE' | 'CREATED' | 'UPDATED' | 'ARCHIVED' | 'RESTORED';
export type TagType = 'CUSTOMER' | 'SUPPLIER';

export interface TagSummary {
  id: string;
  companyId: string;
  name: string;
  type: TagType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerAddressSummary {
  id: string;
  customerId: string;
  companyId: string;
  type: CustomerAddressType;
  name?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerNoteSummary {
  id: string;
  companyId: string;
  customerId: string;
  content: string;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name: string;
  } | null;
}

export interface CustomerSummary {
  id: string;
  companyId: string;
  customerCode: string;
  name: string;
  phone: string;
  alternatePhone?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  gstNumber?: string | null;
  taxId?: string | null;
  notes?: string | null;
  status: CustomerStatus;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  totalOrdersDisplay?: string;
  outstandingBalanceDisplay?: string;
  creator?: {
    id: string;
    name: string;
  } | null;
  addresses?: CustomerAddressSummary[];
  notesList?: CustomerNoteSummary[];
  tags?: TagSummary[];
}

export interface SupplierAddressSummary {
  id: string;
  supplierId: string;
  companyId: string;
  type: SupplierAddressType;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierNoteSummary {
  id: string;
  companyId: string;
  supplierId: string;
  content: string;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name: string;
  } | null;
}

export interface SupplierSummary {
  id: string;
  companyId: string;
  supplierCode: string;
  name: string;
  phone: string;
  alternatePhone?: string | null;
  email?: string | null;
  gstNumber?: string | null;
  taxId?: string | null;
  notes?: string | null;
  status: SupplierStatus;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  totalPurchasesDisplay?: string;
  outstandingBalanceDisplay?: string;
  creator?: {
    id: string;
    name: string;
  } | null;
  addresses?: SupplierAddressSummary[];
  notesList?: SupplierNoteSummary[];
  tags?: TagSummary[];
}

export interface CRMActivitySummary {
  id: string;
  companyId: string;
  entityType: CRMEntityType;
  entityId: string;
  activityType: CRMActivityType;
  title: string;
  description?: string | null;
  createdBy?: string | null;
  createdAt: string;
  creator?: {
    id: string;
    name: string;
  } | null;
}

export interface CRMDashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  totalSuppliers: number;
  activeSuppliers: number;
  newCustomersThisMonth: number;
  newSuppliersThisMonth: number;
}

export type WorkerStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'DAILY_WAGE';
export type DepartmentStatus = 'ACTIVE' | 'INACTIVE';
export type WorkOrderSourceType = 'SALES_ORDER' | 'MANUAL' | 'INTERNAL';
export type WorkOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type WorkOrderStatus = 'DRAFT' | 'PLANNED' | 'IN_PROGRESS' | 'ON_HOLD' | 'QUALITY_CHECK' | 'COMPLETED' | 'CANCELLED';
export type TaskStage = 'MATERIAL_PREPARATION' | 'CUTTING' | 'CARPENTRY' | 'ASSEMBLY' | 'SANDING' | 'PAINTING' | 'POLISHING' | 'UPHOLSTERY' | 'QUALITY_CHECK' | 'PACKAGING' | 'OTHER';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED';
export type MaterialStatus = 'PLANNED' | 'PARTIALLY_ISSUED' | 'ISSUED' | 'RETURNED';
export type QualityStatus = 'PENDING' | 'PASSED' | 'FAILED';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';

export interface DepartmentSummary {
  id: string;
  companyId: string;
  name: string;
  description?: string | null;
  status: DepartmentStatus;
  createdAt: string;
  _count?: {
    workers: number;
  };
}

export interface WorkerSummary {
  id: string;
  companyId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  departmentId?: string | null;
  department?: DepartmentSummary | null;
  employmentType: EmploymentType;
  joiningDate?: string | null;
  dailyWage?: number | null;
  monthlySalary?: number | null;
  status: WorkerStatus;
  notes?: string | null;
  createdAt: string;
  skills?: { id: string; skillName: string }[];
}

export interface WorkOrderItemSummary {
  id: string;
  workOrderId: string;
  productId?: string | null;
  productNameSnapshot: string;
  customProductName?: string | null;
  dimensions?: string | null;
  specifications?: string | null;
  quantity: number;
  completedQuantity: number;
  estimatedUnitCost: number;
  actualUnitCost: number;
  notes?: string | null;
}

export interface ProductionTaskAssignmentSummary {
  id: string;
  productionTaskId: string;
  workerId: string;
  assignedAt: string;
  assignedBy?: string | null;
  status: string;
  worker?: WorkerSummary;
}

export interface ProductionTaskSummary {
  id: string;
  companyId: string;
  workOrderId: string;
  title: string;
  description?: string | null;
  stage: TaskStage;
  status: TaskStatus;
  priority: WorkOrderPriority;
  estimatedHours?: number | null;
  actualHours?: number | null;
  startTime?: string | null;
  completedTime?: string | null;
  assignments?: ProductionTaskAssignmentSummary[];
}

export interface WorkOrderMaterialSummary {
  id: string;
  companyId: string;
  workOrderId: string;
  productId: string;
  plannedQuantity: number;
  issuedQuantity: number;
  consumedQuantity: number;
  returnedQuantity: number;
  unitCost: number;
  status: MaterialStatus;
  product?: {
    id: string;
    name: string;
    sku: string;
    currentStock: number;
  };
}

export interface QualityCheckSummary {
  id: string;
  companyId: string;
  workOrderId: string;
  status: QualityStatus;
  checkedBy?: string | null;
  checkedAt?: string | null;
  notes?: string | null;
  issuesFound?: string | null;
}

export interface WorkOrderSummary {
  id: string;
  companyId: string;
  workOrderNumber: string;
  sourceType: WorkOrderSourceType;
  sourceId?: string | null;
  customerId?: string | null;
  customer?: {
    id: string;
    name: string;
    customerCode: string;
    phone: string;
  } | null;
  title: string;
  description?: string | null;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  startDate?: string | null;
  dueDate?: string | null;
  completedDate?: string | null;
  estimatedCost: number;
  actualCost: number;
  progressPercentage?: number;
  items?: WorkOrderItemSummary[];
  tasks?: ProductionTaskSummary[];
  materials?: WorkOrderMaterialSummary[];
  qualityChecks?: QualityCheckSummary[];
  createdAt: string;
}

export interface ProductionDashboardStats {
  totalWorkOrders: number;
  draftWorkOrders: number;
  plannedWorkOrders: number;
  inProgressWorkOrders: number;
  qualityCheckWorkOrders: number;
  completedWorkOrders: number;
  overdueWorkOrders: number;
  activeWorkersToday: number;
}


