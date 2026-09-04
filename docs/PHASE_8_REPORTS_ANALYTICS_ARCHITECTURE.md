# Phase 8 — Reports, Analytics & Business Intelligence Architecture

## Overview
Phase 8 introduces a **Business Intelligence & Reporting Engine** designed specifically for small-to-medium furniture business owners. The system transforms operational data from Inventory, CRM, Sales, Purchases, Production, Workers, and Finance into clear, visual, and actionable insights.

---

## Analytics System Architecture

```
Operational Modules (Sales, Purchases, Inventory, CRM, Production, Finance, Workers)
                        │
                        ▼
            Analytics Service Layer (`apps/api/src/modules/analytics`)
                        │
          ┌─────────────┴─────────────┐
          ▼                           ▼
SQL/Prisma Aggregation       CSV Export Engine (`export.service.ts`)
          │                           │
          ▼                           ▼
Analytics API Endpoints       Secure Report CSV File Stream
          │
          ▼
Web Intelligence Frontend (`apps/web/app/reports`)
```

---

## KPI Definitions & Calculation Rules

### 1. Executive Dashboard KPIs
- **Total Sales Revenue**: $\sum \text{sale.totalAmount}$ where `status != 'CANCELLED'` for selected period.
- **Total Purchase Expenditure**: $\sum \text{purchase.totalAmount}$ where `status != 'CANCELLED'` for selected period.
- **Business Expenses**: $\sum \text{expense.amount}$ where `status == 'PAID'` for selected period.
- **Money Received**: $\sum \text{customerPayment.amount}$ for selected period.
- **Money Paid**: $\sum \text{supplierPayment.amount} + \sum \text{expense.amount}$ for selected period.
- **Net Cash Flow**: $\text{Money Received} - \text{Money Paid}$. Internal transfers between company accounts are strictly excluded per Phase 7 reconciliation rules.
- **Outstanding Receivables**: $\sum \text{sale.dueAmount}$ for all non-cancelled sales across the system.
- **Outstanding Payables**: $\sum \text{purchase.dueAmount}$ for all non-cancelled purchases across the system.
- **Inventory Valuation**: $\sum (\text{product.currentStock} \times \text{product.costPrice})$ for all active products.

### 2. Period-over-Period Delta Formula
$$\text{Percentage Change} = \frac{\text{Current Value} - \text{Previous Value}}{\text{Previous Value}} \times 100$$
- If Previous Value = 0 and Current Value > 0: $+100\%$ Increase.
- Direction: `INCREASE`, `DECREASE`, or `NO_CHANGE`.

---

## API Endpoints Added

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/analytics/overview` | `GET` | Executive dashboard KPIs, top selling products, automated insights. |
| `/api/v1/analytics/sales` | `GET` | Sales revenue summary, average order value, product breakdown, transaction log. |
| `/api/v1/analytics/inventory` | `GET` | Inventory valuation summary, low stock warning list, out of stock list, full directory. |
| `/api/v1/analytics/purchases` | `GET` | Purchase expenditure, supplier breakdown, procurement log. |
| `/api/v1/analytics/customers` | `GET` | Top 10 high-value customers, customer directory, outstanding balance. |
| `/api/v1/analytics/suppliers` | `GET` | Top procurement suppliers, vendor order history, payables. |
| `/api/v1/analytics/finance` | `GET` | Cash flow statement, account liquid balances, payment logs. |
| `/api/v1/analytics/expenses` | `GET` | Outflow category breakdown, expense log. |
| `/api/v1/analytics/production` | `GET` | Work order execution metrics, completion rates, worker activity stats. |
| `/api/v1/analytics/export` | `GET` | Secure CSV export stream (`reportType=sales|inventory|purchases|customers|suppliers|finance|expenses`). |

---

## Security & Multi-Tenant Scoping

1. **Tenant Isolation**: Every SQL and Prisma query filters strictly by `companyId` extracted from the authenticated user's active tenant session (`req.tenantId`).
2. **Role-Based Access Control (RBAC)**:
   - `OWNER` / `MANAGER`: Full access to all reports, financial metrics, and CSV exports.
   - `STAFF`: Access limited to operational reports (Sales, Inventory, Production).
   - `WORKER`: Access limited to assigned task completion statistics.

---

## Data Consistency Validation

- **Sales Totals**: Executive Sales KPI matches sum of valid sales in Sales Order module.
- **Inventory Valuation**: Inventory Valuation matches sum of product stock $\times$ cost price.
- **Receivables & Payables**: Receivables match unpaid customer sales balances; Payables match unpaid supplier purchase balances.
- **Cash Flow Integrity**: Internal transfers (e.g. Cash $\rightarrow$ Bank) do not distort revenue, expense, or net cash flow figures.
