import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import bcrypt from 'bcryptjs';

describe('Phase 2 — Products, Categories & Inventory API Tests', () => {
  let companyAId: string;
  let companyBId: string;

  let ownerAToken: string;
  let ownerBToken: string;

  let categoryAId: string;
  let unitAId: string;
  let productAId: string;

  beforeAll(async () => {
    // 1. Setup Company A & Owner A
    const passwordHash = await bcrypt.hash('Password123!', 10);

    const userA = await prisma.user.create({
      data: {
        name: 'Company A User',
        email: 'usera@companya.com',
        passwordHash,
      },
    });

    const companyA = await prisma.company.create({
      data: {
        name: 'Company A Woodworks',
        slug: 'company-a-woodworks',
        status: 'ACTIVE',
        allowNegativeStock: false,
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
        name: 'Company B Crafting',
        email: 'userb@companyb.com',
        passwordHash,
      },
    });

    const companyB = await prisma.company.create({
      data: {
        name: 'Company B Crafting',
        slug: 'company-b-crafting',
        status: 'ACTIVE',
        allowNegativeStock: false,
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

    // 3. Login Users
    const resA = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'usera@companya.com', password: 'Password123!' });
    ownerAToken = resA.body.data.tokens.accessToken;

    const resB = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'userb@companyb.com', password: 'Password123!' });
    ownerBToken = resB.body.data.tokens.accessToken;
  });

  // ---------------------------------------------------------------------------
  // CATEGORIES TESTS
  // ---------------------------------------------------------------------------
  describe('Categories Management', () => {
    it('should create a new category for Company A', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({ name: 'Sofa Chairs', description: 'Comfortable sofa chairs' });

      expect(res.status).toBe(210);
      expect(res.body.success).toBe(true);
      expect(res.body.data.category.name).toBe('Sofa Chairs');
      categoryAId = res.body.data.category.id;
    });

    it('should prevent creating a duplicate category name in Company A', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({ name: 'Sofa Chairs' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should allow Company B to create a category with the same name', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${ownerBToken}`)
        .send({ name: 'Sofa Chairs' });

      expect(res.status).toBe(210);
      expect(res.body.success).toBe(true);
    });

    it('should list categories belonging only to Company A', async () => {
      const res = await request(app)
        .get('/api/v1/categories')
        .set('Authorization', `Bearer ${ownerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // It should include the newly created category as well as the default onboarding categories
      const sofaChairs = res.body.data.categories.find((c: any) => c.id === categoryAId);
      expect(sofaChairs).toBeDefined();
      expect(sofaChairs.companyId).toBe(companyAId);
    });

    it('should deactivate category successfully', async () => {
      const res = await request(app)
        .post(`/api/v1/categories/${categoryAId}/deactivate`)
        .set('Authorization', `Bearer ${ownerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.category.isActive).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // UNITS TESTS
  // ---------------------------------------------------------------------------
  describe('Units Management', () => {
    it('should create a new unit for Company A', async () => {
      const res = await request(app)
        .post('/api/v1/units')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({ name: 'Piece', shortCode: 'pcs' });

      expect(res.status).toBe(210);
      expect(res.body.success).toBe(true);
      expect(res.body.data.unit.shortCode).toBe('pcs');
      unitAId = res.body.data.unit.id;
    });

    it('should prevent creating a duplicate shortCode in Company A', async () => {
      const res = await request(app)
        .post('/api/v1/units')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({ name: 'Pieces', shortCode: 'pcs' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should deactivate unit successfully', async () => {
      const res = await request(app)
        .post(`/api/v1/units/${unitAId}/deactivate`)
        .set('Authorization', `Bearer ${ownerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.unit.isActive).toBe(false);

      // Reactivate for product usage
      await prisma.unit.update({ where: { id: unitAId }, data: { isActive: true } });
      await prisma.category.update({ where: { id: categoryAId }, data: { isActive: true } });
    });
  });

  // ---------------------------------------------------------------------------
  // PRODUCTS & OPENING STOCK TESTS
  // ---------------------------------------------------------------------------
  describe('Product Creation & Cataloging', () => {
    it('should create a finished product with opening stock in a transaction', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({
          name: 'Executive Office Chair',
          sku: 'CHAIR-OFF-001',
          productType: 'FINISHED_PRODUCT',
          categoryId: categoryAId,
          unitId: unitAId,
          purchasePrice: 4000,
          sellingPrice: 7500,
          minimumStock: 5,
          openingStock: 25,
        });

      expect(res.status).toBe(210);
      expect(res.body.success).toBe(true);
      productAId = res.body.data.product.id;
      expect(res.body.data.product.currentStock).toBe(25);

      // Verify inventory record exists
      const inventory = await prisma.inventory.findUnique({
        where: { productId: productAId },
      });
      expect(inventory).toBeDefined();
      expect(inventory?.currentQuantity).toBe(25);

      // Verify stock movement of type OPENING_STOCK was logged
      const movement = await prisma.stockMovement.findFirst({
        where: { productId: productAId, movementType: 'OPENING_STOCK' },
      });
      expect(movement).toBeDefined();
      expect(movement?.quantity).toBe(25);
    });

    it('should prevent cataloging duplicate SKU in same company', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({
          name: 'Task Chair',
          sku: 'CHAIR-OFF-001',
          productType: 'FINISHED_PRODUCT',
          categoryId: categoryAId,
          unitId: unitAId,
          purchasePrice: 3000,
          sellingPrice: 5000,
          minimumStock: 2,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should allow Company B to use the same SKU code', async () => {
      // Find or create Category and Unit for Company B first
      const catB = await prisma.category.findFirst({ where: { companyId: companyBId } });
      const unitB = await prisma.unit.create({
        data: { companyId: companyBId, name: 'Piece', shortCode: 'pcs', isActive: true },
      });

      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${ownerBToken}`)
        .send({
          name: 'Executive Office Chair',
          sku: 'CHAIR-OFF-001',
          productType: 'FINISHED_PRODUCT',
          categoryId: catB?.id,
          unitId: unitB.id,
          purchasePrice: 4000,
          sellingPrice: 7500,
          minimumStock: 5,
        });

      expect(res.status).toBe(210);
      expect(res.body.success).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // STOCK ADJUSTMENT & SEGREGATION TESTS
  // ---------------------------------------------------------------------------
  describe('Inventory Stock Adjustments', () => {
    it('should process manual stock adjustment IN (+5)', async () => {
      const res = await request(app)
        .post('/api/v1/inventory/adjust')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({
          productId: productAId,
          type: 'IN',
          quantity: 5,
          reason: 'Physical stock correction',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.updatedInventory.currentQuantity).toBe(30);

      // Verify product cache synced
      const product = await prisma.product.findUnique({ where: { id: productAId } });
      expect(product?.currentStock).toBe(30);

      // Verify movement logged
      const movement = await prisma.stockMovement.findFirst({
        where: { productId: productAId, movementType: 'STOCK_ADJUSTMENT_IN' },
        orderBy: { createdAt: 'desc' },
      });
      expect(movement?.quantity).toBe(5);
      expect(movement?.previousQuantity).toBe(25);
      expect(movement?.newQuantity).toBe(30);
    });

    it('should process manual stock adjustment OUT (-10)', async () => {
      const res = await request(app)
        .post('/api/v1/inventory/adjust')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({
          productId: productAId,
          type: 'OUT',
          quantity: 10,
          reason: 'Physical stock correction',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.updatedInventory.currentQuantity).toBe(20);
    });

    it('should prevent stock adjustment OUT that causes negative stock when not allowed', async () => {
      const res = await request(app)
        .post('/api/v1/inventory/adjust')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({
          productId: productAId,
          type: 'OUT',
          quantity: 25,
          reason: 'Stock correction',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INSUFFICIENT_STOCK');
    });
  });

  // ---------------------------------------------------------------------------
  // TENANT ISOLATION TESTS
  // ---------------------------------------------------------------------------
  describe('Tenant Security & Isolation', () => {
    it('Company B user CANNOT adjust stock of Company A product (404/403 Failure)', async () => {
      const res = await request(app)
        .post('/api/v1/inventory/adjust')
        .set('Authorization', `Bearer ${ownerBToken}`)
        .send({
          productId: productAId,
          type: 'IN',
          quantity: 5,
          reason: 'Attempted hack',
        });

      // Product isn't owned by Company B, should return 404 Not Found since it handles isolation
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('Company B user CANNOT read Company A product details', async () => {
      const res = await request(app)
        .get(`/api/v1/products/${productAId}`)
        .set('Authorization', `Bearer ${ownerBToken}`);

      expect(res.status).toBe(404);
    });

    it('Company B user CANNOT deactivate Company A product', async () => {
      const res = await request(app)
        .post(`/api/v1/products/${productAId}/deactivate`)
        .set('Authorization', `Bearer ${ownerBToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ---------------------------------------------------------------------------
  // CONCURRENCY LOCKING TEST
  // ---------------------------------------------------------------------------
  describe('Concurrency & Lock handling', () => {
    it('should process simultaneous stock additions correctly without race condition values', async () => {
      // Direct integration test: run adjustment IN and OUT queries concurrently using Promise.all
      // Initial is 20
      const promise1 = request(app)
        .post('/api/v1/inventory/adjust')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({
          productId: productAId,
          type: 'IN',
          quantity: 10,
          reason: 'Concurrent addition A',
        });

      const promise2 = request(app)
        .post('/api/v1/inventory/adjust')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({
          productId: productAId,
          type: 'OUT',
          quantity: 5,
          reason: 'Concurrent subtraction B',
        });

      const [res1, res2] = await Promise.all([promise1, promise2]);

      // Both should succeed
      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);

      // Final stock must reflect +10 and -5 which is 20 + 10 - 5 = 25
      const product = await prisma.product.findUnique({
        where: { id: productAId },
      });
      expect(product?.currentStock).toBe(25);
    });
  });
});
