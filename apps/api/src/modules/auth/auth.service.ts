import { prisma } from '../../config/prisma.js';
import { hashPassword, comparePassword, generateTokens, verifyRefreshToken } from '../../utils/auth.js';
import { ConflictError, UnauthorizedError, BadRequestError } from '../../utils/errors.js';
import { RegisterInput, LoginInput } from '@furniture-os/shared';
import { UserStatus, MemberStatus, CompanyRole, SystemRole } from '@prisma/client';
import { createAuditLog } from '../audit/audit.service.js';

export async function registerUser(input: RegisterInput, ipAddress?: string, userAgent?: string) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (existingUser) {
    throw new ConflictError('An account with this email already exists', 'EMAIL_TAKEN');
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      phone: input.phone,
      status: UserStatus.ACTIVE,
    },
  });

  await createAuditLog({
    userId: user.id,
    action: 'USER_REGISTERED',
    entity: 'User',
    entityId: user.id,
    ipAddress,
    userAgent,
  });

  const tokens = generateTokens({ userId: user.id, email: user.email });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
    },
    tokens,
  };
}

export async function loginUser(input: LoginInput, ipAddress?: string, userAgent?: string) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
    include: {
      memberships: {
        where: { status: MemberStatus.ACTIVE },
        include: {
          company: {
            select: { id: true, name: true, slug: true, status: true, logo: true },
          },
        },
      },
    },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  if (user.status === UserStatus.SUSPENDED) {
    throw new UnauthorizedError('Your account has been suspended', 'ACCOUNT_SUSPENDED');
  }

  const isMatch = await comparePassword(input.password, user.passwordHash);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const isPlatformAdmin = user.systemRole === SystemRole.PLATFORM_ADMIN;
  const activeMembership = user.memberships[0] || null;

  const tokens = generateTokens({
    userId: user.id,
    email: user.email,
    isPlatformAdmin,
  });

  await createAuditLog({
    userId: user.id,
    companyId: activeMembership?.companyId,
    action: 'USER_LOGGED_IN',
    entity: 'User',
    entityId: user.id,
    ipAddress,
    userAgent,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
      isPlatformAdmin,
      activeMembership: activeMembership
        ? {
            id: activeMembership.id,
            userId: activeMembership.userId,
            companyId: activeMembership.companyId,
            role: activeMembership.role,
            status: activeMembership.status,
            company: activeMembership.company,
          }
        : null,
      memberships: user.memberships.map((m) => ({
        id: m.id,
        userId: m.userId,
        companyId: m.companyId,
        role: m.role,
        status: m.status,
        company: m.company,
      })),
    },
    tokens,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        memberships: {
          where: { status: MemberStatus.ACTIVE },
        },
      },
    });

    if (!user || user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedError('Invalid refresh session', 'INVALID_SESSION');
    }

    const isPlatformAdmin = user.systemRole === SystemRole.PLATFORM_ADMIN;

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      isPlatformAdmin,
    });

    return tokens;
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
  }
}
