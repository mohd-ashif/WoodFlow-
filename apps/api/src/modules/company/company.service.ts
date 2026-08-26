import { prisma } from '../../config/prisma.js';
import { CreateCompanyInput, UpdateCompanyInput } from '@furniture-os/shared';
import { CompanyStatus, MemberStatus, CompanyRole } from '@prisma/client';
import { ConflictError, NotFoundError, BadRequestError } from '../../utils/errors.js';
import { createAuditLog } from '../audit/audit.service.js';

export async function createCompanyWithOnboarding(
  input: CreateCompanyInput,
  adminUserId: string,
  ipAddress?: string,
  userAgent?: string
) {
  // Verify owner user exists
  const owner = await prisma.user.findUnique({
    where: { id: input.ownerId },
  });

  if (!owner) {
    throw new NotFoundError('Owner user not found', 'OWNER_NOT_FOUND');
  }

  // Check unique slug
  const existingSlug = await prisma.company.findUnique({
    where: { slug: input.slug },
  });

  if (existingSlug) {
    throw new ConflictError('Company slug already exists', 'SLUG_TAKEN');
  }

  // Execute PRISMA TRANSACTION (Section 35 Requirement)
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Company
    const company = await tx.company.create({
      data: {
        name: input.name,
        slug: input.slug,
        email: input.email || undefined,
        phone: input.phone,
        address: input.address,
        city: input.city,
        state: input.state,
        country: input.country,
        postalCode: input.postalCode,
        gstNumber: input.gstNumber,
        status: CompanyStatus.ACTIVE,
      },
    });

    // 2. Create Company Membership & assign OWNER role
    const member = await tx.companyMember.upsert({
      where: {
        userId_companyId: {
          userId: owner.id,
          companyId: company.id,
        },
      },
      update: {
        role: CompanyRole.OWNER,
        status: MemberStatus.ACTIVE,
      },
      create: {
        userId: owner.id,
        companyId: company.id,
        role: CompanyRole.OWNER,
        status: MemberStatus.ACTIVE,
      },
    });

    // 3. Update any pending Access Request for this user to APPROVED
    await tx.accessRequest.updateMany({
      where: { userId: owner.id, status: 'PENDING' },
      data: { status: 'APPROVED', reviewedBy: adminUserId, reviewedAt: new Date() },
    });

    return { company, member };
  });

  await createAuditLog({
    userId: adminUserId,
    companyId: result.company.id,
    action: 'COMPANY_CREATED',
    entity: 'Company',
    entityId: result.company.id,
    metadata: { ownerId: owner.id, slug: input.slug },
    ipAddress,
    userAgent,
  });

  return result;
}

export async function getAllCompanies() {
  return prisma.company.findMany({
    include: {
      _count: { select: { members: true } },
      members: {
        where: { role: CompanyRole.OWNER },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getCompanyById(id: string) {
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, status: true } },
        },
      },
    },
  });

  if (!company) {
    throw new NotFoundError('Company not found');
  }

  return company;
}

export async function updateCompany(id: string, input: UpdateCompanyInput, adminUserId: string) {
  const existing = await prisma.company.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Company not found');
  }

  const updated = await prisma.company.update({
    where: { id },
    data: input,
  });

  await createAuditLog({
    userId: adminUserId,
    companyId: id,
    action: 'COMPANY_UPDATED',
    entity: 'Company',
    entityId: id,
    metadata: { changes: input },
  });

  return updated;
}

export async function setCompanyStatus(
  id: string,
  status: CompanyStatus,
  adminUserId: string,
  ipAddress?: string,
  userAgent?: string
) {
  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) {
    throw new NotFoundError('Company not found');
  }

  const updated = await prisma.company.update({
    where: { id },
    data: { status },
  });

  await createAuditLog({
    userId: adminUserId,
    companyId: id,
    action: status === CompanyStatus.SUSPENDED ? 'COMPANY_SUSPENDED' : 'COMPANY_ACTIVATED',
    entity: 'Company',
    entityId: id,
    ipAddress,
    userAgent,
  });

  return updated;
}

// Tenant Specific Scoped Queries
export async function getTenantCompany(companyId: string) {
  return prisma.company.findUnique({
    where: { id: companyId },
  });
}

export async function updateTenantCompany(companyId: string, input: UpdateCompanyInput) {
  return prisma.company.update({
    where: { id: companyId },
    data: input,
  });
}

export async function getCompanyMembers(companyId: string) {
  return prisma.companyMember.findMany({
    where: { companyId },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true, status: true, lastLoginAt: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateMemberRole(
  companyId: string,
  memberId: string,
  role: CompanyRole,
  actorUserId: string
) {
  const member = await prisma.companyMember.findFirst({
    where: { id: memberId, companyId },
  });

  if (!member) {
    throw new NotFoundError('Company member not found');
  }

  // Prevent dangerous operation: changing last owner to member
  if (member.role === CompanyRole.OWNER && role === CompanyRole.MEMBER) {
    const ownersCount = await prisma.companyMember.count({
      where: { companyId, role: CompanyRole.OWNER, status: MemberStatus.ACTIVE },
    });
    if (ownersCount <= 1) {
      throw new BadRequestError(
        'This company must have at least one owner. Assign another owner before changing this user\'s role.',
        'LAST_OWNER_ROLE_CHANGE'
      );
    }
  }

  const updated = await prisma.companyMember.update({
    where: { id: memberId },
    data: { role },
  });

  await createAuditLog({
    userId: actorUserId,
    companyId,
    action: 'MEMBER_ROLE_UPDATED',
    entity: 'CompanyMember',
    entityId: memberId,
    metadata: { newRole: role },
  });

  return updated;
}

export async function updateMemberStatus(
  companyId: string,
  memberId: string,
  status: MemberStatus,
  actorUserId: string
) {
  const member = await prisma.companyMember.findFirst({
    where: { id: memberId, companyId },
  });

  if (!member) {
    throw new NotFoundError('Company member not found');
  }

  // Prevent dangerous operation: deactivating last owner
  if (member.role === CompanyRole.OWNER && status === MemberStatus.INACTIVE) {
    const ownersCount = await prisma.companyMember.count({
      where: { companyId, role: CompanyRole.OWNER, status: MemberStatus.ACTIVE },
    });
    if (ownersCount <= 1) {
      throw new BadRequestError(
        'This company must have at least one owner. Assign another owner before deactivating this user.',
        'LAST_OWNER_DEACTIVATION'
      );
    }
  }

  const updated = await prisma.companyMember.update({
    where: { id: memberId },
    data: { status },
  });

  await createAuditLog({
    userId: actorUserId,
    companyId,
    action: 'MEMBER_STATUS_UPDATED',
    entity: 'CompanyMember',
    entityId: memberId,
    metadata: { newStatus: status },
  });

  return updated;
}
