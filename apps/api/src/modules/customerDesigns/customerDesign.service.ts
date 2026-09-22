import { prisma } from '../../config/prisma.js';
import { CreateCustomerDesignInput, UpdateCustomerDesignInput } from '@furniture-os/shared';
import { NotFoundError } from '../../utils/errors.js';
import { createAuditLog } from '../audit/audit.service.js';
import { randomUUID } from 'crypto';

let tablesInitialized = false;

export async function ensureCustomerDesignsTableExist() {
  if (tablesInitialized) return;
  try {
    // 1. Create enum safely if not exists
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "CustomerDesignStatus" AS ENUM (
          'DRAFT',
          'DESIGNING',
          'APPROVAL_PENDING',
          'APPROVED',
          'REJECTED',
          'CONVERTED_TO_ORDER',
          'CANCELLED'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Create customer_designs table safely if not exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS customer_designs (
        id TEXT PRIMARY KEY,
        "companyId" TEXT NOT NULL,
        "customerId" TEXT NOT NULL,
        "productTemplateId" TEXT,
        "designNumber" TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        width DOUBLE PRECISION,
        height DOUBLE PRECISION,
        depth DOUBLE PRECISION,
        finish TEXT,
        material TEXT,
        color TEXT,
        style TEXT,
        notes TEXT,
        attachments JSONB,
        drawings JSONB,
        images JSONB,
        status TEXT NOT NULL DEFAULT 'DRAFT',
        "createdBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Create indices
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "customer_designs_companyId_designNumber_key" 
      ON customer_designs ("companyId", "designNumber");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "customer_designs_companyId_idx" 
      ON customer_designs ("companyId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "customer_designs_companyId_customerId_idx" 
      ON customer_designs ("companyId", "customerId");
    `);

    tablesInitialized = true;
  } catch (err) {
    console.error('Failed to ensure customer_designs table exists:', err);
  }
}

export async function generateNextDesignNumber(tx: any, companyId: string): Promise<string> {
  await ensureCustomerDesignsTableExist();
  if (tx && tx.customerDesign && typeof tx.customerDesign.count === 'function') {
    const count = await tx.customerDesign.count({ where: { companyId } });
    const codeStr = String(count + 1).padStart(5, '0');
    return `DES-${codeStr}`;
  }

  const result: any[] = await prisma.$queryRawUnsafe(
    'SELECT count(*)::int as count FROM customer_designs WHERE "companyId" = $1',
    companyId
  );
  const count = result[0]?.count || 0;
  return `DES-${String(count + 1).padStart(5, '0')}`;
}

export async function createCustomerDesign(companyId: string, input: CreateCustomerDesignInput, userId: string) {
  await ensureCustomerDesignsTableExist();
  const db = prisma as any;

  const customer = await db.customer.findFirst({
    where: { id: input.customerId, companyId },
  });

  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  if (db.customerDesign && typeof db.customerDesign.create === 'function') {
    return prisma.$transaction(async (tx: any) => {
      const designNumber = await generateNextDesignNumber(tx, companyId);

      const design = await tx.customerDesign.create({
        data: {
          companyId,
          customerId: input.customerId,
          productTemplateId: input.productTemplateId || null,
          designNumber,
          name: input.name,
          description: input.description || null,
          width: input.width || null,
          height: input.height || null,
          depth: input.depth || null,
          finish: input.finish || null,
          material: input.material || null,
          color: input.color || null,
          style: input.style || null,
          notes: input.notes || null,
          attachments: input.attachments || null,
          drawings: input.drawings || null,
          images: input.images || null,
          status: 'DRAFT',
          createdBy: userId,
        },
        include: {
          customer: true,
          productTemplate: true,
        },
      });

      await createAuditLog({
        userId,
        companyId,
        action: 'CUSTOMER_DESIGN_CREATED',
        entity: 'CustomerDesign',
        entityId: design.id,
        metadata: { designNumber: design.designNumber, name: design.name },
      });

      return design;
    });
  }

  // Fallback if Prisma Client hasn't been generated for CustomerDesign
  const designNumber = await generateNextDesignNumber(null, companyId);
  const id = `des_${randomUUID().replace(/-/g, '').slice(0, 20)}`;

  await prisma.$executeRawUnsafe(
    `INSERT INTO customer_designs (
      id, "companyId", "customerId", "productTemplateId", "designNumber",
      name, description, width, height, depth, finish, material, color, style, notes,
      attachments, drawings, images, status, "createdBy", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW())`,
    id,
    companyId,
    input.customerId,
    input.productTemplateId || null,
    designNumber,
    input.name,
    input.description || null,
    input.width ?? null,
    input.height ?? null,
    input.depth ?? null,
    input.finish || null,
    input.material || null,
    input.color || null,
    input.style || null,
    input.notes || null,
    input.attachments ? JSON.stringify(input.attachments) : null,
    input.drawings ? JSON.stringify(input.drawings) : null,
    input.images ? JSON.stringify(input.images) : null,
    'DRAFT',
    userId || null
  );

  const createdDesign = {
    id,
    companyId,
    customerId: input.customerId,
    productTemplateId: input.productTemplateId || null,
    designNumber,
    name: input.name,
    description: input.description || null,
    width: input.width ?? null,
    height: input.height ?? null,
    depth: input.depth ?? null,
    finish: input.finish || null,
    material: input.material || null,
    color: input.color || null,
    style: input.style || null,
    notes: input.notes || null,
    attachments: input.attachments || null,
    drawings: input.drawings || null,
    images: input.images || null,
    status: 'DRAFT',
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    customer,
    productTemplate: null,
  };

  await createAuditLog({
    userId,
    companyId,
    action: 'CUSTOMER_DESIGN_CREATED',
    entity: 'CustomerDesign',
    entityId: id,
    metadata: { designNumber, name: input.name },
  });

  return createdDesign;
}

export async function listCustomerDesigns(companyId: string, customerId?: string) {
  await ensureCustomerDesignsTableExist();
  const db = prisma as any;

  if (db.customerDesign && typeof db.customerDesign.findMany === 'function') {
    const where: any = { companyId };
    if (customerId) {
      where.customerId = customerId;
    }

    return db.customerDesign.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, customerCode: true, phone: true } },
        productTemplate: { select: { id: true, name: true, code: true } },
        quotations: { select: { id: true, quotationNumber: true, status: true, totalAmount: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Fallback SQL query if Prisma Client hasn't been generated
  const params: any[] = [companyId];
  let query = `
    SELECT d.*,
           json_build_object('id', c.id, 'name', c.name, 'customerCode', c."customerCode", 'phone', c.phone) as customer
    FROM customer_designs d
    LEFT JOIN customers c ON d."customerId" = c.id
    WHERE d."companyId" = $1
  `;
  if (customerId) {
    params.push(customerId);
    query += ` AND d."customerId" = $2`;
  }
  query += ` ORDER BY d."createdAt" DESC`;

  const rows: any[] = await prisma.$queryRawUnsafe(query, ...params);
  return rows || [];
}

export async function getCustomerDesignById(companyId: string, id: string) {
  await ensureCustomerDesignsTableExist();
  const db = prisma as any;

  if (db.customerDesign && typeof db.customerDesign.findFirst === 'function') {
    const design = await db.customerDesign.findFirst({
      where: { id, companyId },
      include: {
        customer: true,
        productTemplate: true,
        creator: { select: { id: true, name: true, email: true } },
        quotations: true,
        sales: true,
        workOrders: true,
      },
    });

    if (!design) {
      throw new NotFoundError('Customer design not found');
    }

    return design;
  }

  // Fallback SQL
  const rows: any[] = await prisma.$queryRawUnsafe(
    `SELECT d.*,
            json_build_object('id', c.id, 'name', c.name, 'customerCode', c."customerCode", 'phone', c.phone, 'email', c.email) as customer
     FROM customer_designs d
     LEFT JOIN customers c ON d."customerId" = c.id
     WHERE d.id = $1 AND d."companyId" = $2`,
    id,
    companyId
  );

  if (!rows || rows.length === 0) {
    throw new NotFoundError('Customer design not found');
  }

  return rows[0];
}

export async function updateCustomerDesign(
  companyId: string,
  id: string,
  input: UpdateCustomerDesignInput,
  userId: string
) {
  await ensureCustomerDesignsTableExist();
  const db = prisma as any;

  if (db.customerDesign && typeof db.customerDesign.update === 'function') {
    const existing = await db.customerDesign.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      throw new NotFoundError('Customer design not found');
    }

    const updated = await db.customerDesign.update({
      where: { id },
      data: {
        ...input,
        updatedAt: new Date(),
      },
      include: {
        customer: true,
        productTemplate: true,
      },
    });

    await createAuditLog({
      userId,
      companyId,
      action: 'CUSTOMER_DESIGN_UPDATED',
      entity: 'CustomerDesign',
      entityId: id,
      metadata: { designNumber: updated.designNumber, status: updated.status },
    });

    return updated;
  }

  // Fallback SQL update
  const existingRows: any[] = await prisma.$queryRawUnsafe(
    'SELECT * FROM customer_designs WHERE id = $1 AND "companyId" = $2',
    id,
    companyId
  );
  if (!existingRows || existingRows.length === 0) {
    throw new NotFoundError('Customer design not found');
  }

  const existing = existingRows[0];
  const updatedStatus = input.status || existing.status;
  const updatedName = input.name || existing.name;

  await prisma.$executeRawUnsafe(
    `UPDATE customer_designs SET
      name = COALESCE($1, name),
      description = COALESCE($2, description),
      width = COALESCE($3, width),
      height = COALESCE($4, height),
      depth = COALESCE($5, depth),
      finish = COALESCE($6, finish),
      material = COALESCE($7, material),
      notes = COALESCE($8, notes),
      status = COALESCE($9, status),
      "updatedAt" = NOW()
     WHERE id = $10 AND "companyId" = $11`,
    input.name || null,
    input.description || null,
    input.width ?? null,
    input.height ?? null,
    input.depth ?? null,
    input.finish || null,
    input.material || null,
    input.notes || null,
    input.status || null,
    id,
    companyId
  );

  await createAuditLog({
    userId,
    companyId,
    action: 'CUSTOMER_DESIGN_UPDATED',
    entity: 'CustomerDesign',
    entityId: id,
    metadata: { designNumber: existing.designNumber, status: updatedStatus },
  });

  return getCustomerDesignById(companyId, id);
}
