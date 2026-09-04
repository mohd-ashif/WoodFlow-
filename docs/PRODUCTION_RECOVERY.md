# PRODUCTION RECOVERY & DISASTER MANAGEMENT GUIDE

## 1. Overview
This document outlines production recovery procedures, database backup strategies, environment secret management, and rollback plans for **FurnitureOS SaaS**.

---

## 2. Environment Variables & Secret Configuration

Production environments must provide the following environment variables:

```env
# Server Environment
NODE_ENV="production"
PORT="4000"
CORS_ORIGIN="https://yourfurnitureosdomain.com"

# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-cool-pool-123456.ap-southeast-1.aws.neon.tech/stockrow?sslmode=require"

# JWT Secrets
JWT_SECRET="your-ultra-secure-256-bit-jwt-secret-key"
JWT_EXPIRES_IN="7d"

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME="smuzxkzu"
CLOUDINARY_API_KEY="717898691463384"
CLOUDINARY_API_SECRET="<your_production_cloudinary_secret>"
```

---

## 3. Database Backup & Migration Strategy

### Automated Backups (Neon PostgreSQL)
1. **Point-In-Time Restore (PITR)**: Neon automatically maintains continuous WAL logs allowing database state recovery to any second within the retention window.
2. **Manual PgDump**:
   ```bash
   pg_dump "DATABASE_URL" -F c -b -v -f furnitureos_backup_$(date +%Y%m%d_%H%M%S).dump
   ```

### Database Migration Execution
```bash
# Apply pending database schema migrations safely
npx prisma db push --accept-data-loss=false

# Generate Prisma Client
npx prisma generate
```

---

## 4. Disaster Recovery Scenarios & Playbooks

### Scenario A: Accidental Data Corruption
1. Lock application by enabling maintenance mode or stopping web service containers.
2. Identify exact corruption timestamp from `AuditLog` table.
3. Perform Neon PITR restore to 1 minute prior to corruption event.
4. Verify data consistency using `GET /api/v1/system/data-consistency`.
5. Re-enable web traffic.

### Scenario B: Cloudinary Credentials Compromise
1. Log into Cloudinary Console -> Settings -> Access Keys.
2. Click **Regenerate API Secret**.
3. Update `CLOUDINARY_API_SECRET` in environment variables.
4. Restart Node.js API service (`npm run dev` / `pm2 restart api`).

### Scenario C: Failed Deployment Rollback
1. Revert Git repository commit to last known healthy release tag:
   ```bash
   git checkout tags/v1.5.0
   ```
2. Rebuild frontend and backend:
   ```bash
   npm run build
   ```
3. Restart production processes.
