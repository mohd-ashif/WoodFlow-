# FurnitureOS / WoodFlow ERP — End-to-End Software Documentation

> **Version**: 1.0.0 | **Stack**: Next.js 14, Express TypeScript API, Prisma ORM, PostgreSQL, Monorepo  
> **Scope**: Architecture, Multi-Tenant RBAC, Database Models, REST APIs, Workflows, Financial Ledger & Operations

---

## 1. Executive System Overview

**FurnitureOS** (also known as **WoodFlow ERP**) is an enterprise-grade multi-tenant SaaS platform built for timber processing, furniture manufacturing, wholesale distribution, and retail management.

```mermaid
graph TD
    PA[Platform Admin] -->|Tenant Provisioning & Audit| TA[Company A: WoodCraft]
    PA -->|Tenant Provisioning & Audit| TB[Company B: Oak Furniture]
    
    subgraph "Tenant Isolation Context (x-company-id)"
        TA --> M1[Inventory & Stock] & M2[Purchasing & POs] & M3[Work Orders & BOM]
        TA --> M4[Sales & Invoicing] & M5[Multi-Account Ledger] & M6[CSV/XLSX Imports]
    end
```

### Key Capabilities
- **Raw Material & Timber Tracking**: Manage dimensional timber, wood species, and raw log conversion alongside finished furniture goods.
- **Manufacturing Conversion Workflows**: Track raw wood transformation into components, sub-assemblies, and final assembled furniture with Bill of Materials (BOM).
- **Multi-Account Financial Ledger**: Handle cash, bank accounts, customer deposits, supplier balances, expenses, and intra-account transfers.
- **Strict Row-Level Multi-Tenancy**: Logical isolation via `companyId` foreign key and composite DB indexes across all business entities.

---

## 2. System Architecture & Tech Stack

### 2.1 Technology Stack Specifications
- **Monorepo**: npm Workspaces (`apps/web`, `apps/api`, `packages/shared`)
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript 5.5, Tailwind CSS, TanStack Query v5, React Hook Form, Zod
- **Backend API**: Node.js v20+, Express.js v4, TypeScript 5.5, Helmet, CORS, Rate Limiter
- **Database Layer**: PostgreSQL 16 (Neon Database cluster with connection pooling), Prisma ORM v5.19
- **Security**: JWT tokens, HTTP-Only cookies, bcrypt hashing, header tenant scope injection (`x-company-id`)

### 2.2 Monorepo Project Layout
```text
furniture-os/
├── apps/
│   ├── api/                           # Express.js REST API Backend
│   │   ├── src/
│   │   │   ├── middleware/            # Auth, Tenant Context, RBAC, Error Handler
│   │   │   ├── modules/               # 24 Domain Modules (auth, inventory, sales, workOrders, etc.)
│   │   │   └── server.ts              # API Entry Point
│   └── web/                           # Next.js 14 App Router Web Client
│       ├── app/                       # Dashboard, Products, Sales, Work Orders, Finance Pages
│       ├── components/                # Shared UI Components
│       └── lib/                       # API HTTP Client Axios Instance
├── packages/
│   └── shared/                        # Shared DTOs, Zod Validators, Types & Constants
├── docs/                              # Architecture Documentation
└── prisma/                            # Prisma Schema (`schema.prisma`) & Seeder
```

---

## 3. Multi-Tenancy, Data Isolation & RBAC

### 3.1 Tenant Isolation Protocol
1. **Header Inspection**: Middleware extracts `x-company-id` header from incoming HTTP requests.
2. **Membership Validation**: Verifies active `CompanyMember` record for the user and target company.
3. **Query Scoping**: Injects `req.tenantId` into Express requests. All Prisma queries append `where: { companyId: req.tenantId }`.

```typescript
// Middleware Scope Injection Pattern
export const enforceTenantContext = async (req: Request, res: Response, next: NextFunction) => {
  const companyId = req.headers['x-company-id'] as string;
  if (!companyId) return res.status(400).json({ error: 'Missing x-company-id header' });

  const membership = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId: req.user.id, companyId } },
    include: { company: true }
  });

  if (!membership || membership.status !== 'ACTIVE') {
    return res.status(403).json({ error: 'Active membership required for company' });
  }

  req.tenantId = companyId;
  req.userRole = membership.role;
  next();
};
```

### 3.2 Role Permission Matrix
- **System Roles**: `PLATFORM_ADMIN` (System global admin), `COMPANY` (Standard user).
- **Company Roles**: `OWNER` (Full access), `MANAGER` (Operations/Finance), `STAFF` (Orders/Receiving), `WORKER` (Floor worker), `MEMBER` (Read-only).

| Operational Module | Platform Admin | Company Owner | Manager | Staff | Worker |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Tenant Provisioning / Approvals** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Manage Company Settings & Users** | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Financial Ledger & Accounts P&L** | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Manual Stock Adjustments** | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Sales Orders & Invoicing** | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Purchase Orders & Goods Receiving** | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Work Orders & Manufacturing** | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Floor Progress & Quality Check** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **View Product Catalog & Stock** | ❌ | ✅ | ✅ | ✅ | ✅ |

---

## 4. Core Database Schema & Data Models

### 4.1 Key Entity Relationships
```mermaid
erDiagram
    Company ||--o{ User : "memberships"
    Company ||--o{ Product : catalog
    Company ||--o{ Inventory : stocks
    Company ||--o{ Sale : transactions
    Company ||--o{ WorkOrder : production
    Company ||--o{ PaymentAccount : ledger

    Product ||--o{ Inventory : tracks
    Product ||--o{ StockMovement : movement_log
    Product ||--o{ WorkOrderMaterial : bom_requirement

    Customer ||--o{ Sale : orders
    Supplier ||--o{ Purchase : supplies
    Sale ||--o{ Invoice : generates
    PaymentAccount ||--o{ FinancialTransaction : posts
```

### 4.2 Essential Prisma Schema Definitions

```prisma
model User {
  id           String      @id @default(cuid())
  name         String
  email        String      @unique
  passwordHash String
  systemRole   SystemRole  @default(COMPANY)
  status       UserStatus  @default(ACTIVE)
  createdAt    DateTime    @default(now())

  memberships  CompanyMember[]
  @@map("users")
}

model Company {
  id                 String        @id @default(cuid())
  name               String
  slug               String        @unique
  status             CompanyStatus @default(ACTIVE)
  allowNegativeStock Boolean       @default(false)
  createdAt          DateTime      @default(now())

  members     CompanyMember[]
  products    Product[]
  inventories Inventory[]
  sales       Sale[]
  purchases   Purchase[]
  workOrders  WorkOrder[]
  accounts    PaymentAccount[]
  @@map("companies")
}

model Product {
  id           String      @id @default(cuid())
  companyId    String
  name         String
  sku          String
  type         ProductType @default(FINISHED_PRODUCT)
  costPrice    Decimal     @default(0) @db.Decimal(12, 2)
  sellingPrice Decimal     @default(0) @db.Decimal(12, 2)
  currentStock Int         @default(0)
  woodSpecies  String?

  company   Company     @relation(fields: [companyId], references: [id], onDelete: Cascade)
  inventory Inventory?
  movements StockMovement[]
  @@unique([companyId, sku])
  @@map("products")
}

model Inventory {
  id           String   @id @default(cuid())
  companyId    String
  productId    String   @unique
  quantity     Int      @default(0)
  reservedQty  Int      @default(0)
  availableQty Int      @default(0)

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  @@map("inventories")
}

model StockMovement {
  id          String            @id @default(cuid())
  companyId   String
  productId   String
  userId      String
  type        StockMovementType
  quantity    Int
  unitCost    Decimal?          @db.Decimal(12, 2)
  createdAt   DateTime          @default(now())

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  @@map("stock_movements")
}
```

---

## 5. Comprehensive REST API Reference

Base URL: `/api/v1` | Auth: `Authorization: Bearer <token>` | Tenant: `x-company-id: <companyId>`

### 5.1 Auth & Access Requests (`/auth`, `/access-requests`)
| Method | Endpoint | Access | Purpose | Payload Summary |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register platform account | `{ name, email, password, phone }` |
| `POST` | `/auth/login` | Public | User authentication login | `{ email, password }` |
| `GET` | `/auth/me` | Auth | Fetch user profile & company memberships | Empty |
| `POST` | `/access-requests` | Auth | Submit tenant onboarding request | `{ companyName, slug, reason }` |
| `POST` | `/access-requests/:id/approve` | Admin | Approve & auto-provision company | Empty |

### 5.2 Products & Inventory (`/products`, `/inventory`)
| Method | Endpoint | Access | Purpose | Payload Summary |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/products` | Member+ | Search catalog with pagination | Query: `search, categoryId, type, page` |
| `POST` | `/products` | Staff+ | Create product & opening stock | `{ name, sku, type, costPrice, sellingPrice, openingStock }` |
| `GET` | `/inventory` | Member+ | Real-time stock & location query | Query: `productId, location` |
| `POST` | `/inventory/adjust` | Staff+ | Stock adjustment (IN/OUT/DAMAGE) | `{ productId, type, quantity, notes }` |
| `GET` | `/inventory/movements` | Member+ | Fetch stock audit movement log | Query: `productId, type, startDate, endDate` |

### 5.3 Sales & Invoicing (`/sales`, `/invoices`)
| Method | Endpoint | Access | Purpose | Payload Summary |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/sales` | Member+ | List sales orders | Query: `status, customerId, startDate` |
| `POST` | `/sales` | Staff+ | Create sale order & deduct stock | `{ customerId, items: [{ productId, quantity, unitPrice }] }` |
| `POST` | `/sales/:id/cancel` | Manager+ | Cancel sale & restore stock | `{ reason }` |
| `GET` | `/invoices/:id/pdf` | Member+ | Stream printable PDF invoice | Empty (Returns binary PDF stream) |

### 5.4 Procurement & Manufacturing (`/purchases`, `/work-orders`, `/workers`)
| Method | Endpoint | Access | Purpose | Payload Summary |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/purchases` | Staff+ | Create supplier purchase order | `{ supplierId, items: [{ productId, quantity, unitCost }] }` |
| `PATCH` | `/purchases/:id/status` | Staff+ | Receive items & increase stock | `{ status: "RECEIVED" }` |
| `POST` | `/work-orders` | Manager+ | Create manufacturing order | `{ targetProductId, quantityToProduce, priority, materialsNeeded: [] }` |
| `PATCH` | `/work-orders/:id/status` | Staff+ | Update stage status | `{ status: "IN_PROGRESS" \| "QUALITY_CHECK" \| "COMPLETED" }` |
| `POST` | `/work-orders/:id/quality-check` | Staff+ | Submit Quality Check result | `{ result: "PASSED" \| "FAILED", notes }` |

### 5.5 Finance & Accounts (`/finance`)
| Method | Endpoint | Access | Purpose | Payload Summary |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/finance/accounts` | Manager+ | List bank/cash payment accounts | Empty |
| `POST` | `/finance/expenses` | Manager+ | Log operational expense | `{ accountId, category, amount, description }` |
| `POST` | `/finance/customer-payments` | Staff+ | Settle customer invoice payment | `{ customerId, invoiceId, accountId, amount, paymentMethod }` |
| `POST` | `/finance/transfers` | Owner/Manager| Intra-account bank transfer | `{ fromAccountId, toAccountId, amount, description }` |

---

## 6. End-to-End Business Workflows

### 6.1 Procurement & Inventory Intake
1. **Draft PO**: Manager creates purchase order with raw timber quantities and supplier unit costs.
2. **Receive Goods**: On delivery, staff updates PO status to `RECEIVED`.
3. **Atomic Transaction**:
   - Updates stock: $\text{TotalStock} = \text{ExistingStock} + \text{ReceivedQty}$
   - Recalculates cost: $\text{NewCost} = \frac{(\text{ExistingStock} \times \text{ExistingCost}) + (\text{ReceivedQty} \times \text{ReceivedCost})}{\text{TotalStock}}$
   - Inserts `StockMovement` record (`Type: PURCHASE`).

### 6.2 Manufacturing Conversion & Work Orders
```text
[Create Work Order] ──► [Reserve Raw Materials] ──► [Floor Production] ──► [Quality Inspection]
                                                                                │
                                                            ┌───────────────────┴───────────────────┐
                                                            ▼                                       ▼
                                                    [Result: PASSED]                        [Result: FAILED]
                                                            │                                       │
                                                            ▼                                       ▼
                                                  - Deduct Raw Timber Stock               Revert Work Order /
                                                  - Add Finished Furniture                Record Damage Out
                                                  - Status: COMPLETED
```

---

## 7. Financial Ledger & Universal Data Import

### 7.1 Multi-Account Financial Ledger Rules
- **Account Ledger Equation**:  
  $$\text{Current Account Balance} = \text{Opening Balance} + \sum \text{Incomes} + \sum \text{Transfers In} - \sum \text{Expenses} - \sum \text{Transfers Out}$$
- **Immutable Transactions**: Ledger entries cannot be deleted; credit/debit adjustment transactions are recorded for reversals.

### 7.2 Data Import Subsystem
- **Bulk CSV/XLSX Parser**: Upload files via `POST /api/v1/imports/upload` for Products, Customers, Suppliers, and Inventory.
- **Stream Processing**: Uses row-by-row Zod schema validation. Creates `ImportJob` and `ImportRowError` records for detailed logging.

---

## 8. Deployment, Environment & Operations

### 8.1 Required Environment Variables (`.env`)
```ini
NODE_ENV=production
PORT=5000
DATABASE_URL="postgresql://user:pass@ep-cool-123456.us-east-2.aws.neon.tech/furniture_os?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://user:pass@ep-cool-123456.us-east-2.aws.neon.tech/furniture_os?sslmode=require"
JWT_SECRET=super_secret_jwt_key_minimum_64_characters_long
CORS_ORIGIN=https://app.furnitureos.com
```

### 8.2 Development Commands & Docker Production Deployment

```bash
# Setup & Development
npm install
npm run prisma:generate && npm run prisma:migrate
npm run dev # Starts Shared watch, Express API, and Next.js Web concurrently

# Production Build & Launch
docker-compose up -d --build
```

### 8.3 Disaster Recovery Backup Script (`scripts/backup.sh`)
```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
pg_dump -h localhost -U furniture_admin -d furniture_os | gzip > /var/backups/db_backup_${TIMESTAMP}.sql.gz
find /var/backups -type f -name "*.sql.gz" -mtime +30 -delete
```

---

> **FurnitureOS Technical Documentation** — *v1.0.0 Condensed Architecture Specification*
