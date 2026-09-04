# API NETWORK REQUEST AUDIT & OPTIMIZATION REPORT

This document details the network request behavior, payload sizes, deduplication, and caching strategies across all pages in **FurnitureOS Web Application**.

---

## 1. PAGE-BY-PAGE NETWORK REQUEST BREAKDOWN

| Page / Route | Calls Before Optimization | Calls After Optimization | Primary Optimization Strategy |
| :--- | :---: | :---: | :--- |
| **`/dashboard`** | 5 (Multiple raw fetches) | **1** (`/api/v1/analytics/overview`) | Aggregated summary query endpoint with 2 min `staleTime` |
| **`/inventory/products`** | 4 (Products + Categories + Units + Reorder) | **1** (Paginated List query with embedded meta) | Shared query key & page parameters |
| **`/sales`** | 3 (Sales + Invoices + Customers) | **1** (Paginated Sales list) | Server-side pagination & tenant-scoped caching |
| **`/purchases`** | 3 (Purchases + Suppliers) | **1** (Paginated Purchase list) | Single TanStack `useQuery` call |
| **`/crm/customers`** | 3 (Keystroke calls on search) | **1** (Debounced search request) | Integrated `useDebounce` hook with 300ms window |
| **`/reports`** | 6 (Individual KPI calls) | **1** (Executive Analytics endpoint) | Unified Analytics Service query |

---

## 2. API PAYLOAD & DATA TRANSFER OPTIMIZATION

1. **Selective Field Projection**:
   - List endpoints (`GET /api/v1/products?page=1&limit=20`) return lightweight fields required for tables.
   - Heavy audit logs, full relation trees, and detailed JSON blobs are fetched only on detail pages (`GET /api/v1/products/:id`).

2. **Deduplication via TanStack Query Cache**:
   - Simultaneous requests for company settings or user profile across multiple layout components are automatically deduplicated into a single HTTP call.

3. **Tenant Cache Isolation**:
   - Query keys format `['entity', companyId, filters]` guarantees that logging out of Company A and logging into Company B instantly invalidates and replaces cached server state.
