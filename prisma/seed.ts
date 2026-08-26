import { PrismaClient, SystemRole, CompanyRole, UserStatus, CompanyStatus, MemberStatus, AccessRequestStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding FurnitureOS database...');

  // Hash passwords
  const adminPasswordHash = await bcrypt.hash('AdminPass123!', 10);
  const ownerPasswordHash = await bcrypt.hash('OwnerPass123!', 10);
  const userPasswordHash = await bcrypt.hash('UserPass123!', 10);

  // 1. Create Platform Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@furnitureos.local' },
    update: {},
    create: {
      name: 'Platform Administrator',
      email: 'admin@furnitureos.local',
      passwordHash: adminPasswordHash,
      phone: '+10000000000',
      systemRole: SystemRole.PLATFORM_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  console.log('✅ Admin User created:', adminUser.email);

  // 2. Create Demo Company (Royal Furniture)
  const royalCompany = await prisma.company.upsert({
    where: { slug: 'royal-furniture' },
    update: {},
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

  console.log('✅ Demo Company created:', royalCompany.name);

  // 3. Create Company Owner User
  const ownerUser = await prisma.user.upsert({
    where: { email: 'owner@royalfurniture.local' },
    update: {},
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
    update: {},
    create: {
      userId: ownerUser.id,
      companyId: royalCompany.id,
      role: CompanyRole.OWNER,
      status: MemberStatus.ACTIVE,
    },
  });

  console.log('✅ Company Owner created:', ownerUser.email);

  // 5. Create Pending User & Access Request
  const pendingUser = await prisma.user.upsert({
    where: { email: 'pendinguser@example.local' },
    update: {},
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
    console.log('✅ Pending Access Request created for:', pendingUser.email);
  }

  // 6. Create initial Audit Log
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      companyId: royalCompany.id,
      action: 'SYSTEM_SEED',
      entity: 'System',
      entityId: 'seed',
      metadata: { note: 'Initial seed completed successfully' },
      ipAddress: '127.0.0.1',
      userAgent: 'Prisma Seed Script',
    },
  });

  console.log('🚀 Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
