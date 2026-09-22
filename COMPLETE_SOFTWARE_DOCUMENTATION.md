# FurnitureOS (WoodFlow) — Complete Software Documentation & System Reference

> **Document Version:** 1.0.0  
> **Target Audience:** Technical Architects, Engineering Teams, Product Owners, System Administrators, & Business Analysts  
> **System Architecture:** Multi-Tenant Furniture Enterprise SaaS (Next.js + Express API + PostgreSQL Prisma ORM)

---

## Table of Contents

1. [Executive Summary & Purpose](#1-executive-summary--purpose)
2. [High-Level Technical Architecture](#2-high-level-technical-architecture)
3. [Multi-Tenancy & Security Isolation Model](#3-multi-tenancy--security-isolation-model)
4. [Database Schema & Data Models Breakdown](#4-database-schema--data-models-breakdown)
5. [Complete Pages & Navigation Inventory](#5-complete-pages--navigation-inventory)
   - 5.1 Auth & Onboarding Module
   - 5.2 Platform Admin Module
   - 5.3 Core Workspace & Dashboard Module
   - 5.4 Inventory & Stock Control Module
   - 5.5 CRM & Business Relations Module
   - 5.6 Sales & Commercial Module
   - 5.7 Purchases & Procurement Module
   - 5.8 Production & Manufacturing Module
   - 5.9 Finance & Accounting Module
   - 5.10 Reports & Enterprise Analytics Module
   - 5.11 Data Utilities & Bulk Import Module
   - 5.12 Settings & System Help Module
6. [Express API Backend Architecture & Middleware](#6-express-api-backend-architecture--middleware)
7. [End-to-End Core Business Workflows](#7-end-to-end-core-business-workflows)
8. [Role-Based Access Control (RBAC) Matrix](#8-role-based-access-control-rbac-matrix)
9. [Deployment & Operations Guide](#9-deployment--operations-guide)

---

## 1. Executive Summary & Purpose

**FurnitureOS (WoodFlow)** is an end-to-end, enterprise-grade Multi-Tenant Software-as-a-Service (SaaS) platform tailored specifically for furniture manufacturing units, workshops, distributors, and retail businesses.

### Primary Objectives
- **Centralized Operational Control**: Unifies Inventory, Sales, Purchases, Production Work Orders, Worker Management, CRM, Finance, and Reports under a single unified dashboard.
- **Tenant Isolation**: Ensures total data security across independent furniture companies operating on the same platform instance.
- **Real-Time Stock Auditability**: Tracks stock movements across multi-stage lifecycles (Raw Material, WIP - Work In Progress, Finished Products).
- **Manufacturing Tracking**: Offers workshop-floor level visibility, including Bill of Materials (BOM), material allocation, worker attendance, and quality control checks.
- **Financial Compliance**: Provides accounts receivable/payable, multi-account payments, expense tracking, and profit/loss analytics.

---

## 2. High-Level Technical Architecture

FurnitureOS is structured as a high-performance Monorepo separating frontend UI, backend API logic, shared validation types, and database ORM layer.

```
                   ┌─────────────────────────────────────────┐
                   │        Next.js 14 Web Frontend          │
                   │      (App Router, React, Tailwind)       │
                   └────────────────────┬────────────────────┘
                                        │ HTTPS / Cookies
                                        ▼
                   ┌─────────────────────────────────────────┐
                   │       Express.js TypeScript API         │
                   │ (Pino Logger, Rate Limit, Auth Context) │
                   └────────────────────┬────────────────────┘
                                        │ Prisma Client
                                        ▼
                   ┌─────────────────────────────────────────┐
                   │         Neon PostgreSQL Database        │
                   │      (Multi-Tenant Scoped Tables)       │
                   └────────────────────┬────────────────────┘
```

### Monorepo Structure

```text
furniture-os/
├── apps/
│   ├── web/               # Next.js 14 App Router Web Application
│   │   ├── app/           # App routes & module pages
│   │   ├── components/    # Reusable React UI components
│   │   └── lib/           # Web utilities & API client hooks
│   └── api/               # Express.js TypeScript API Server
│       ├── src/
│       │   ├── controllers/ # HTTP Endpoint logic handlers
│       │   ├── middleware/  # Auth, Tenant, Rate Limiting, Compression
│       │   ├── routes/      # REST Express Routers
│       │   └── services/    # Core business logic layer
├── packages/
│   └── shared/            # Shared Zod Validation Schemas & TS Interfaces
├── prisma/
│   ├── schema.prisma      # PostgreSQL Database Schemas
│   └── seed.ts            # Development & Production Seed Script
└── docs/                  # System & Architecture Documentation
```

---

## 3. Multi-Tenancy & Security Isolation Model

Multi-tenancy in FurnitureOS uses a **Shared Database, Discriminator Column (`companyId`) Isolation Model** backed by strict server-enforced scoping.

### Security Layers

1. **Authentication (JWT in HttpOnly Cookie)**
   - Sessions are managed via secure `HttpOnly`, `SameSite=Lax` cookies containing encrypted JSON Web Tokens.
   - Prevents XSS script execution from reading authorization tokens.

2. **Server-Side Tenant Context Extraction (`req.tenantId`)**
   - Every API request passes through `tenantContextMiddleware`.
   - Resolves active company context based on user membership token claims.
   - Blocks unauthorized cross-company requests before touching database layer.

3. **Prisma ORM Scoped Queries**
   - Database queries automatically inject `where: { companyId: req.tenantId }`.
   - Prevents accidental data leaks between competitors on the same platform.

4. **Security Hardening**
   - `Helmet` security HTTP response headers.
   - Rate limiting on sensitive endpoints (Login, Register, Access Requests).
   - Structured JSON logging using `Pino` with sensitive field sanitization.

---

## 4. Database Schema & Data Models Breakdown

The database schema defined in `prisma/schema.prisma` consists of **25+ interconnected entities** grouped into 8 operational domains.

```mermaid
erDiagram
    Company ||--o{ User : "members"
    Company ||--o{ Product : "catalog"
    Company ||--o{ Customer : "clients"
    Company ||--o{ Supplier : "vendors"
    Company ||--o{ Sale : "orders"
    Company ||--o{ Purchase : "procurement"
    Company ||--o{ WorkOrder : "production"
    Company ||--o{ PaymentAccount : "treasury"
    Product ||--o{ StockMovement : "audit"
    Product ||--o{ Inventory : "stock"
    Sale ||--o{ Invoice : "billing"
    WorkOrder ||--o{ QualityCheck : "inspection"
```

### Core Schema Summary Table

| Model Name | Table Name | Purpose & Primary Attributes | Key Relationships |
| :--- | :--- | :--- | :--- |
| `User` | `users` | Global system accounts (Name, Email, PasswordHash, SystemRole, Status). | CompanyMember, AuditLog, Notifications |
| `Company` | `companies` | Tenant business profiles (Name, Slug, Address, GST, AllowNegativeStock). | Members, Products, Sales, WorkOrders |
| `CompanyMember` | `company_members` | Maps users to tenants with specific role (OWNER, MANAGER, STAFF, WORKER). | User, Company |
| `Product` | `products` | Catalog items (SKU, Name, Type: FINISHED/RAW, SalePrice, PurchasePrice, MinStock). | Category, Unit, StockMovement, Inventory |
| `Category` | `categories` | Product categorization hierarchy. | Products, Company |
| `Unit` | `units` | Units of Measurement (Pcs, SqFt, Kg, Meters, Sets). | Products, Company |
| `Inventory` | `inventories` | Current real-time stock quantity per product per location. | Product, WarehouseLocation |
| `StockMovement` | `stock_movements` | Immutable audit log of every stock change (MovementType, Quantity, Reference). | Product, User, Company |
| `Customer` | `customers` | Client CRM profiles (Name, Phone, Email, CreditLimit, OutstandingBalance). | Sale, CustomerPayment, Addresses |
| `Supplier` | `suppliers` | Vendor CRM profiles (Company Name, Contact Person, OutstandingPayable). | Purchase, SupplierPayment, Addresses |
| `Sale` | `sales` | Sales orders and estimations (OrderNo, TotalAmount, Status, PaymentStatus). | Customer, SaleItem, Invoice |
| `Purchase` | `purchases` | Procurement orders (PurchaseNo, TotalAmount, Status, PaymentStatus). | Supplier, PurchaseItem, StockMovement |
| `WorkOrder` | `work_orders` | Production work orders (WorkOrderNo, Quantity, TargetDate, Status). | Product, Worker, Materials, QA Checks |
| `Worker` | `workers` | Workshop floor staff (Name, Code, DailyRate, Department). | WorkOrder, WorkerAttendance |
| `PaymentAccount` | `payment_accounts` | Bank accounts, cash registers, UPI gateways (AccountName, Type, Balance). | FinancialTransactions, Expenses |
| `Expense` | `expenses` | Operating overhead costs (Category, Amount, PaymentAccount, Date). | PaymentAccount, User, Company |

---

## 5. Complete Pages & Navigation Inventory

FurnitureOS features over **45 distinct web pages and dashboard screens**, organized logically into dedicated modules.

### 5.1 Auth & Onboarding Module

- **`/login` — User Authentication Page**
  - **Path**: `apps/web/app/(auth)/login/page.tsx`
  - **Features**: Email/Password authentication, form validation, error handling, session setup via HttpOnly cookies, auto-redirect based on user role (`/admin/dashboard` vs `/dashboard`).
- **`/register` — Company Registration Page**
  - **Path**: `apps/web/app/(auth)/register/page.tsx`
  - **Features**: Multi-step registration wizard for creating a new tenant company, owner account creation, slug validation.
- **`/access-request` — Access Request Submission & Tracking**
  - **Path**: `apps/web/app/access-request/page.tsx`
  - **Features**: Pending user status notification, form to request company membership approval, status indicator (Pending, Approved, Rejected).
- **`/account-suspended` — Suspension Warning Screen**
  - **Path**: `apps/web/app/account-suspended/page.tsx`
  - **Features**: Safeguard screen displayed when a user or company status is set to `SUSPENDED`.

---

### 5.2 Platform Admin Module (System Super-Admin)

- **`/admin/dashboard` — Platform Administration Control Panel**
  - **Path**: `apps/web/app/admin/dashboard/page.tsx`
  - **Features**: High-level platform KPIs (Total Companies, Active Subscriptions, Pending Access Requests, Total Users, Platform System Health).
- **`/admin/companies` — Tenant Companies Directory**
  - **Path**: `apps/web/app/admin/companies/page.tsx`
  - **Features**: Table listing all tenant companies, search/filter by status, company suspension toggle, company profile view.
- **`/admin/access-requests` — Company Membership Requests Management**
  - **Path**: `apps/web/app/admin/access-requests/page.tsx`
  - **Features**: Approve or reject incoming user access requests, assign company roles, view user verification details.
- **`/admin/users` — Global User Directory**
  - **Path**: `apps/web/app/admin/users/page.tsx`
  - **Features**: Cross-tenant user search, system role management (`PLATFORM_ADMIN` vs `COMPANY`), password reset triggers.
- **`/admin/activity` — System Audit Logs Viewer**
  - **Path**: `apps/web/app/admin/activity/page.tsx`
  - **Features**: Real-time audit log stream capturing API actions, security events, IP addresses, and user timestamps.

---

### 5.3 Core Workspace & Dashboard Module

- **`/dashboard` — Company Owner & Manager Command Center**
  - **Path**: `apps/web/app/dashboard/page.tsx`
  - **Features**: 
    - Overview metrics cards: Today's Revenue, Monthly Sales, Low Stock Alerts, Active Work Orders, Pending Receivables.
    - Quick Action links (New Sale, New Purchase, Add Product, Record Payment).
    - Sales trends chart (Weekly/Monthly bar chart).
    - Recent activities log & critical stock notifications.
- **`/my-work` — Employee Personal Workspace**
  - **Path**: `apps/web/app/my-work/page.tsx`
  - **Features**: Staff/Worker focused portal listing assigned production work orders, pending tasks, recent notes, and quick action shortcuts.

---

### 5.4 Inventory & Stock Control Module

- **`/inventory` — Inventory Dashboard & Master Overview**
  - **Path**: `apps/web/app/inventory/page.tsx`
  - **Features**: Total Stock Valuation KPI, Item Count Summary, Quick Navigation tabs to Products, Categories, Stock Movements.
- **`/inventory/products` — Product Catalog Management**
  - **Path**: `apps/web/app/inventory/products/page.tsx`
  - **Features**: 
    - Complete product table with SKU, Name, Type (Finished vs Raw), Category, Unit, Selling Price, Purchase Price, Available Quantity, Status.
    - Search, Category Filter, and Product Type filter tabs.
    - Action modal for creating new products with image upload preview.
- **`/inventory/categories` — Product Categories Hierarchy**
  - **Path**: `apps/web/app/inventory/categories/page.tsx`
  - **Features**: Category tree creation, product counts per category, edit/delete category options.
- **`/inventory/units` — Units of Measurement (UOM)**
  - **Path**: `apps/web/app/inventory/units/page.tsx`
  - **Features**: Manage measurement units (e.g., Sq. Ft, Meters, Pcs, Boxes, Sets) for accurate stock keeping.
- **`/inventory/movements` — Immutable Stock Audit Trail**
  - **Path**: `apps/web/app/inventory/movements/page.tsx`
  - **Features**: Granular log of all stock entries/exits (Purchase In, Sale Out, Production Issue, Damage, Adjustment, Initial Import) with user references.
- **`/inventory/adjust` — Manual Stock Adjustment Tool**
  - **Path**: `apps/web/app/inventory/adjust/page.tsx`
  - **Features**: Interface to correct inventory stock counts (Stock In / Stock Out), record reasons (Damaged, Found, Expired, Physical Audit Discrepancy).
- **`/inventory/low-stock` — Reorder Level Alerts**
  - **Path**: `apps/web/app/inventory/low-stock/page.tsx`
  - **Features**: Dedicated view for products whose stock levels have dropped below defined `minStockLevel`. One-click Purchase Order draft creation.
- **`/inventory/out-of-stock` — Stock-Out Emergency List**
  - **Path**: `apps/web/app/inventory/out-of-stock/page.tsx`
  - **Features**: Critical alert screen listing zero-stock products impacting active production orders or sales demands.

---

### 5.5 CRM & Business Relations Module

- **`/crm` — CRM Command Center**
  - **Path**: `apps/web/app/crm/page.tsx`
  - **Features**: Customer & Supplier total metrics, recent interaction logs, quick links to customer/supplier directories.
- **`/crm/customers` — Customer Directory & Profiles**
  - **Path**: `apps/web/app/crm/customers/page.tsx`
  - **Features**: Complete listing of furniture buyers/dealers/retail clients, contact numbers, credit limits, outstanding balances, order history.
- **`/crm/suppliers` — Supplier Directory & Vendor Profiles**
  - **Path**: `apps/web/app/crm/suppliers/page.tsx`
  - **Features**: Raw material vendors (timber, hardware, fabric, polish), contact details, pending payables, past purchase invoices.
- **`/crm/activities` — Client Interaction Log**
  - **Path**: `apps/web/app/crm/activities/page.tsx`
  - **Features**: Log customer calls, site visits, design consultations, quotes sent, follow-up scheduling.
- **`/crm/tags` — Customer & Supplier Tagging System**
  - **Path**: `apps/web/app/crm/tags/page.tsx`
  - **Features**: Manage custom tags (e.g., "VIP Client", "Wholesale", "Timber Vendor", "High Risk") for customer segmentation.
- **`/crm/settings` — CRM Module Configuration**
  - **Path**: `apps/web/app/crm/settings/page.tsx`
  - **Features**: Configure default customer payment terms, default credit limits, and custom fields.

---

### 5.6 Sales & Commercial Module

- **`/sales` — Sales Orders Master Table**
  - **Path**: `apps/web/app/sales/page.tsx`
  - **Features**: List of all sales transactions with Order Number, Date, Customer, Total Amount, Discount, Tax, Fulfillment Status (Pending, Processing, Delivered), Payment Status.
- **`/sales/new` — POS & Sales Order Creation Interface**
  - **Path**: `apps/web/app/sales/new/page.tsx`
  - **Features**: 
    - Dynamic line-item selector with automatic price lookup.
    - Real-time stock availability check.
    - Customer search modal or fast customer creation.
    - Tax calculation (GST/VAT), discount entry, total calculation.
- **`/sales/[id]` — Sales Order Detail View**
  - **Path**: `apps/web/app/sales/[id]/page.tsx`
  - **Features**: Detailed breakdown of a specific order, status progression bar, generate PDF invoice button, payment history timeline.
- **`/sales/estimates` — Quotation & Estimates Generator**
  - **Path**: `apps/web/app/sales/estimates/page.tsx`
  - **Features**: Create commercial quotes for custom furniture orders before converting them into binding sales orders.
- **`/sales/payments` — Customer Payments History**
  - **Path**: `apps/web/app/sales/payments/page.tsx`
  - **Features**: Record incoming customer payments (Cash, Bank Transfer, Card, UPI), apply to outstanding invoices, issue payment receipts.
- **`/sales/receivables` — Outstanding Accounts Receivable**
  - **Path**: `apps/web/app/sales/receivables/page.tsx`
  - **Features**: Aging receivables report breakdown (0-30 days, 31-60 days, 60+ days) to manage debt recovery.
- **`/invoices` — Tax Invoices Management**
  - **Path**: `apps/web/app/invoices/page.tsx`
  - **Features**: Official tax invoice records, PDF export, billing address validation, payment matching.

---

### 5.7 Purchases & Procurement Module

- **`/purchases` — Purchase Orders Directory**
  - **Path**: `apps/web/app/purchases/page.tsx`
  - **Features**: Master list of purchase orders placed with suppliers, receipt status, payment status.
- **`/purchases/new` — Create Purchase Order**
  - **Path**: `apps/web/app/purchases/new/page.tsx`
  - **Features**: Line item builder for raw materials (wood logs, plywood, screws, upholstery), supplier selection, agreed unit prices.
- **`/purchases/[id]` — Purchase Order Details & Goods Receipt**
  - **Path**: `apps/web/app/purchases/[id]/page.tsx`
  - **Features**: View order summary, receive inventory stock items into warehouse, match supplier invoice.
- **`/purchases/overview` — Procurement Analytics**
  - **Path**: `apps/web/app/purchases/overview/page.tsx`
  - **Features**: Monthly spend by supplier, top raw material costs trend.
- **`/purchases/payables` — Supplier Accounts Payable**
  - **Path**: `apps/web/app/purchases/payables/page.tsx`
  - **Features**: Track pending debts owed to raw material vendors, schedule payouts.

---

### 5.8 Production & Manufacturing Module

- **`/production` — Workshop Production Overview**
  - **Path**: `apps/web/app/production/page.tsx`
  - **Features**: High-level workshop stats: Active Work Orders, In-Progress Furniture Assembly, Quality Control Pass Rate, Material Usage summary.
- **`/work-orders` — Work Orders Management**
  - **Path**: `apps/web/app/work-orders/page.tsx`
  - **Features**: Table of manufacturing jobs (e.g., "Build 10x Dining Tables"), assigned carpenter team, target completion date, current state (Planned, In Production, QA, Completed).
- **`/work-orders/new` — Create Production Work Order**
  - **Path**: `apps/web/app/work-orders/new/page.tsx`
  - **Features**: Select target product, set target batch quantity, automatically pull Bill of Materials (BOM) for material allocation.
- **`/work-orders/[id]` — Work Order Workshop Execution View**
  - **Path**: `apps/web/app/work-orders/[id]/page.tsx`
  - **Features**: Issue raw materials to production floor, log labor hours, run quality control checklist, complete production to move finished goods into inventory.
- **`/workers` — Workshop Staff Directory**
  - **Path**: `apps/web/app/workers/page.tsx`
  - **Features**: Manage carpenters, polishers, upholsterers, supervisors, daily rates, skill categories.
- **`/workers/attendance` — Worker Daily Attendance Log**
  - **Path**: `apps/web/app/workers/attendance/page.tsx`
  - **Features**: Record daily present/absent status, overtime hours, calculating labor costs for production allocation.

---

### 5.9 Finance & Accounting Module

- **`/finance` — Financial Treasury Dashboard**
  - **Path**: `apps/web/app/finance/page.tsx`
  - **Features**: Total liquid cash across bank accounts, total revenue vs total expenses, net profit metric.
- **`/finance/accounts` — Payment Accounts & Cash Registers**
  - **Path**: `apps/web/app/finance/accounts/page.tsx`
  - **Features**: Manage business bank accounts, petty cash accounts, digital wallet accounts, view balances.
- **`/finance/expenses` — Operational Overhead Expenses**
  - **Path**: `apps/web/app/finance/expenses/page.tsx`
  - **Features**: Log non-inventory operating costs (Rent, Electricity, Machine Maintenance, Transport, Salaries) with receipt attachments.
- **`/finance/receivables` — Receivables Ledger Summary**
  - **Path**: `apps/web/app/finance/receivables/page.tsx`
  - **Features**: Financial overview of customer debts.
- **`/finance/payables` — Payables Ledger Summary**
  - **Path**: `apps/web/app/finance/payables/page.tsx`
  - **Features**: Financial overview of vendor obligations.
- **`/finance/payments` — Transaction History Log**
  - **Path**: `apps/web/app/finance/payments/page.tsx`
  - **Features**: Unified journal of all incoming and outgoing financial transactions across accounts.
- **`/finance/reconciliation` — Bank Account Reconciliation**
  - **Path**: `apps/web/app/finance/reconciliation/page.tsx`
  - **Features**: Match software financial transactions with bank statements.

---

### 5.10 Reports & Enterprise Analytics Module

- **`/reports` — Analytics Hub**
  - **Path**: `apps/web/app/reports/page.tsx`
  - **Features**: Central portal to launch specialized business intelligence reports with date range filtering and CSV/Excel/PDF export options.
- **`/reports/sales` — Comprehensive Sales Performance Report**
  - **Path**: `apps/web/app/reports/sales/page.tsx`
  - **Features**: Revenue by product category, top customers, sales channel performance, monthly trends.
- **`/reports/inventory` — Stock Valuation & Turnover Report**
  - **Path**: `apps/web/app/reports/inventory/page.tsx`
  - **Features**: Total asset inventory value, slow-moving items report, dead stock breakdown.
- **`/reports/production` — Workshop Efficiency & Material Wastage**
  - **Path**: `apps/web/app/reports/production/page.tsx`
  - **Features**: Production job turnaround time, BOM variance report (planned vs actual raw material consumed).
- **`/reports/finance` — Profit & Loss (P&L) Statement**
  - **Path**: `apps/web/app/reports/finance/page.tsx`
  - **Features**: Income vs Cost of Goods Sold (COGS) vs Operating Expenses = Net Profit.
- **`/reports/purchases` — Procurement Expense Report**
  - **Path**: `apps/web/app/reports/purchases/page.tsx`
  - **Features**: Purchasing spend breakdown by material type and vendor.
- **`/reports/customers` — Customer Buying Patterns**
  - **Path**: `apps/web/app/reports/customers/page.tsx`
  - **Features**: Customer lifetime value (CLV), purchase frequency.
- **`/reports/suppliers` — Vendor Reliability Report**
  - **Path**: `apps/web/app/reports/suppliers/page.tsx`
  - **Features**: On-time delivery performance and price stability analysis.
- **`/reports/expenses` — Expense Category Analysis**
  - **Path**: `apps/web/app/reports/expenses/page.tsx`
  - **Features**: Overhead cost distribution visual charts.

---

### 5.11 Data Utilities & Bulk Import Module

- **`/imports` — Bulk Data Upload Center**
  - **Path**: `apps/web/app/imports/page.tsx`
  - **Features**: Upload CSV/Excel spreadsheets to populate catalog items, customer lists, or initial stock balances.
- **`/imports/products` — Product Catalog CSV Importer**
  - **Path**: `apps/web/app/imports/products/page.tsx`
  - **Features**: Field mapping interface, validation preview, error highlight for duplicate SKUs.
- **`/imports/stock` — Opening Stock Importer**
  - **Path**: `apps/web/app/imports/stock/page.tsx`
  - **Features**: Bulk upload current stock counts during onboarding.

---

### 5.12 Settings & System Help Module

- **`/settings` — Settings Navigation Hub**
  - **Path**: `apps/web/app/settings/page.tsx`
  - **Features**: Access company configuration, user permissions, security controls.
- **`/settings/company` — Tenant Profile & Invoice Config**
  - **Path**: `apps/web/app/settings/company/page.tsx`
  - **Features**: Edit company name, logo upload, GST number, address, tax rate preferences, negative stock allowance switch.
- **`/settings/users` — Team Members & Role Assignment**
  - **Path**: `apps/web/app/settings/users/page.tsx`
  - **Features**: Invite staff members, update role assignments (`OWNER`, `MANAGER`, `STAFF`, `WORKER`), deactivate users.
- **`/settings/security` — Security & Session Controls**
  - **Path**: `apps/web/app/settings/security/page.tsx`
  - **Features**: Change password, view active logged-in sessions, enable 2FA security.
- **`/help` — Knowledge Base & Support Documentation**
  - **Path**: `apps/web/app/help/page.tsx`
  - **Features**: User manual, operational guides, system status link, support ticket form.

---

## 6. Express API Backend Architecture & Middleware

The backend application (`apps/api`) exposes a RESTful Express.js HTTP API engineered around modular middleware chains.

### Middleware Execution Sequence

```text
Request HTTP
   │
   ▼
1. express.json() & Compression Middleware
   │
   ▼
2. Helmet Security Headers & CORS Config
   │
   ▼
3. Rate Limiter (Prevent Brute Force)
   │
   ▼
4. Auth Middleware (Extract JWT from Cookie) ──> Attach req.user
   │
   ▼
5. Tenant Context Middleware ─────────────────> Attach req.tenantId
   │
   ▼
6. Zod Schema Validation Middleware ──────────> Validate req.body / req.query
   │
   ▼
7. Controller Endpoint Logic ──────────────────> Execute Business Service & Prisma DB
   │
   ▼
8. Centralized Error Handler ─────────────────> Standardized JSON Error Response
```

### Core API Endpoint Groups

| Group Route | Primary Operations | Target Controller / Module |
| :--- | :--- | :--- |
| `/api/auth/*` | POST `/login`, `/register`, `/logout`, GET `/me` | Auth Controller |
| `/api/admin/*` | GET/POST `/companies`, `/access-requests`, `/audit-logs` | Platform Admin Controller |
| `/api/products/*` | GET, POST, PUT, DELETE `/products`, `/categories`, `/units` | Product Catalog Controller |
| `/api/inventory/*` | GET `/stock`, POST `/adjustments`, GET `/movements` | Stock Management Controller |
| `/api/crm/*` | GET, POST `/customers`, `/suppliers`, `/activities` | CRM Controller |
| `/api/sales/*` | GET, POST `/orders`, `/estimates`, `/invoices` | Sales & Billing Controller |
| `/api/purchases/*` | GET, POST `/orders`, `/receives` | Procurement Controller |
| `/api/production/*`| GET, POST `/work-orders`, `/workers`, `/attendance` | Workshop Controller |
| `/api/finance/*` | GET, POST `/accounts`, `/expenses`, `/transactions` | Treasury Controller |
| `/api/reports/*` | GET `/sales`, `/inventory`, `/production`, `/finance` | Analytics Engine |
| `/api/imports/*` | POST `/upload-products`, `/upload-stock` | Data Import Worker |

---

## 7. End-to-End Core Business Workflows

### Workflow A: Order-to-Cash (Furniture Sales & Production)

```text
[Customer Inquiry] ──> [Sales Quote / Estimate Created]
                              │ Customer Accepts
                              ▼
                   [Sales Order Confirmed]
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
   [Available Stock Check]       [Out of Stock / Custom Order]
   (In-stock: Reserve Item)                 │
               │                            ▼
               │                [Generate Work Order]
               │                            │ (Material Issue & Workshop Build)
               │                            ▼
               │                [Quality Check & Stock-In]
               │                            │
               └──────────────┬──────────────┘
                              ▼
                [Finished Goods Stock Out]
                              │
                              ▼
                   [Tax Invoice Generated]
                              │
                              ▼
            [Customer Payment Recorded -> Bank Account]
                              │
                              ▼
             [Financial Ledger & P&L Updated]
```

---

### Workflow B: Procure-to-Pay (Raw Material Purchasing)

```text
[Low-Stock Alert Triggered] ──> [Draft Purchase Order Created]
                                             │
                                             ▼
                                  [Sent to Wood Supplier]
                                             │
                                             ▼
                                   [Goods Delivered]
                                             │
                                             ▼
                          [Receive Goods -> Stock Movement (In)]
                                             │
                                             ▼
                           [Supplier Invoice Matched]
                                             │
                                             ▼
                         [Payment Sent from Payment Account]
```

---

## 8. Role-Based Access Control (RBAC) Matrix

| User Role | Platform Admin | Company Owner | Manager | Staff | Workshop Worker |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **System Admin Portal (`/admin`)** | ✅ Full | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **Company Settings & Billing** | ❌ N/A | ✅ Full | ❌ Read Only | ❌ Blocked | ❌ Blocked |
| **User & Team Management** | ❌ N/A | ✅ Full | ❌ Read Only | ❌ Blocked | ❌ Blocked |
| **Inventory & Catalog Edit** | ❌ N/A | ✅ Full | ✅ Full | ✅ Create/Update | ❌ Read Only |
| **Sales & Invoice Creation** | ❌ N/A | ✅ Full | ✅ Full | ✅ Create/Update | ❌ Blocked |
| **Purchasing & Vendors** | ❌ N/A | ✅ Full | ✅ Full | ❌ Read Only | ❌ Blocked |
| **Production Work Orders** | ❌ N/A | ✅ Full | ✅ Full | ❌ Read Only | ✅ Update Status |
| **Financial Ledger & Expenses** | ❌ N/A | ✅ Full | ✅ Full | ❌ Blocked | ❌ Blocked |
| **Executive Reports & P&L** | ❌ N/A | ✅ Full | ✅ Limited | ❌ Blocked | ❌ Blocked |

---

## 9. Deployment & Operations Guide

### Prerequisites
- **Node.js**: v18.x or v20.x LTS
- **Package Manager**: `npm` v9+ or `pnpm`
- **Database Server**: Neon PostgreSQL (v15+)

### Environment Configuration (`.env`)

```env
NODE_ENV="production"
PORT=4000
DATABASE_URL="postgresql://user:password@ep-prod-sample.neon.tech/furnitureos?sslmode=require"
JWT_SECRET="super-secret-production-jwt-key"
COOKIE_DOMAIN=".furnitureos.local"
CORS_ORIGIN="http://localhost:3000"
LOG_LEVEL="info"
```

### Installation & Initialization Commands

```bash
# 1. Install all monorepo dependencies
npm install

# 2. Build shared workspace packages
npm run build --workspace=packages/shared

# 3. Generate Prisma ORM Client & Execute Database Migrations
npx prisma generate
npx prisma db push

# 4. Seed database with initial system roles & master categories
npx tsx prisma/seed.ts

# 5. Launch API and Frontend Next.js servers concurrently
npm run dev
```

---

> **Document Maintenance Note:** This documentation must be updated whenever new API endpoints, pages, or database schema migrations are committed to the codebase repository.
