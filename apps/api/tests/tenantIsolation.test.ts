import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import bcrypt from 'bcryptjs';

describe('Multi-Tenant Isolation & Security Tests (Requirement 36 & 49)', () => {
  let companyAId: string;
  let companyBId: string;

  let ownerAToken: string;
  let ownerBToken: string;

  beforeAll(async () => {
    // Cleanup test data
    await prisma.auditLog.deleteMany({});
    await prisma.accessRequest.deleteMany({});
    await prisma.companyMember.deleteMany({});
    await prisma.company.deleteMany({});
    await prisma.user.deleteMany({});

    // 1. Setup Company A & Owner A
    const passwordHash = await bcrypt.hash('Password123!', 10);

    const userA = await prisma.user.create({
      data: {
        name: 'Owner Company A',
        email: 'ownerA@companyA.com',
        passwordHash,
      },
    });

    const companyA = await prisma.company.create({
      data: {
        name: 'Company A Furniture',
        slug: 'company-a-furniture',
        status: 'ACTIVE',
      },
    });

    await prisma.companyMember.create({
      data: {
        userId: userA.id,
        companyId: companyA.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });

    companyAId = companyA.id;

    // 2. Setup Company B & Owner B
    const userB = await prisma.user.create({
      data: {
        name: 'Owner Company B',
        email: 'ownerB@companyB.com',
        passwordHash,
      },
    });

    const companyB = await prisma.company.create({
      data: {
        name: 'Company B Furniture',
        slug: 'company-b-furniture',
        status: 'ACTIVE',
      },
    });

    await prisma.companyMember.create({
      data: {
        userId: userB.id,
        companyId: companyB.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });

    companyBId = companyB.id;

    // 3. Login User A
    const resA = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ownerA@companyA.com', password: 'Password123!' });
    ownerAToken = resA.body.data.tokens.accessToken;

    // 4. Login User B
    const resB = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ownerB@companyB.com', password: 'Password123!' });
    ownerBToken = resB.body.data.tokens.accessToken;
  });

  it('Company A user should access Company A data successfully', async () => {
    const res = await request(app)
      .get('/api/v1/company')
      .set('Authorization', `Bearer ${ownerAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.company.id).toBe(companyAId);
    expect(res.body.data.company.name).toBe('Company A Furniture');
  });

  it('Company A user CANNOT pass Company B header to access Company B data (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/company')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .set('x-company-id', companyBId);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('NO_COMPANY_MEMBERSHIP');
  });

  it('Company A user CANNOT access Platform Admin endpoints (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/companies')
      .set('Authorization', `Bearer ${ownerAToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Unauthenticated requests should be rejected with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/v1/company');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
