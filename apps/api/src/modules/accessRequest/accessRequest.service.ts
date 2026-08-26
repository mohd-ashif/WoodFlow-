import { prisma } from '../../config/prisma.js';
import { CreateAccessRequestInput } from '@furniture-os/shared';
import { AccessRequestStatus, CompanyRole, CompanyStatus, MemberStatus } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { createAuditLog } from '../audit/audit.service.js';

export async function submitAccessRequest(
  userId: string,
  input: CreateAccessRequestInput,
  ipAddress?: string,
  userAgent?: string
) {
  // Check if user already has a pending request
  const existing = await prisma.accessRequest.findFirst({
    where: {
      userId,
      status: AccessRequestStatus.PENDING,
    },
  });

  if (existing) {
    throw new BadRequestError('You already have a pending access request', 'PENDING_REQUEST_EXISTS');
  }

  const request = await prisma.accessRequest.create({
    data: {
      userId,
      requestedCompanyName: input.requestedCompanyName,
      message: input.message,
      status: AccessRequestStatus.PENDING,
    },
  });

  await createAuditLog({
    userId,
    action: 'ACCESS_REQUEST_CREATED',
    entity: 'AccessRequest',
    entityId: request.id,
    metadata: { companyName: input.requestedCompanyName },
    ipAddress,
    userAgent,
  });

  return request;
}

export async function getMyAccessRequests(userId: string) {
  return prisma.accessRequest.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAllAccessRequests() {
  return prisma.accessRequest.findMany({
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function approveAccessRequest(
  requestId: string,
  adminUserId: string,
  input: {
    option: 'create' | 'assign';
    companyId?: string;
    companyDetails?: {
      name: string;
      slug?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
      gstNumber?: string;
      logo?: string;
    };
    role?: CompanyRole;
  },
  ipAddress?: string,
  userAgent?: string
) {
  const request = await prisma.accessRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new NotFoundError('Access request not found');
  }

  if (request.status !== AccessRequestStatus.PENDING) {
    throw new BadRequestError('Access request has already been processed');
  }

  const assignedRole = input.role || CompanyRole.OWNER;

  const result = await prisma.$transaction(async (tx) => {
    let companyId = input.companyId;

    if (input.option === 'create') {
      if (!input.companyDetails || !input.companyDetails.name) {
        throw new BadRequestError('Company details are required for creating a new company');
      }

      // Generate unique slug
      const baseSlug = (input.companyDetails.slug || input.companyDetails.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      let slug = baseSlug || 'company';
      let counter = 1;
      while (true) {
        const existing = await tx.company.findUnique({
          where: { slug },
        });
        if (!existing) {
          break;
        }
        counter++;
        slug = `${baseSlug}-${counter}`;
      }

      const company = await tx.company.create({
        data: {
          name: input.companyDetails.name,
          slug,
          email: input.companyDetails.email,
          phone: input.companyDetails.phone,
          address: input.companyDetails.address,
          city: input.companyDetails.city,
          state: input.companyDetails.state,
          country: input.companyDetails.country,
          postalCode: input.companyDetails.postalCode,
          gstNumber: input.companyDetails.gstNumber,
          logo: input.companyDetails.logo,
          status: CompanyStatus.ACTIVE,
        },
      });

      companyId = company.id;
    } else {
      if (!companyId) {
        throw new BadRequestError('Company ID is required for assigning to an existing company');
      }
      const company = await tx.company.findUnique({
        where: { id: companyId },
      });
      if (!company) {
        throw new NotFoundError('Company not found');
      }
    }

    // Create membership
    const membership = await tx.companyMember.upsert({
      where: {
        userId_companyId: {
          userId: request.userId,
          companyId,
        },
      },
      update: {
        role: assignedRole,
        status: MemberStatus.ACTIVE,
      },
      create: {
        userId: request.userId,
        companyId,
        role: assignedRole,
        status: MemberStatus.ACTIVE,
      },
    });

    // Mark request approved
    const updatedRequest = await tx.accessRequest.update({
      where: { id: requestId },
      data: {
        status: AccessRequestStatus.APPROVED,
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
      },
    });

    return { companyId, membership, updatedRequest };
  });

  await createAuditLog({
    userId: adminUserId,
    companyId: result.companyId,
    action: 'ACCESS_REQUEST_APPROVED',
    entity: 'AccessRequest',
    entityId: request.id,
    metadata: {
      userId: request.userId,
      companyId: result.companyId,
      option: input.option,
      role: assignedRole,
    },
    ipAddress,
    userAgent,
  });

  return result.updatedRequest;
}

export async function rejectAccessRequest(
  requestId: string,
  adminUserId: string,
  ipAddress?: string,
  userAgent?: string
) {
  const request = await prisma.accessRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new NotFoundError('Access request not found');
  }

  if (request.status !== AccessRequestStatus.PENDING) {
    throw new BadRequestError('Access request has already been processed');
  }

  const updated = await prisma.accessRequest.update({
    where: { id: requestId },
    data: {
      status: AccessRequestStatus.REJECTED,
      reviewedBy: adminUserId,
      reviewedAt: new Date(),
    },
  });

  await createAuditLog({
    userId: adminUserId,
    action: 'ACCESS_REQUEST_REJECTED',
    entity: 'AccessRequest',
    entityId: request.id,
    metadata: { userId: request.userId },
    ipAddress,
    userAgent,
  });

  return updated;
}
