# Database Backup, Disaster Recovery & Restoration Guide

This document defines the backup schedule, point-in-time recovery (PITR) policy, and step-by-step restoration procedures for **Neon PostgreSQL**.

---

## 1. Backup Schedule & Strategy

> [!IMPORTANT]
> A backup strategy is not considered complete until restoration has been empirically tested and verified.

### Backup Specifications
- **Automated Snapshots**: Neon PostgreSQL performs continuous physical WAL archiving and automated state snapshots every 24 hours.
- **Retention Period**:
  - Development / Staging: 7 Days retention window.
  - Production: 30 Days continuous Point-In-Time-Recovery (PITR) retention.
- **Offsite Physical Backup**: Daily logical dump exports using `pg_dump` pushed to encrypted S3 cloud storage buckets.

---

## 2. Automated Logical Dump Script

Execute the following script daily via cron or automated worker job:

```bash
#!/bin/bash
# Daily Backup Script for FurnitureOS Production Database

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/furnitureos"
BACKUP_FILE="${BACKUP_DIR}/furnitureos_prod_${TIMESTAMP}.sql.gz"

mkdir -p ${BACKUP_DIR}

echo "[INFO] Starting database dump at $(date)..."
pg_dump "${DATABASE_URL}" | gzip > "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
  echo "[SUCCESS] Backup completed: ${BACKUP_FILE}"
  # Retain backups locally for 14 days
  find ${BACKUP_DIR} -type f -name "*.sql.gz" -mtime +14 -delete
else
  echo "[ERROR] Database backup failed!"
  exit 1
fi
```

---

## 3. Database Restoration Procedure

### Step-by-Step Restoration (Disaster Scenario)

If data corruption occurs or a tenant record is accidentally deleted:

#### Step 1: Isolate Production Environment
Temporarily set maintenance mode or pause API traffic to prevent partial state updates during restore:
```bash
# Enable API maintenance mode or scale backend workers to 0
```

#### Step 2: Create a Recovery Compute Branch in Neon
In the Neon Console or via Neon API:
1. Navigate to **Branches**.
2. Click **Create Branch**.
3. Select **Point in Time** restore and choose the timestamp immediately preceding the incident.
4. Name the new branch `recovery-branch-YYYYMMDD`.

#### Step 3: Test Restoration Branch Data
Connect to the `recovery-branch` connection string and verify data integrity:
```bash
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient({ datasources: { db: { url: process.env.RECOVERY_DATABASE_URL } } });
async function check() {
  const companyCount = await db.company.count();
  console.log('Restored Companies Count:', companyCount);
}
check();
"
```

#### Step 4: Promote Recovery Branch to Primary Production
In Neon Console:
1. Promote `recovery-branch-YYYYMMDD` to `main`.
2. Update the `DATABASE_URL` secret on backend hosts if connection endpoints changed.
3. Restart backend API servers to reconnect.
