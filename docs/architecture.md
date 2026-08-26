# FurnitureOS — Architecture Guide

## Monorepo & Modular Monolith

FurnitureOS is designed as a TypeScript Monorepo utilizing NPM Workspaces:

- `apps/web`: Next.js 14+ App Router frontend presenting a responsive, dark-themed SaaS user interface styled with Tailwind CSS, shadcn design patterns, TanStack Query, and Lucide icons.
- `apps/api`: Node.js Express modular monolith backend. Avoids microservice complexity while keeping domain modules (`auth`, `company`, `accessRequest`, `admin`, `audit`) encapsulated in distinct modules.
- `packages/shared`: Shared Zod validation schemas and TypeScript interfaces used by both `web` and `api` to ensure strict contract consistency.
- `prisma`: Prisma ORM schema and database migrations for Neon PostgreSQL.

## High-Level Architecture Diagram

```text
[ Next.js Web App (3000) ]
          │  (HTTP-Only Cookie / Bearer Token)
          ▼
[ Express API Gateway / Router (4000) ]
   ├── Helmet Security Headers
   ├── Rate Limiting
   └── Auth & Tenant Resolution Middleware
          │
          ├──> [ Modules: Auth, Admin, AccessRequest, Company ]
          │
          ▼
[ Prisma ORM ]
          │
          ▼
[ Neon PostgreSQL Database ]
```
