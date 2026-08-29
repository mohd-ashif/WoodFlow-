# FurnitureOS — Database Architecture & Schema Design

## 1. Overview
FurnitureOS utilizes Neon PostgreSQL managed via Prisma ORM. Data architecture is designed for high multi-tenant isolation, data integrity, non-destructive auditability, and atomic inventory transactions.

---

## 2. Core Entities & Tenant Boundaries

### System & Auth Tables
- `users`: Global accounts storing credentials, system role (`PLATFORM_ADMIN` vs `COMPANY`), and account status (`ACTIVE`, `INACTIVE`, `SUSPENDED`).
- `companies`: Tenant company entities storing company profile, slug, and status.
- `company_members`: Junction table linking `users` to `companies` with role (`OWNER`, `MANAGER`, `STAFF`, `WORKER`, `MEMBER`) and member status (`ACTIVE`, `INACTIVE`).
- `access_requests`: Platform access onboarding request queue.
- `audit_logs`: System-wide and tenant-scoped audit trail for compliance and tracking.

### Inventory & Product Catalog Tables
- `categories`: Tenant-scoped product categories (`@@unique([companyId, name])`).
- `units`: Measurement units (`@@unique([companyId, name])`, `@@unique([companyId, shortCode])`).
- `products`: Product master table (`@@unique([companyId, sku])`).
- `inventories`: Row-level locked stock levels (`productId` unique 1-to-1).
- `stock_movements`: Immutable log of stock additions, deductions, adjustments, returns, and reversals (`@@index([companyId, createdAt])`).

### CRM Tables
- `customers`: Customer directory (`@@unique([companyId, customerCode])`).
- `customer_addresses`: Address master for customers.
- `customer_notes`: Notes associated with customers.
- `suppliers`: Supplier directory (`@@unique([companyId, supplierCode])`).
- `supplier_addresses`: Address master for suppliers.
- `supplier_notes`: Notes associated with suppliers.
- `crm_activities`: Timeline entries for CRM activities.
- `tags` / `customer_tags` / `supplier_tags`: Polymorphic customer and supplier tagging.

### Transactional Modules (Sales & Purchases)
- `sales`: Sales orders (`@@unique([companyId, saleNumber])`).
- `sale_items`: Item line items snapshotting product details and unit prices.
- `invoices`: Sales invoices (`@@unique([companyId, invoiceNumber])`).
- `purchases`: Supplier purchase orders (`@@unique([companyId, purchaseNumber])`).
- `purchase_items`: Purchase order line items snapshotting product details and cost prices.

---

## 3. Transaction Safety & Isolation Rules

1. **Composite Tenant Keys**:
   All tenant-owned tables enforce `companyId` foreign key and composite unique constraints to guarantee zero tenant cross-contamination.

2. **Row Locking (`FOR UPDATE`)**:
   Inventory mutations during sale confirmation and purchase receipt execute `$queryRawUnsafe` row locks (`SELECT * FROM inventories WHERE productId = $1 AND companyId = $2 FOR UPDATE`) inside Prisma transactions to prevent concurrent race conditions.

3. **Stock Reversal Validation**:
   Purchase order cancellation validates current available stock before stock deduction to prevent corrupted negative stock levels.
