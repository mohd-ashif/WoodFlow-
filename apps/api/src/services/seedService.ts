import { prisma } from '../config/prisma.js';
import { logger } from '../config/logger.js';
import { SystemRole, CompanyRole, UserStatus, CompanyStatus, MemberStatus, AccessRequestStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function autoSeedIfEmpty() {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      logger.info(`ℹ️ Database already contains ${userCount} user(s). Skipping auto-seed.`);
      return { seeded: false, userCount };
    }

    logger.info('🌱 Empty database detected in production/startup! Executing automatic initial seed...');

    const adminPasswordHash = await bcrypt.hash('AdminPass123!', 10);
    const ownerPasswordHash = await bcrypt.hash('OwnerPass123!', 10);
    const userPasswordHash = await bcrypt.hash('UserPass123!', 10);

    // 1. Create Platform Admin User
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@furnitureos.local' },
      update: {
        passwordHash: adminPasswordHash,
        status: UserStatus.ACTIVE,
        systemRole: SystemRole.PLATFORM_ADMIN,
      },
      create: {
        name: 'Platform Administrator',
        email: 'admin@furnitureos.local',
        passwordHash: adminPasswordHash,
        phone: '+10000000000',
        systemRole: SystemRole.PLATFORM_ADMIN,
        status: UserStatus.ACTIVE,
      },
    });

    // 2. Create Demo Company (Royal Furniture)
    const royalCompany = await prisma.company.upsert({
      where: { slug: 'royal-furniture' },
      update: {
        status: CompanyStatus.ACTIVE,
      },
      create: {
        name: 'Royal Furniture',
        slug: 'royal-furniture',
        email: 'contact@royalfurniture.com',
        phone: '+18005550199',
        address: '100 Industrial Parkway',
        city: 'Grand Rapids',
        state: 'MI',
        country: 'USA',
        postalCode: '49501',
        gstNumber: '29ABCDE1234F1Z5',
        status: CompanyStatus.ACTIVE,
      },
    });

    // 3. Create Company Owner User
    const ownerUser = await prisma.user.upsert({
      where: { email: 'owner@royalfurniture.local' },
      update: {
        passwordHash: ownerPasswordHash,
        status: UserStatus.ACTIVE,
        systemRole: SystemRole.COMPANY,
      },
      create: {
        name: 'Arthur Pendelton',
        email: 'owner@royalfurniture.local',
        passwordHash: ownerPasswordHash,
        phone: '+18005550100',
        systemRole: SystemRole.COMPANY,
        status: UserStatus.ACTIVE,
      },
    });

    // 4. Assign Owner Membership
    await prisma.companyMember.upsert({
      where: {
        userId_companyId: {
          userId: ownerUser.id,
          companyId: royalCompany.id,
        },
      },
      update: {
        role: CompanyRole.OWNER,
        status: MemberStatus.ACTIVE,
      },
      create: {
        userId: ownerUser.id,
        companyId: royalCompany.id,
        role: CompanyRole.OWNER,
        status: MemberStatus.ACTIVE,
      },
    });

    // 5. Create Pending User & Access Request
    const pendingUser = await prisma.user.upsert({
      where: { email: 'pendinguser@example.local' },
      update: {
        passwordHash: userPasswordHash,
        status: UserStatus.ACTIVE,
        systemRole: SystemRole.COMPANY,
      },
      create: {
        name: 'Sarah Crafts',
        email: 'pendinguser@example.local',
        passwordHash: userPasswordHash,
        phone: '+18005550200',
        systemRole: SystemRole.COMPANY,
        status: UserStatus.ACTIVE,
      },
    });

    const existingRequest = await prisma.accessRequest.findFirst({
      where: { userId: pendingUser.id },
    });

    if (!existingRequest) {
      await prisma.accessRequest.create({
        data: {
          userId: pendingUser.id,
          requestedCompanyName: 'Comfort Furniture Ltd',
          message: 'Requesting access for Comfort Furniture showroom expansion.',
          status: AccessRequestStatus.PENDING,
        },
      });
    }

    logger.info('🚀 Auto-seed completed successfully! Accounts created: admin@furnitureos.local, owner@royalfurniture.local');
    return { seeded: true, userCount: 3 };
  } catch (error) {
    logger.error({ error }, '❌ Auto-seed execution failed');
    return { seeded: false, error };
  }
}
