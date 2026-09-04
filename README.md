# FurnitureOS — Multi-Tenant Furniture Management SaaS (Phase 1)

**FurnitureOS** is a production-ready SaaS application built for furniture shops to manage inventory, sales, purchases, invoices, payments, workers, production, and analytics.

> **Phase 1 Foundation**: Project Foundation, Neon PostgreSQL Database, Multi-Tenant Isolation Architecture, JWT Cookie Security, Platform Admin, Access Request System, Company Onboarding, Next.js Web Dashboard, and Automated Tenant Security Testing.

---

## Workspace Structure

```text
furniture-os/
├── apps/
│   ├── web/           # Next.js 14+ App Router Modern Dashboard
│   └── api/           # Express TypeScript Modular Monolith Backend
├── packages/
│   └── shared/        # Shared Zod Schemas & TypeScript Types
├── prisma/
│   ├── schema.prisma  # PostgreSQL Database Schema
│   └── seed.ts        # Database Seed Script
└── docs/              # Architectural & Development Documentation
```

---

## Quick Start & Local Setup

### 1. Prerequisites
- **Node.js**: v18.x or v20.x
- **npm**: v9.x or v10.x
- **PostgreSQL**: Neon PostgreSQL connection URL

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Set your `DATABASE_URL` in `.env`:
```env
DATABASE_URL="postgresql://user:password@ep-sample.neon.tech/furnitureos?sslmode=require"
```

### 3. Install Dependencies & Build Packages
```bash
npm install
npm run build --workspace=packages/shared
```

### 4. Database Setup & Seed
```bash
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

### 5. Start Development Servers
Run both API and Web servers concurrently:
```bash
npm run dev
```

Or run individually:
```bash
npm run dev:api    # Express API on http://localhost:4000
npm run dev:web    # Next.js Frontend on http://localhost:3000
```

---

## Seed Accounts (Development Only)

| User Role | Email | Default Password | Initial Route |
| :--- | :--- | :--- | :--- |
| **Platform Admin** | `admin@furnitureos.local` | `AdminPass123!` | `/admin/dashboard` |
| **Company Owner** | `owner@royalfurniture.local` | `OwnerPass123!` | `/dashboard` |
| **Pending User** | `pendinguser@example.local` | `UserPass123!` | `/access-request` |

---

## Documentation Links

For a complete index of all operational, architectural, and QA documents, see the [Documentation Index](docs/README.md).

- [Architecture Guide](docs/architecture.md)
- [Database Schema & ERD](docs/database.md)
- [Authentication Architecture](docs/authentication.md)
- [Multi-Tenancy Security Model](docs/multi-tenancy.md)
- [API Reference](docs/api.md)
- [Development Guide](docs/development.md)
- [Admin Operational Guide](docs/ADMIN_GUIDE.md)
- [Company Owner Guide](docs/COMPANY_OWNER_GUIDE.md)
- [Employee Guide](docs/EMPLOYEE_GUIDE.md)

---

## Definition of Done Verification (Phase 1)

- [x] Register, Login, Logout, Cookie Session Auth
- [x] Server-Side Tenant Context Derivation (`req.tenantId`)
- [x] Automated Cross-Tenant Security Isolation Tests
- [x] Platform Admin Dashboard, Companies Management & Access Request System
- [x] Company Owner Dashboard with Disabled Phase 2 Module Cards
- [x] Zod Input Validation & Centralized Error Handling
- [x] Helmet Security Headers, Express Rate Limiting & Structured Pino Logging
