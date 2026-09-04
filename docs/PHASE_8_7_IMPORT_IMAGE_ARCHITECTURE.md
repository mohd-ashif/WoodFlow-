# PHASE 8.7 — UNIVERSAL DATA IMPORT & CLOUDINARY IMAGE MANAGEMENT ARCHITECTURE

## 1. Executive Summary

Phase 8.7 introduces a complete, tenant-isolated, production-ready **Universal Data Import System** and **Cloudinary Image Management System** backed by Neon PostgreSQL database metadata storage for FurnitureOS SaaS.

Furniture shop owners can migrate spreadsheet data from Excel (`.xlsx`) and CSV (`.csv`) without manual entry across 9 core business modules while managing multi-image product catalogs, company logos, worker profiles, and CRM contact images securely.

---

## 2. Universal Data Import Pipeline Architecture

```text
UPLOAD FILE (.xlsx / .csv)
      ↓
FILE PARSING & HEADER EXTRACTION (file-parser.service.ts)
      ↓
INTELLIGENT COLUMN AUTO-MAPPING (validation.service.ts alias normalization)
      ↓
ROW-LEVEL VALIDATION & DUPLICATE DETECTION (duplicate.service.ts)
      ↓
PREVIEW & ACTION SELECTION (ImportPreview.tsx: Skip / Update / Create)
      ↓
DATABASE TRANSACTION (import-transaction.service.ts with stock movements & financial records)
      ↓
AUDIT LOGGING & IMPORT JOB TRACKING (ImportJob table & AuditLog)
```

---

## 3. Supported Import Modules & Business Logic Rules

| Module | Required Fields | Duplicate Matching Key | Financial / Accounting & Stock Impact |
| :--- | :--- | :--- | :--- |
| **Products** | Name, SKU, Category, Unit, Cost Price, Selling Price | `sku` | Creates Product, Inventory record, and `OPENING_STOCK` StockMovement if opening stock > 0. |
| **Categories** | Category Name | `name` | Creates or updates product categories. |
| **Units** | Unit Name, Short Code | `name` / `shortCode` | Creates or updates unit of measurement records. |
| **Customers** | Name, Phone | `phone` | Creates Customer, CustomerAddress records. |
| **Suppliers** | Name, Phone | `phone` | Creates Supplier, SupplierAddress records. |
| **Workers** | Employee Code, First Name | `employeeCode` | Salary fields strictly guarded by `worker.import` / `payroll.manage` permissions. |
| **Inventory** | Product Name, SKU, Opening Stock Quantity | `sku` | Updates inventory balances and logs `OPENING_STOCK` StockMovement records. |
| **Purchases** | Purchase Number, SKU, Quantity, Unit Price | `purchaseNumber` | Creates Purchase, PurchaseItem records, increases Inventory stock, logs `PURCHASE` StockMovements, and updates Supplier balance. |
| **Sales** | Invoice Number, SKU, Quantity, Unit Price | `invoiceNumber` | Checks stock availability (prevents negative stock unless company permits), creates Sale, SaleItem records, decreases Inventory stock, and logs `SALE` StockMovements. |

---

## 4. Cloudinary Image Upload & Neon Database Architecture

### Pipeline Flow
```text
FRONTEND FILE SELECT (Drag & drop / File input)
      ↓
FRONTEND VALIDATION (MIME image/jpeg, image/png, image/webp & max size 5MB)
      ↓
BACKEND UPLOAD ENDPOINT (POST /api/v1/upload/image with tenant isolation check)
      ↓
CLOUDINARY STORAGE (Public ID + Secure HTTPS URL with f_auto, q_auto optimizations)
      ↓
NEON POSTGRESQL STORAGE (MediaAsset record storing publicId, secureUrl, entityType, entityId, companyId)
```

### Folder Hierarchy Structure on Cloudinary
```text
stockrow/
  └── {companyId}/
        ├── product/
        ├── company_logo/
        ├── worker/
        ├── customer/
        └── supplier/
```

### Database Schema (Prisma)
- **`ImportJob`**: Tracks import jobs, total/valid/failed/duplicate row counts, error JSON payloads, status (`UPLOADED`, `VALIDATING`, `READY`, `IMPORTING`, `COMPLETED`, `FAILED`, `PARTIAL`), and tenant context.
- **`MediaAsset`**: Stores image metadata (`publicId`, `secureUrl`, `entityType`, `entityId`, `mimeType`, `fileSize`, `width`, `height`, `isPrimary`, `displayOrder`, `companyId`).

---

## 5. Security & Multi-Tenant Isolation

1. **Strict Context Injection**: `companyId` is strictly injected from the authenticated JWT token context (`req.tenantId`), never trusted from spreadsheet rows or client body parameters.
2. **Cross-Tenant Image Protection**: Attempts by Company A to delete or modify images owned by Company B return `403 Forbidden`.
3. **Secret Key Shielding**: `CLOUDINARY_API_SECRET` is kept strictly on the Node.js API backend and never exposed to browser client bundles.
4. **Row Validation & Error Isolation**: Invalid rows produce row-by-row error logs downloadable as a CSV report without aborting the entire migration unless chosen by the user.
