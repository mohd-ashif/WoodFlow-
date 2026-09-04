# Final Production Go-Live Checklist

This checklist MUST be completely verified by the DevOps Lead, Full-Stack Architect, and Security Engineer prior to routing real production user traffic.

---

## 1. Application & Code Readiness

- [x] Production build passes cleanly with zero TypeScript errors (`npm run build`).
- [x] Backend test suite passes without breaking assertions (`npm test`).
- [x] Environment variable schema validation active (`apps/api/src/config/env.ts`).
- [x] Graceful process shutdown implemented for `SIGTERM` and `SIGINT` signals (`apps/api/src/server.ts`).
- [x] Error boundaries active on React frontend.

---

## 2. Infrastructure & Hosting Configuration

- [x] Vercel Web hosting domain configured (`app.furnitureos.com`).
- [x] Render / VPS backend API domain configured (`api.furnitureos.com`).
- [x] Custom SSL certificates active for HTTPS endpoints.
- [x] Next.js route rewrites configured to prevent SPA direct URL refresh 404 errors.

---

## 3. Database & Storage Preparation

- [x] Neon PostgreSQL production database connection pool online (`sslmode=require`).
- [x] Schema migrations executed cleanly (`npx prisma migrate deploy`).
- [x] Database indexes verified for `companyId`, `sku`, `email`, `saleDate`, `createdAt`, `status`.
- [x] Point-In-Time-Recovery (PITR) continuous backup policy active.
- [x] Cloudinary storage bucket isolated per tenant folder (`furniture-os/production/{companyId}/`).

---

## 4. Security & Compliance Verification

- [x] Secrets removed from source code repository and stored in environment configuration.
- [x] CORS origin restricted to allowed production origins (`CORS_ORIGIN`).
- [x] Helmet security headers active (`X-Frame-Options`, `X-Content-Type-Options`, HSTS).
- [x] Rate limiters active on Auth (`/auth/login`), Access Requests (`/access-requests`), Import APIs (`/imports/upload`), and REST endpoints.
- [x] Multi-tenant isolation verified: `x-company-id` header enforced on all company data queries.

---

## 5. Health Monitoring & Operational Support

- [x] Liveness health check `/health/liveness` returns `200 OK`.
- [x] Readiness health check `/health/readiness` pings database.
- [x] Full health check `/health` reports service version `1.0.0`, uptime, and database latency.
- [x] Pino structured logging active with password/token redaction.
- [x] Rollback procedure (`ROLLBACK_PROCEDURE.md`) and Disaster Recovery guide (`DISASTER_RECOVERY.md`) published.

---

## Sign-Off Matrix

| Role | Status | Date |
| :--- | :--- | :--- |
| **Full-Stack Architect** | **APPROVED** | 2026-09-01 |
| **Senior DevOps Engineer** | **APPROVED** | 2026-09-01 |
| **Security Engineer** | **APPROVED** | 2026-09-01 |
| **Database Administrator** | **APPROVED** | 2026-09-01 |
