-- AlterTable companies: add extra company profile fields
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "displayName" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "alternatePhone" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "addressLine2" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "website" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "taxId" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "businessRegistrationNumber" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "logoObjectKey" TEXT;

-- CreateTable tenant_branding
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

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_branding_company_id_key" ON "tenant_branding"("company_id");
CREATE INDEX IF NOT EXISTS "tenant_branding_company_id_idx" ON "tenant_branding"("company_id");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tenant_branding_company_id_fkey'
    ) THEN
        ALTER TABLE "tenant_branding" ADD CONSTRAINT "tenant_branding_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AlterTable invoices: add company snapshot fields (Section 18)
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "companyNameSnapshot" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "companyAddressSnapshot" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "companyPhoneSnapshot" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "companyEmailSnapshot" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "companyTaxNumberSnapshot" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "companyLogoUrlSnapshot" TEXT;
