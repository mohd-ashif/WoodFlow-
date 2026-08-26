import { prisma } from '../../config/prisma.js';
import { CompanyStatus, AccessRequestStatus, UserStatus, SystemRole, CompanyRole, MemberStatus } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { createAuditLog } from '../audit/audit.service.js';

export async function getAdminDashboardStats() {
  const [
    totalCompanies,
    activeCompanies,
    suspendedCompanies,
    totalUsers,
    pendingAccessRequests,
    usersWithoutCompany,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.company.count({ where: { status: CompanyStatus.ACTIVE } }),
    prisma.company.count({ where: { status: CompanyStatus.SUSPENDED } }),
    prisma.user.count(),
    prisma.accessRequest.count({ where: { status: AccessRequestStatus.PENDING } }),
    prisma.user.count({
      where: {
        memberships: { none: {} },
        systemRole: SystemRole.COMPANY,
      },
    }),
  ]);

  return {
    totalCompanies,
    activeCompanies,
    suspendedCompanies,
    totalUsers,
    pendingAccessRequests,
    usersWithoutCompany,
  };
}

export async function getAllUsersForAdmin(params: {
  page: number;
  limit: number;
  search?: string;
  filter?: string;
}) {
  const { page, limit, search, filter } = params;
  const skip = (page - 1) * limit;

  // Build where conditions
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      {
        memberships: {
          some: {
            company: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
        },
      },
    ];
  }

  // Filters (active, inactive, pendingAccess, noCompany, companyUsers, platformAdmins)
  if (filter) {
    if (filter === 'active') {
      where.status = UserStatus.ACTIVE;
    } else if (filter === 'inactive') {
      where.status = UserStatus.INACTIVE;
    } else if (filter === 'suspended') {
      where.status = UserStatus.SUSPENDED;
    } else if (filter === 'pendingAccess') {
      where.accessRequests = {
        some: {
          status: AccessRequestStatus.PENDING,
        },
      };
    } else if (filter === 'noCompany') {
      where.memberships = { none: {} };
      where.systemRole = SystemRole.COMPANY;
    } else if (filter === 'companyUsers') {
      where.memberships = { some: {} };
      where.systemRole = SystemRole.COMPANY;
    } else if (filter === 'platformAdmins') {
      where.systemRole = SystemRole.PLATFORM_ADMIN;
    }
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        systemRole: true,
        createdAt: true,
        lastLoginAt: true,
        memberships: {
          include: {
            company: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getUserByIdForAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: {
          company: true,
        },
      },
      accessRequests: {
        orderBy: { createdAt: 'desc' },
      },
      auditLogs: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}

export async function updateUserStatus(userId: string, status: UserStatus, adminUserId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Prevent modifying self status
  if (user.id === adminUserId) {
    throw new BadRequestError('You cannot change your own status');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status },
  });

  await createAuditLog({
    userId: adminUserId,
    action: status === UserStatus.SUSPENDED ? 'USER_SUSPENDED' : 'USER_STATUS_UPDATED',
    entity: 'User',
    entityId: userId,
    metadata: { userId, newStatus: status },
  });

  return updated;
}

export async function assignUserToCompany(
  userId: string,
  companyId: string,
  role: CompanyRole,
  adminUserId: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    throw new NotFoundError('Company not found');
  }

  // Check user limit (limit = 5)
  const existingMembership = await prisma.companyMember.findUnique({
    where: {
      userId_companyId: {
        userId,
        companyId,
      },
    },
  });

  if (!existingMembership || existingMembership.status !== MemberStatus.ACTIVE) {
    const activeMembersCount = await prisma.companyMember.count({
      where: { companyId, status: MemberStatus.ACTIVE },
    });
    if (activeMembersCount >= 5) {
      throw new BadRequestError('This company has reached its maximum user limit of 5 users', 'USER_LIMIT_REACHED');
    }
  }

  const membership = await prisma.companyMember.upsert({
    where: {
      userId_companyId: {
        userId,
        companyId,
      },
    },
    update: {
      role,
      status: MemberStatus.ACTIVE,
    },
    create: {
      userId,
      companyId,
      role,
      status: MemberStatus.ACTIVE,
    },
  });

  await createAuditLog({
    userId: adminUserId,
    companyId,
    action: 'USER_ASSIGNED_TO_COMPANY',
    entity: 'CompanyMember',
    entityId: membership.id,
    metadata: { userId, companyId, role },
  });

  return membership;
}

export async function removeUserFromCompany(userId: string, companyId: string, adminUserId: string) {
  const membership = await prisma.companyMember.findUnique({
    where: {
      userId_companyId: {
        userId,
        companyId,
      },
    },
  });

  if (!membership) {
    throw new NotFoundError('Company membership not found');
  }

  // Prevent dangerous operation: removing last Company Owner
  if (membership.role === CompanyRole.OWNER) {
    const ownersCount = await prisma.companyMember.count({
      where: { companyId, role: CompanyRole.OWNER, status: MemberStatus.ACTIVE },
    });
    if (ownersCount <= 1) {
      throw new BadRequestError(
        'This company must have at least one owner. Assign another owner before removing this user.',
        'LAST_OWNER_REMOVAL'
      );
    }
  }

  await prisma.companyMember.delete({
    where: {
      userId_companyId: {
        userId,
        companyId,
      },
    },
  });

  await createAuditLog({
    userId: adminUserId,
    companyId,
    action: 'USER_REMOVED_FROM_COMPANY',
    entity: 'CompanyMember',
    entityId: membership.id,
    metadata: { userId, companyId },
  });

  return { success: true };
}

export async function getAllCompaniesForAdmin(params: {
  page: number;
  limit: number;
  search?: string;
  status?: CompanyStatus;
}) {
  const { page, limit, search, status } = params;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (status) {
    where.status = status;
  }

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      include: {
        _count: { select: { members: true } },
        members: {
          where: { role: CompanyRole.OWNER },
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.company.count({ where }),
  ]);

  return {
    companies,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getCompanyDetailsForAdmin(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, status: true, lastLoginAt: true } },
        },
      },
      auditLogs: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          user: { select: { name: true } },
        },
      },
    },
  });

  if (!company) {
    throw new NotFoundError('Company not found');
  }

  // Access requests related to this company name
  const accessRequests = await prisma.accessRequest.findMany({
    where: {
      requestedCompanyName: {
        contains: company.name,
        mode: 'insensitive',
      },
    },
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    ...company,
    accessRequests,
  };
}

export async function getAccessRequestById(id: string) {
  const request = await prisma.accessRequest.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true },
      },
      reviewer: {
        select: { name: true },
      },
    },
  });

  if (!request) {
    throw new NotFoundError('Access request not found');
  }

  return request;
}

export async function getAllAccessRequestsForAdmin(params: {
  page: number;
  limit: number;
  search?: string;
  status?: AccessRequestStatus;
}) {
  const { page, limit, search, status } = params;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where.OR = [
      { requestedCompanyName: { contains: search, mode: 'insensitive' } },
      {
        user: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
      },
    ];
  }
  if (status) {
    where.status = status;
  }

  const [requests, total] = await Promise.all([
    prisma.accessRequest.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        reviewer: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.accessRequest.count({ where }),
  ]);

  return {
    requests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function listActivityLogs(params: {
  page: number;
  limit: number;
  search?: string;
  companyId?: string;
  action?: string;
}) {
  const { page, limit, search, companyId, action } = params;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (companyId) {
    where.companyId = companyId;
  }
  if (action) {
    where.action = action;
  }
  if (search) {
    where.OR = [
      {
        user: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
      },
      {
        company: {
          name: { contains: search, mode: 'insensitive' },
        },
      },
      {
        action: { contains: search, mode: 'insensitive' },
      },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        company: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
