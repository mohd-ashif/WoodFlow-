# FurnitureOS — Development & Deployment Guide

## Common Development Commands

### Prisma Commands
```bash
# Generate Prisma Client
npx prisma generate

# Apply Schema Migrations
npx prisma migrate dev

# Push Schema to Neon Database (Prototyping)
npx prisma db push

# Seed Database with Admin & Demo Company
npx tsx prisma/seed.ts

# Launch Prisma GUI Studio
npx prisma studio
```

### Workspace Commands
```bash
# Install Monorepo Dependencies
npm install

# Build Shared Types & Schemas
npm run build --workspace=packages/shared

# Run Monorepo Development Servers
npm run dev

# Run Automated Tenant Security Tests
npm run test --workspace=apps/api
```
