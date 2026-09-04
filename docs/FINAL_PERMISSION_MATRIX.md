# FINAL PERMISSION MATRIX & RBAC AUDIT REPORT

This document specifies the Role-Based Access Control (RBAC) rules and direct URL security enforcement for **FurnitureOS SaaS**.

---

## 1. COMPREHENSIVE ROLE PERMISSION MATRIX

| Module / Action | PLATFORM_ADMIN | COMPANY OWNER | MANAGER | STAFF (Sales/Inv) | WORKER | MEMBER |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **System Admin Dashboard (`/admin`)** | **Full** | Denied | Denied | Denied | Denied | Denied |
| **Company Management** | **Full** | View Own | Denied | Denied | Denied | Denied |
| **Access Requests Approval** | **Full** | Denied | Denied | Denied | Denied | Denied |
| **Global Audit Logs** | **Full** | View Company | Denied | Denied | Denied | Denied |
| **Company Settings (`/settings`)** | View System | **Full** | View | Denied | Denied | Denied |
| **Employee Management** | View System | **Full** | View | Denied | Denied | Denied |
| **Products Catalog** | View System | **Full** | **Full** | View & Create | View | View |
| **Inventory & Stock Movements** | View System | **Full** | **Full** | View & Adjust | View | No |
| **Sales & Invoices (`/sales`)** | View System | **Full** | **Full** | **Full** | View Own | No |
| **Purchases & Orders (`/purchases`)**| View System | **Full** | **Full** | View & Create | No | No |
| **Customers CRM (`/crm`)** | View System | **Full** | **Full** | **Full** | View | No |
| **Suppliers CRM** | View System | **Full** | **Full** | View & Create | No | No |
| **Work Orders & Production** | View System | **Full** | **Full** | View | **Full (Tasks)**| No |
| **Worker Attendance** | View System | **Full** | **Full** | View | Clock In/Out | No |
| **Financial Ledger & Reconciliation**| Denied | **Full** | View | Denied | Denied | Denied |
| **Reports & Exports (`/reports`)** | View System | **Full** | **Full** | Limited | Denied | Denied |

---

## 2. DIRECT URL AUTHORIZATION VERIFICATION

Hidden UI components (such as hiding the Settings link in the sidebar for Staff) are accompanied by strict backend route authorization guards.

### API Middleware Enforcement (`requireRoles` / `requirePlatformAdmin`)

1. **GET/PATCH `/api/admin/*`**:
   - Access by Non-PLATFORM_ADMIN -> **`HTTP 403 Forbidden`**
   - Response Payload: `{"success": false, "error": "Platform Admin privileges required"}`

2. **PATCH `/api/company` & POST `/api/company/members`**:
   - Access by non-OWNER -> **`HTTP 403 Forbidden`**
   - Response Payload: `{"success": false, "error": "Insufficient permissions. Required role: OWNER"}`

3. **GET `/api/audit`**:
   - Access by STAFF / WORKER -> **`HTTP 403 Forbidden`**

4. **GET `/api/finance/reconciliation`**:
   - Access by STAFF / WORKER -> **`HTTP 403 Forbidden`**

---

## 3. MULTI-TENANT ISOLATION VERIFICATION
- Every query includes `where: { companyId: req.tenantId }`.
- Request body `companyId` manipulation is ignored and replaced by validated JWT session tenant ID.
- Attempting to query another tenant's ID directly via REST URL returns **`404 Not Found`** or **`403 Forbidden`**.

---

## 4. UX SIMPLICITY ASSESSMENT
- Permissions are easy to understand for furniture shop owners.
- Simple, high-level role names (`OWNER`, `MANAGER`, `STAFF`, `WORKER`).
- Clear error messages when access is denied.
