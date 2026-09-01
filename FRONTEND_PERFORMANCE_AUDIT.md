# PHASE 9.6 — FRONTEND PERFORMANCE & ARCHITECTURE AUDIT

This document records the comprehensive performance, state management, data loading, and API query audit of **FurnitureOS Web Application**.

---

## 1. PERFORMANCE & DATA FETCHING AUDIT FINDINGS

### AUDIT ITEM 1: Query Key Standardization & Tenant Isolation
- **Issue**: Query keys were declared ad-hoc as raw strings (e.g. `['products']`, `['sales']`, `['executive-overview', preset]`).
- **Location**: `apps/web/app/**/*.tsx`
- **Impact**: Medium-High risk of cross-tenant cache bleeding if Company A's cached queries were not strictly scoped by `companyId`.
- **Root Cause**: Missing centralized query key factory.
- **Recommended Solution**: Implement `apps/web/lib/queryKeys.ts` scoping every entity query by `companyId` and filter object.
- **Priority**: `HIGH`

---

### AUDIT ITEM 2: Un-debounced Search API Triggering
- **Issue**: Table search inputs triggered immediate network requests on every keystroke.
- **Location**: `apps/web/app/inventory/products/page.tsx`, `apps/web/app/sales/page.tsx`, `apps/web/app/crm/customers/page.tsx`
- **Impact**: Medium (API request storms when typing multi-character queries).
- **Root Cause**: Search state directly tied to TanStack `useQuery` filters without debouncing.
- **Recommended Solution**: Create `useDebounce` hook with a 300ms delay for search parameters.
- **Priority**: `HIGH`

---

### AUDIT ITEM 3: Global Loading State Blocking UI
- **Issue**: Layouts relied on generic single spinner overlays during route changes.
- **Location**: `apps/web/components/layout/AppShell.tsx`, `apps/web/app/reports/page.tsx`
- **Impact**: Medium (Flickering UI and poor perceived loading performance).
- **Root Cause**: Lack of component-level skeleton loaders for cards and data tables.
- **Recommended Solution**: Build modular `Skeletons.tsx` (`CardSkeleton`, `TableSkeleton`, `MetricSkeleton`).
- **Priority**: `MEDIUM`

---

### AUDIT ITEM 4: Blind Query Invalidation After Mutations
- **Issue**: Some mutations triggered `queryClient.invalidateQueries()` without specifying target entity keys.
- **Location**: `apps/web/app/sales/new/page.tsx`, `apps/web/app/purchases/new/page.tsx`
- **Impact**: Medium (Causes unnecessary re-fetching of unrelated background queries).
- **Root Cause**: Missing scoped invalidation strategy.
- **Recommended Solution**: Scope invalidation to `queryKeys.sales.all(companyId)` or `queryKeys.products.all(companyId)`.
- **Priority**: `MEDIUM`

---

### AUDIT ITEM 5: Auth & Tenant Initialization Guard
- **Issue**: Queries could potentially attempt executing before `user` or `companyId` were fully loaded.
- **Location**: `apps/web/app/finance/reconciliation/page.tsx`
- **Impact**: Low-Medium (Triggers transient HTTP 401/403 errors on initial page mount).
- **Root Cause**: Missing `enabled: Boolean(user && companyId)` condition in `useQuery` options.
- **Recommended Solution**: Enforce `enabled: Boolean(companyId)` on all tenant data queries.
- **Priority**: `HIGH`

---

## 2. STATE MANAGEMENT ARCHITECTURE DECLARATION

```text
                                CLIENT STATE
                      (Auth UI, Theme, Sidebar, Modals)
                                      │
                                      ▼
                             React State & Context
                                      │
                                      ▼
                               UI Rendering

                                      ▲
                                      │
                                SERVER STATE
                     (Products, Sales, CRM, Analytics)
                                      │
                                      ▼
                        TanStack React Query Cache v5
                                      │
                                      ▼
                           Centralized Axios/Fetch API
```

- **Client State**: Auth user status, active sidebar tab, theme preference, modal open/closed states.
- **Server State**: Managed exclusively by TanStack Query. No API payloads copied into Redux or global client state.
