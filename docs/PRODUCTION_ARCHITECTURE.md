# Production Architecture & Infrastructure Strategy

## Application Overview

FurnitureOS is a high-performance, multi-tenant SaaS application built for furniture manufacturers, wholesalers, and retail shop owners. It provides CRM, Inventory, POS Sales, Purchase Management, Production & Worker tracking, Financial Accounting, Analytics, and Data Export/Import workflows.

```text
                    USERS (Web Browser / Mobile Web)
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │ Global Edge CDN / Vercel │
                     │   Next.js 14 Web App    │
                     └────────────┬────────────┘
                                  │
                                  ▼ (HTTPS / WSS)
                     ┌─────────────────────────┐
                     │ Node.js Express API     │
                     │ TypeScript Engine (Render/VPS)│
                     └────────────┬────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
         ▼                        ▼                        ▼
   ┌──────────┐             ┌──────────┐             ┌──────────┐
   │ Neon DB  │             │Cloudinary│             │ Upstash  │
   │PostgreSQL│             │  Images  │             │  Redis   │
   │(SSL Pool)│             │ Storage  │             │ (Cache)  │
   └──────────┘             └──────────┘             └──────────┘
```

---

## Technical Stack Component Analysis

### 1. Frontend Web Hosting: Vercel (Next.js 14 App Router)
- **Framework**: Next.js 14, React 18, TypeScript, TailwindCSS, TanStack Query.
- **Why Vercel?**:
  - Zero cold starts for static pages and client-side application bundles.
  - Built-in global CDN with automatic HTTP/2 and HTTP/3 edge routing.
  - Automatic SSL certificates via Let's Encrypt / Vercel Edge.
  - Rewrite rules configured in `next.config.js` prevent direct SPA refresh 404 issues.
- **Cost / Tier**: Free Hobby tier for initial launch; \$20/mo Pro tier per team seat for custom domains and automated analytics.

### 2. Backend API Service: Render / Railway / Node.js VPS
- **Framework**: Node.js (v20 LTS), Express.js, TypeScript, Prisma ORM, Pino Logger.
- **Why Node.js API Service?**:
  - Persistent connection pool management with Neon PostgreSQL.
  - Express middleware stack allows fine-grained security headers, CORS origin checking, and rate-limiting per endpoint.
  - Graceful shutdown handles signal traps (`SIGTERM`, `SIGINT`) to drain database transactions without data corruption.
- **Scaling Strategy**:
  - Horizontal scaling via additional container instances behind a load balancer.
  - Stateless API design ensures zero session affinity sticky IP requirements.

### 3. Database Layer: Neon PostgreSQL
- **Database**: Serverless PostgreSQL with auto-scaling compute branches.
- **Connection Strategy**:
  - Pooled connection endpoint used for runtime API transactions (`-pooler.c-4.us-east-2.aws.neon.tech`).
  - Direct connection endpoint reserved exclusively for Prisma schema migrations (`npx prisma migrate deploy`).
- **SSL Enforcement**: Mandatory `sslmode=require` query parameters prevent plaintext database access over public networks.
- **Indexes**:
  - Primary single-column indexes on `company_id`, `created_at`, `status`, `sku`, `email`.
  - Composite indexes: `(company_id, created_at)`, `(company_id, product_id)`, `(company_id, status)`, `(company_id, customer_id)`.

### 4. Cloud Asset Storage: Cloudinary
- **Storage**: Cloudinary CDN with per-tenant directory partitioning.
- **Structure**: `furniture-os/production/{companyId}/{module}/`.
- **Optimization**: Dynamic WebP/AVIF transformation tags (`f_auto,q_auto,w_800`).

---

## Infrastructure Decision Matrix

| Service | Recommended Provider | Free Tier Capability | Production Scaling Path | Estimated Launch Cost |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | Vercel | Unlimited static builds, 100GB bandwidth | Pro Plan (\$20/mo) | \$0 - \$20/mo |
| **Backend API** | Render / Railway | 750 free instance hours | Individual Instance (\$7 - \$25/mo) | \$0 - \$15/mo |
| **Database** | Neon PostgreSQL | 0.5 GB storage, 1 compute branch | Pro Tier (\$19/mo + usage) | \$0 - \$19/mo |
| **Images** | Cloudinary | 25 Credits (~25K transformations) | Plus Plan (\$89/mo) | \$0 / mo |
| **Redis Cache** | Upstash Redis | 10K requests/day | Pay-as-you-go (\$0.20/100K reqs) | \$0 / mo |
