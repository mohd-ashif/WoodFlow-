# FurnitureOS — Multi-Tenant Architecture & Security Model

## Core Rule: Zero Client Trust
The backend **NEVER** trusts incoming request body parameters like `{"tenantId": "123"}` for data access control.

## Resolution Pipeline
```text
Client Request
      │
      ▼
1. Extract & Verify Access Token (JWT)
      │
      ▼
2. Fetch User & Active Memberships from DB
      │
      ▼
3. Determine Active CompanyMembership (status == ACTIVE && company.status == ACTIVE)
      │
      ▼
4. Set req.tenantId = membership.companyId
      │
      ▼
5. Execute Query: db.model.findMany({ where: { companyId: req.tenantId } })
```

## Cross-Tenant Access Prevention
If User A from Company A attempts to access Company B endpoints or pass `x-company-id: company-B-id`, the `tenantContext` middleware verifies membership in Company B. If no active membership exists, a `403 Forbidden` response (`NO_COMPANY_MEMBERSHIP`) is returned immediately.

Automated verification tests are located in `apps/api/tests/tenantIsolation.test.ts`.
