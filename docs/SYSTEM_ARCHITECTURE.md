# FurnitureOS — System Architecture & Design

## 1. Overview
FurnitureOS is a production-grade, multi-tenant SaaS application designed specifically for furniture manufacturing, retail, and wholesale businesses.

```text
                               ┌─────────────────────────┐
                               │     Platform Admin      │
                               └────────────┬────────────┘
                                            │
               ┌────────────────────────────┼────────────────────────────┐
               ▼                            ▼                            ▼
      ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
      │    Company A    │          │    Company B    │          │    Company C    │
      │ (Tenant ID: 101)│          │ (Tenant ID: 102)│          │ (Tenant ID: 103)│
      └─────────────────┘          └─────────────────┘          └─────────────────┘
```

---

## 2. Technology Stack

### Frontend Application (`apps/web`)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Vanilla CSS Design Tokens
- **UI Components**: Shadcn UI & Lucide Icons
- **State & Remote Query**: TanStack Query (v5) & React Context
- **Forms & Validation**: React Hook Form & Zod

### Backend API (`apps/api`)
- **Runtime**: Node.js & Express.js (RESTful API)
- **Language**: TypeScript
- **ORM & Data Layer**: Prisma ORM
- **Authentication**: JWT & HTTP-only cookies
- **Security**: Helmet, Rate Limiter, Express CORS
- **Validation**: Zod Schemas

### Database
- **Engine**: Neon PostgreSQL
- **Multi-Tenancy**: Logical Row-Level Isolation (`companyId` FK & Composite Unique Indexes)

---

## 3. Multi-Tenancy & Security Model

### Zero Client Trust Pipeline
```text
Client HTTP Request (with Authorization Header & optional x-company-id)
   │
   ▼
1. Authenticate JWT Middleware (Extracts req.user & active memberships)
   │
   ▼
2. Tenant Context Middleware (Verifies active user membership in target company)
   │
   ▼
3. Enforce Server-Side Tenant Scope (`req.tenantId = membership.companyId`)
   │
   ▼
4. Execute Query with Explicit Tenant Filter (`where: { companyId: req.tenantId }`)
```

### Role-Based Access Control (RBAC) Hierarchy
- **`PLATFORM_ADMIN`**: Full administrative access across all tenant companies and platform requests.
- **Company Roles**:
  - `OWNER`: Unrestricted access within company tenant scope.
  - `MANAGER`: Operational access (Inventory, Customers, Suppliers, Sales, Purchases, CRM).
  - `STAFF`: Operational creation and view access.
  - `WORKER`: Floor worker access (View Products & Inventory).

---

## 4. Key Subsystem Architectures

### Inventory & Stock Movement Engine
All inventory changes occur strictly through traceable transactions:
```text
Business Event (Opening Stock / Purchase / Sale / Adjustment)
   │
   ▼
Prisma Interactive Transaction ($transaction)
   │
   ▼
Row-level Locking (`SELECT FOR UPDATE` on Inventory)
   │
   ▼
Stock Movement Entry Created (Type: PURCHASE, SALE, OPENING_STOCK, ADJUSTMENT)
   │
   ▼
Inventory & Product `currentStock` Updated
   │
   ▼
Audit Log Record Created
```

### Sales & Invoicing Pipeline
```text
Draft Sale Creation ──► Sale Confirmation ──► Deduct Stock ──► Generate Invoice ──► Record CRM Activity
```

### Purchase & Receiving Pipeline
```text
Draft Purchase Order ──► Purchase Confirmation ──► Receive Stock ──► Update Acquisition Cost ──► Record CRM Activity
```
