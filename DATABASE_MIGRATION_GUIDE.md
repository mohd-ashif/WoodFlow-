# Production Database Migration & Schema Guide

This document details the database migration policy, index optimization rules, tenant isolation strategies, and migration workflow for **Neon PostgreSQL**.

---

## 1. Migration Principles

> [!IMPORTANT]
> 1. **Zero Manual DDL in Production**: Never execute raw `ALTER TABLE`, `DROP TABLE`, or schema modification SQL directly on the production database.
> 2. **Migration Files**: All schema changes must be created using Prisma Client migration files (`npx prisma migrate dev --name <migration_name>`).
> 3. **Non-Breaking Schema Changes**: Database migrations must be forward-and-backward compatible where possible (e.g. adding nullable columns before introducing new application logic).

---

## 2. Standard Database Deployment Workflow

```text
Local Development
      ↓ (npx prisma migrate dev)
Migration SQL File Created under /prisma/migrations/
      ↓ (Git Commit & PR)
Staging Test Environment
      ↓ (Automated Validation)
Production Database Migration (npx prisma migrate deploy)
```

---

## 3. Production Deployment Commands

When deploying to production, execute ONLY `prisma migrate deploy`:

```bash
# Execute pending SQL migrations against the production database
npx prisma migrate deploy
```

> [!NOTE]
> `prisma migrate deploy` reads the `./prisma/migrations` folder and executes unapplied migrations without prompting for interactive user input or resetting database records.

---

## 4. Multi-Tenant Database Indexes & Constraints

To ensure fast query response times across multi-tenant filters, the following indexing strategy is enforced in `prisma/schema.prisma`:

### Core Tenant Isolation Indexes
- **`company_id`**: Present on every multi-tenant table (`products`, `customers`, `suppliers`, `sales`, `purchases`, `stock_movements`, `workers`, `financial_transactions`, `import_jobs`, `media_assets`, `notifications`).

### Composite Performance Indexes
1. **`Product`**: `@@index([companyId, name])`, `@@index([companyId, categoryId])`, `@@index([companyId, productType])`, `@@unique([companyId, sku])`
2. **`Inventory`**: `@@index([companyId, productId])`
3. **`StockMovement`**: `@@index([companyId, createdAt])`, `@@index([companyId, movementType])`
4. **`Customer`**: `@@index([companyId, phone])`, `@@index([companyId, status])`, `@@unique([companyId, customerCode])`
5. **`Supplier`**: `@@index([companyId, phone])`, `@@index([companyId, status])`, `@@unique([companyId, supplierCode])`
6. **`Sale`**: `@@index([companyId, saleDate])`, `@@index([companyId, status])`, `@@index([companyId, paymentStatus])`, `@@unique([companyId, saleNumber])`
7. **`Purchase`**: `@@index([companyId, purchaseDate])`, `@@index([companyId, status])`, `@@index([companyId, paymentStatus])`, `@@unique([companyId, purchaseNumber])`
8. **`FinancialTransaction`**: `@@index([companyId, accountId])`, `@@index([companyId, transactionDate])`, `@@index([companyId, type])`

---

## 5. Migration Rollback Strategy

If a migration fails or causes application regression in production:

1. **Rollback Script Step**:
   Inspect the failed migration SQL under `prisma/migrations/<folder_name>/migration.sql`.
2. **Revert Application Deployment**:
   Immediately revert the backend API deployment to the previous stable release container image.
3. **Create Down Migration**:
   Generate a counteracting migration in development that drops the newly added column/table or reverts schema changes cleanly:
   ```bash
   npx prisma migrate dev --name revert_feature_x
   ```
4. **Deploy Counter Migration**:
   Apply the revert migration to production:
   ```bash
   npx prisma migrate deploy
   ```
