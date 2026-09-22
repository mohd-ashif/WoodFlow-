import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import bcrypt from 'bcryptjs';
import { ensureTenantBrandingSchema } from '../src/modules/company/branding.service.js';

describe('Company Profile, Branding & Multi-Tenant Isolation Tests (Requirement Section 24, 27, 35)', () => {
  let companyAId: string;
  let companyBId: string;

  let ownerAToken: string;
  let staffAToken: string;
  let ownerBToken: string;

  // 1x1 valid PNG binary buffer (valid magic bytes & IHDR chunk)
  const validPngBuffer = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
    'hex'
  );

  beforeAll(async () => {
    await ensureTenantBrandingSchema();

    // Clean up test data
    await prisma.$executeRawUnsafe(`DELETE FROM "tenant_branding" WHERE 1=1;`).catch(() => {});
    await prisma.invoice.deleteMany({});
    await prisma.saleItem.deleteMany({});
    await prisma.sale.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.companyMember.deleteMany({});
    await prisma.company.deleteMany({});
    await prisma.user.deleteMany({});

    const passwordHash = await bcrypt.hash('Password123!', 10);

    // 1. Setup Company A with Owner A and Staff A
    const userA = await prisma.user.create({
      data: {
        name: 'Owner Company A',
        email: 'ownerA_brand@companya.com',
        passwordHash,
      },
    });

    const staffA = await prisma.user.create({
      data: {
        name: 'Staff Company A',
        email: 'staffA_brand@companya.com',
        passwordHash,
      },
    });

    const companyA = await prisma.company.create({
      data: {
        name: 'Alpha Furniture Corp',
        slug: 'alpha-furniture-corp',
        status: 'ACTIVE',
        email: 'contact@alphafurniture.com',
        phone: '+91 99999 11111',
      },
    });
    companyAId = companyA.id;

    await prisma.companyMember.create({
      data: {
        userId: userA.id,
        companyId: companyA.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });

    await prisma.companyMember.create({
      data: {
        userId: staffA.id,
        companyId: companyA.id,
        role: 'STAFF',
        status: 'ACTIVE',
      },
    });

    // 2. Setup Company B with Owner B
    const userB = await prisma.user.create({
      data: {
        name: 'Owner Company B',
        email: 'ownerB_brand@companyb.com',
        passwordHash,
      },
    });

    const companyB = await prisma.company.create({
      data: {
        name: 'Beta Timber & Desks',
        slug: 'beta-timber-desks',
        status: 'ACTIVE',
        email: 'info@betatimber.com',
        phone: '+91 88888 22222',
      },
    });
    companyBId = companyB.id;

    await prisma.companyMember.create({
      data: {
        userId: userB.id,
        companyId: companyB.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });

    // 3. Obtain JWT Access Tokens
    const resLoginA = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ownerA_brand@companya.com', password: 'Password123!' });
    ownerAToken = resLoginA.body.data.tokens.accessToken;

    const resLoginStaffA = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'staffA_brand@companya.com', password: 'Password123!' });
    staffAToken = resLoginStaffA.body.data.tokens.accessToken;

    const resLoginB = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ownerB_brand@companyb.com', password: 'Password123!' });
    ownerBToken = resLoginB.body.data.tokens.accessToken;
  });

  // ─── Test 1: Retrieve Tenant Branding ─────────────────────────────────────────
  it('Tenant A Owner can retrieve Tenant A branding with default primary and secondary colors', async () => {
    const res = await request(app)
      .get('/api/v1/company/branding')
      .set('Authorization', `Bearer ${ownerAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.branding.companyId).toBe(companyAId);
    expect(res.body.data.branding.primaryColor).toBe('#2563eb');
    expect(res.body.data.branding.secondaryColor).toBe('#1e293b');
  });

  // ─── Test 2: Update Company Profile ───────────────────────────────────────────
  it('Tenant A Owner can update company profile information', async () => {
    const res = await request(app)
      .put('/api/v1/company/profile')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({
        name: 'Alpha Furniture Corp Updated',
        displayName: 'Alpha Living Design',
        phone: '+91 99999 00000',
        alternatePhone: '+91 99999 11112',
        address: 'Plot 42, Woodcraft Road',
        addressLine2: 'Phase 2, Timber Park',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        postalCode: '560001',
        website: 'https://alphaliving.com',
        gstNumber: '29ABCDE1234F1Z5',
        taxId: 'ABCDE1234F',
        businessRegistrationNumber: 'U36100KA2022PTC987654',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.company.displayName).toBe('Alpha Living Design');
    expect(res.body.data.company.city).toBe('Bengaluru');
  });

  // ─── Test 3: Upload Logo ──────────────────────────────────────────────────────
  it('Tenant A Owner can upload valid PNG logo stored in R2 namespace', async () => {
    const res = await request(app)
      .post('/api/v1/company/logo')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .attach('image', validPngBuffer, 'company-logo.png');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.logoUrl).toBeDefined();
    expect(res.body.logoObjectKey).toContain(`tenants/${companyAId}/branding/logo/`);
    expect(res.body.data.branding.logoUrl).toBe(res.body.logoUrl);
  });

  // ─── Test 4: Update Branding Colors ───────────────────────────────────────────
  it('Tenant A Owner can update brand colors', async () => {
    const res = await request(app)
      .put('/api/v1/company/branding')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({
        primaryColor: '#059669',
        secondaryColor: '#0f172a',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.branding.primaryColor).toBe('#059669');
    expect(res.body.data.branding.secondaryColor).toBe('#0f172a');
  });

  // ─── Test 5: Tenant Isolation - Reading Data ──────────────────────────────────
  it('Tenant B CANNOT retrieve Tenant A branding record (strictly isolated to Tenant B)', async () => {
    const res = await request(app)
      .get('/api/v1/company/branding')
      .set('Authorization', `Bearer ${ownerBToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.branding.companyId).toBe(companyBId);
    expect(res.body.data.branding.companyId).not.toBe(companyAId);
  });

  // ─── Test 6: Tenant Isolation - Header Spoofing Blocked ───────────────────────
  it('Tenant B CANNOT pass Tenant A header to access or modify Tenant A profile (403 Forbidden)', async () => {
    const res = await request(app)
      .put('/api/v1/company/profile')
      .set('Authorization', `Bearer ${ownerBToken}`)
      .set('x-company-id', companyAId)
      .send({ name: 'Hacked Alpha Name' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('NO_COMPANY_MEMBERSHIP');

    // Verify Tenant A name remains untouched
    const checkCompanyA = await prisma.company.findUnique({ where: { id: companyAId } });
    expect(checkCompanyA?.name).not.toBe('Hacked Alpha Name');
  });

  // ─── Test 7: Role Authorization - Staff Access Denied ─────────────────────────
  it('Tenant Staff (non-owner) CANNOT upload logo or modify branding (403 Forbidden)', async () => {
    const resLogo = await request(app)
      .post('/api/v1/company/logo')
      .set('Authorization', `Bearer ${staffAToken}`)
      .attach('image', validPngBuffer, 'unauthorized-logo.png');

    expect(resLogo.status).toBe(403);

    const resBranding = await request(app)
      .put('/api/v1/company/branding')
      .set('Authorization', `Bearer ${staffAToken}`)
      .send({ primaryColor: '#ff0000' });

    expect(resBranding.status).toBe(403);
  });

  // ─── Test 8: File Validation - Rejection of SVG / Executable / HTML ───────────
  it('Server rejects unsafe file types (HTML/SVG/Executable) with 400 Bad Request', async () => {
    const fakeSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

    const res = await request(app)
      .post('/api/v1/company/logo')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .attach('image', fakeSvg, 'malicious.svg');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Invalid file extension|MIME type|Forbidden/i);
  });

  // ─── Test 9: File Validation - Fake Extension Rejection ───────────────────────
  it('Server rejects fake extension files without valid image magic bytes with 400 Bad Request', async () => {
    const fakePng = Buffer.from('Plain text masquerading as png image');

    const res = await request(app)
      .post('/api/v1/company/logo')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .attach('image', fakePng, 'fake.png');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/binary header does not match valid JPEG, PNG, or WEBP/i);
  });

  // ─── Test 10: Invoice Snapshot Immutability (Section 18) ──────────────────────
  it('Finalized invoices snapshot company branding; modifying logo later does NOT alter the historical snapshot', async () => {
    // 1. Create a customer and sale for Company A
    const customer = await prisma.customer.create({
      data: {
        companyId: companyAId,
        customerCode: 'CUST-001',
        name: 'Jane Customer',
        phone: '+91 99999 55555',
      },
    });

    const sale = await prisma.sale.create({
      data: {
        companyId: companyAId,
        saleNumber: 'SO-BRAND-001',
        customerId: customer.id,
        status: 'DRAFT',
        subtotal: 10000,
        discountAmount: 0,
        taxAmount: 1800,
        totalAmount: 11800,
        dueAmount: 11800,
      },
    });

    // 2. Confirm the sale, triggering invoice creation with snapshot
    const confirmRes = await request(app)
      .patch(`/api/v1/sales/${sale.id}/confirm`)
      .set('Authorization', `Bearer ${ownerAToken}`);

    expect(confirmRes.status).toBe(200);

    const invoice = await prisma.invoice.findFirst({
      where: { saleId: sale.id, companyId: companyAId },
    });

    expect(invoice).toBeDefined();
    expect((invoice as any)?.companyNameSnapshot).toBe('Alpha Living Design');
    expect((invoice as any).companyLogoUrlSnapshot).toBeDefined();
    const originalInvoiceLogoSnapshot = (invoice as any).companyLogoUrlSnapshot;

    // 3. Company A now removes or changes its logo
    await request(app)
      .delete('/api/v1/company/logo')
      .set('Authorization', `Bearer ${ownerAToken}`);

    // 4. Verify historical invoice snapshot still contains original logo URL!
    const historicInvoice = await prisma.invoice.findUnique({
      where: { id: invoice!.id },
    });

    expect((historicInvoice as any).companyLogoUrlSnapshot).toBe(originalInvoiceLogoSnapshot);
  });

  // ─── Test 11: Logo URL Injection Prevention (Section 17) ──────────────────────
  it('Client CANNOT inject an arbitrary logo URL into invoice; backend derives from verified tenant branding', async () => {
    const customer = await prisma.customer.create({
      data: {
        companyId: companyBId,
        customerCode: 'CUST-002',
        name: 'Bob Customer',
        phone: '+91 88888 66666',
      },
    });

    const sale = await prisma.sale.create({
      data: {
        companyId: companyBId,
        saleNumber: 'SO-INJECT-001',
        customerId: customer.id,
        status: 'DRAFT',
        subtotal: 5000,
        discountAmount: 0,
        taxAmount: 900,
        totalAmount: 5900,
        dueAmount: 5900,
      },
    });

    // Attempting to pass forged logoUrl in confirm request
    const confirmRes = await request(app)
      .patch(`/api/v1/sales/${sale.id}/confirm`)
      .set('Authorization', `Bearer ${ownerBToken}`)
      .send({ logoUrl: 'https://evil.example.com/malicious.png' });

    expect(confirmRes.status).toBe(200);

    const invoiceB = await prisma.invoice.findFirst({
      where: { saleId: sale.id, companyId: companyBId },
    });

    // Proves injected URL was ignored and not placed in the invoice snapshot
    expect((invoiceB as any).companyLogoUrlSnapshot).not.toBe('https://evil.example.com/malicious.png');
  });
});
