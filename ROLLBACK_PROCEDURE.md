# Production Rollback Standard Operating Procedure (SOP)

This document provides step-by-step instructions for executing an emergency rollback if a critical bug, security issue, or outage is detected immediately following a production release.

---

## Rollback Trigger Criteria

> [!WARNING]
> Initiate an immediate rollback if any of the following occur after launch:
> - **P0 Bug**: Database corruption or multi-tenant data bleed detected.
> - **Authentication Collapse**: Users unable to log in or token validation failing globally.
> - **Critical API Crash**: Over 5% of incoming requests returning 500 Internal Server Errors.

---

## 1. Web Frontend Rollback (Vercel)

Vercel stores immutable build artifacts for every deployment.

### Step 1: Access Vercel Dashboard
1. Go to **Vercel Console** -> **FurnitureOS Web Project**.
2. Navigate to the **Deployments** tab.
3. Locate the last known healthy deployment preceding the breaking release.

### Step 2: Promote Previous Deployment
1. Click the **`...`** menu icon next to the healthy deployment.
2. Select **Promote to Production**.
3. Confirm promotion. Traffic is instantly routed to the prior build (under 5 seconds).

---

## 2. Backend API Rollback (Render / Railway / Host)

### Step 1: Revert Container Version / Git Tag
1. In the backend hosting platform, locate the build history.
2. Rollback to the commit SHA corresponding to the previous release tag (e.g. `v0.9.9`).
3. Re-deploy the selected image tag.

### Step 2: Verify Health Check Endpoint
Confirm API health endpoint returns healthy status:
```bash
curl -i https://api.furnitureos.com/health
```
Expected output:
```json
{
  "status": "healthy",
  "service": "furniture-os-api",
  "version": "0.9.9"
}
```

---

## 3. Database Schema Rollback

Refer to [DATABASE_MIGRATION_GUIDE.md](file:///d:/ashif/Businues-projects/stock-row/DATABASE_MIGRATION_GUIDE.md) Section 5. Apply counter-migration DDL scripts without dropping production data tables.
