import { prisma } from '../../config/prisma.js';
import { r2StorageService } from '../../services/r2Storage.service.js';
import { ImageValidator } from '../../utils/imageValidator.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { createAuditLog } from '../audit/audit.service.js';
import { UploadedFile } from '../../utils/storage.js';
import { UpdateBrandingInput, TenantBrandingDTO } from '@furniture-os/shared';

let schemaInitialized = false;

/**
 * Idempotently ensure the tenant_branding table and columns exist in PostgreSQL
 */
export async function ensureTenantBrandingSchema(): Promise<void> {
  if (schemaInitialized) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "tenant_branding" (
        "id" TEXT NOT NULL,
        "company_id" TEXT NOT NULL,
        "logo_url" TEXT,
        "logo_object_key" TEXT,
        "invoice_logo_url" TEXT,
        "invoice_logo_object_key" TEXT,
        "favicon_url" TEXT,
        "favicon_object_key" TEXT,
        "primary_color" TEXT DEFAULT '#2563eb',
        "secondary_color" TEXT DEFAULT '#1e293b',
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "tenant_branding_pkey" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "tenant_branding_company_id_key" ON "tenant_branding"("company_id");
      CREATE INDEX IF NOT EXISTS "tenant_branding_company_id_idx" ON "tenant_branding"("company_id");

      ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "displayName" TEXT;
      ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "alternatePhone" TEXT;
      ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "addressLine2" TEXT;
      ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "website" TEXT;
      ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "taxId" TEXT;
      ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "businessRegistrationNumber" TEXT;
      ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "logoObjectKey" TEXT;

      ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "companyNameSnapshot" TEXT;
      ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "companyAddressSnapshot" TEXT;
      ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "companyPhoneSnapshot" TEXT;
      ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "companyEmailSnapshot" TEXT;
      ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "companyTaxNumberSnapshot" TEXT;
      ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "companyLogoUrlSnapshot" TEXT;
    `);
    schemaInitialized = true;
  } catch {
    // If schema already exists or in transaction, continue gracefully
    schemaInitialized = true;
  }
}

/**
 * Retrieve tenant branding for a company
 */
export async function getTenantBranding(companyId: string): Promise<TenantBrandingDTO> {
  await ensureTenantBrandingSchema();

  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM "tenant_branding" WHERE "company_id" = $1 LIMIT 1`,
    companyId
  );

  if (rows && rows.length > 0) {
    return formatBrandingDTO(rows[0]);
  }

  // Check if company has a logo on the company record
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { logo: true },
  });

  if (!company) {
    throw new NotFoundError('Company not found');
  }

  // Create default branding entry for this company
  const id = `tb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();

  await prisma.$executeRawUnsafe(
    `INSERT INTO "tenant_branding" ("id", "company_id", "logo_url", "primary_color", "secondary_color", "created_at", "updated_at")
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT ("company_id") DO UPDATE SET "updated_at" = $7`,
    id,
    companyId,
    company.logo || null,
    '#2563eb',
    '#1e293b',
    now,
    now
  );

  const inserted = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM "tenant_branding" WHERE "company_id" = $1 LIMIT 1`,
    companyId
  );

  return formatBrandingDTO(inserted[0]);
}

/**
 * Update tenant branding colors and favicon
 */
export async function updateTenantBranding(
  companyId: string,
  input: UpdateBrandingInput,
  actorUserId: string
): Promise<TenantBrandingDTO> {
  await ensureTenantBrandingSchema();

  const existing = await getTenantBranding(companyId);
  const now = new Date();

  const primaryColor = input.primaryColor !== undefined ? input.primaryColor : existing.primaryColor;
  const secondaryColor = input.secondaryColor !== undefined ? input.secondaryColor : existing.secondaryColor;
  const faviconUrl = input.faviconUrl !== undefined ? input.faviconUrl : existing.faviconUrl;

  await prisma.$executeRawUnsafe(
    `UPDATE "tenant_branding"
     SET "primary_color" = $1, "secondary_color" = $2, "favicon_url" = $3, "updated_at" = $4
     WHERE "company_id" = $5`,
    primaryColor,
    secondaryColor,
    faviconUrl,
    now,
    companyId
  );

  await createAuditLog({
    userId: actorUserId,
    companyId,
    action: 'COMPANY_PROFILE_UPDATED',
    entity: 'TenantBranding',
    entityId: existing.id,
    metadata: { changes: input },
  });

  return getTenantBranding(companyId);
}

/**
 * Upload and replace Company Logo
 */
export async function uploadCompanyLogo(
  companyId: string,
  file: UploadedFile,
  actorUserId: string
): Promise<{ logoUrl: string; logoObjectKey: string; branding: TenantBrandingDTO }> {
  await ensureTenantBrandingSchema();

  // 1. Validate File: size, magic bytes, dimensions
  const validation = ImageValidator.validateImage(file);
  if (validation.dimensions) {
    if (validation.dimensions.width && validation.dimensions.width > 2000) {
      throw new BadRequestError(`Image width (${validation.dimensions.width}px) exceeds recommended 2000px maximum`);
    }
    if (validation.dimensions.height && validation.dimensions.height > 2000) {
      throw new BadRequestError(`Image height (${validation.dimensions.height}px) exceeds recommended 2000px maximum`);
    }
  }

  // 2. Fetch existing branding to note old R2 object key
  const existing = await getTenantBranding(companyId);
  const oldObjectKey = existing.logoObjectKey;
  const isReplacing = Boolean(oldObjectKey);

  // 3. Upload new object to Cloudflare R2
  const uploadResult = await r2StorageService.uploadObject(
    companyId,
    'logo',
    file.name,
    file.data,
    file.mimetype
  );

  const now = new Date();

  try {
    // 4. Update SQL tenant_branding and company.logo atomically
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `UPDATE "tenant_branding"
         SET "logo_url" = $1, "logo_object_key" = $2, "updated_at" = $3
         WHERE "company_id" = $4`,
        uploadResult.url,
        uploadResult.objectKey,
        now,
        companyId
      );

      await tx.$executeRawUnsafe(
        `UPDATE "companies"
         SET "logo" = $1, "logoObjectKey" = $2, "updatedAt" = $3
         WHERE "id" = $4`,
        uploadResult.url,
        uploadResult.objectKey,
        now,
        companyId
      );
    });
  } catch (dbError) {
    // Clean up orphaned newly uploaded R2 object if DB write failed
    await r2StorageService.deleteObject(companyId, uploadResult.objectKey).catch(() => {});
    throw dbError;
  }

  // 5. Delete old R2 object only after SQL database write is verified
  if (oldObjectKey && oldObjectKey !== uploadResult.objectKey) {
    r2StorageService.deleteObject(companyId, oldObjectKey).catch(() => {});
  }

  // 6. Record Audit Log
  await createAuditLog({
    userId: actorUserId,
    companyId,
    action: isReplacing ? 'COMPANY_LOGO_REPLACED' : 'COMPANY_LOGO_UPLOADED',
    entity: 'TenantBranding',
    entityId: companyId,
    metadata: {
      url: uploadResult.url,
      objectKey: uploadResult.objectKey,
      fileSize: file.size,
      dimensions: validation.dimensions,
    },
  });

  const updatedBranding = await getTenantBranding(companyId);

  return {
    logoUrl: uploadResult.url,
    logoObjectKey: uploadResult.objectKey,
    branding: updatedBranding,
  };
}

/**
 * Remove Company Logo
 */
export async function removeCompanyLogo(
  companyId: string,
  actorUserId: string
): Promise<{ success: boolean; branding: TenantBrandingDTO }> {
  await ensureTenantBrandingSchema();

  const existing = await getTenantBranding(companyId);
  const oldObjectKey = existing.logoObjectKey;

  const now = new Date();

  // 1. Update SQL records to null
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `UPDATE "tenant_branding"
       SET "logo_url" = NULL, "logo_object_key" = NULL, "updated_at" = $1
       WHERE "company_id" = $2`,
      now,
      companyId
    );

    await tx.$executeRawUnsafe(
      `UPDATE "companies"
       SET "logo" = NULL, "logoObjectKey" = NULL, "updatedAt" = $1
       WHERE "id" = $2`,
      now,
      companyId
    );
  });

  // 2. Remove old R2 object
  if (oldObjectKey) {
    await r2StorageService.deleteObject(companyId, oldObjectKey).catch(() => {});
  }

  // 3. Record Audit Log
  await createAuditLog({
    userId: actorUserId,
    companyId,
    action: 'COMPANY_LOGO_REMOVED',
    entity: 'TenantBranding',
    entityId: companyId,
    metadata: { previousObjectKey: oldObjectKey },
  });

  const updatedBranding = await getTenantBranding(companyId);

  return {
    success: true,
    branding: updatedBranding,
  };
}

/**
 * Upload and replace Invoice Logo
 */
export async function uploadInvoiceLogo(
  companyId: string,
  file: UploadedFile,
  actorUserId: string
): Promise<{ invoiceLogoUrl: string; invoiceLogoObjectKey: string; branding: TenantBrandingDTO }> {
  await ensureTenantBrandingSchema();

  const validation = ImageValidator.validateImage(file);
  const existing = await getTenantBranding(companyId);
  const oldObjectKey = existing.invoiceLogoObjectKey;

  const uploadResult = await r2StorageService.uploadObject(
    companyId,
    'invoice_logo',
    file.name,
    file.data,
    file.mimetype
  );

  const now = new Date();

  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "tenant_branding"
       SET "invoice_logo_url" = $1, "invoice_logo_object_key" = $2, "updated_at" = $3
       WHERE "company_id" = $4`,
      uploadResult.url,
      uploadResult.objectKey,
      now,
      companyId
    );
  } catch (err) {
    await r2StorageService.deleteObject(companyId, uploadResult.objectKey).catch(() => {});
    throw err;
  }

  if (oldObjectKey && oldObjectKey !== uploadResult.objectKey) {
    r2StorageService.deleteObject(companyId, oldObjectKey).catch(() => {});
  }

  await createAuditLog({
    userId: actorUserId,
    companyId,
    action: 'COMPANY_PROFILE_UPDATED',
    entity: 'TenantBranding',
    entityId: companyId,
    metadata: {
      type: 'INVOICE_LOGO_UPDATED',
      url: uploadResult.url,
      objectKey: uploadResult.objectKey,
    },
  });

  const updatedBranding = await getTenantBranding(companyId);

  return {
    invoiceLogoUrl: uploadResult.url,
    invoiceLogoObjectKey: uploadResult.objectKey,
    branding: updatedBranding,
  };
}

/**
 * Remove Invoice Logo
 */
export async function removeInvoiceLogo(
  companyId: string,
  actorUserId: string
): Promise<{ success: boolean; branding: TenantBrandingDTO }> {
  await ensureTenantBrandingSchema();

  const existing = await getTenantBranding(companyId);
  const oldObjectKey = existing.invoiceLogoObjectKey;

  const now = new Date();

  await prisma.$executeRawUnsafe(
    `UPDATE "tenant_branding"
     SET "invoice_logo_url" = NULL, "invoice_logo_object_key" = NULL, "updated_at" = $1
     WHERE "company_id" = $2`,
    now,
    companyId
  );

  if (oldObjectKey) {
    await r2StorageService.deleteObject(companyId, oldObjectKey).catch(() => {});
  }

  await createAuditLog({
    userId: actorUserId,
    companyId,
    action: 'COMPANY_PROFILE_UPDATED',
    entity: 'TenantBranding',
    entityId: companyId,
    metadata: { type: 'INVOICE_LOGO_REMOVED' },
  });

  const updatedBranding = await getTenantBranding(companyId);

  return {
    success: true,
    branding: updatedBranding,
  };
}

function formatBrandingDTO(row: any): TenantBrandingDTO {
  return {
    id: row.id,
    companyId: row.company_id,
    logoUrl: row.logo_url || null,
    logoObjectKey: row.logo_object_key || null,
    invoiceLogoUrl: row.invoice_logo_url || null,
    invoiceLogoObjectKey: row.invoice_logo_object_key || null,
    faviconUrl: row.favicon_url || null,
    faviconObjectKey: row.favicon_object_key || null,
    primaryColor: row.primary_color || '#2563eb',
    secondaryColor: row.secondary_color || '#1e293b',
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}
