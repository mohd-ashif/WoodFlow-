# FRONTEND ARCHITECTURE & PERFORMANCE GUIDELINES

This document outlines the mandatory rules of engagement and architectural standards for frontend developers building on **FurnitureOS Web Application**.

---

## 1. MANDATORY RULES OF ENGAGEMENT

```text
RULE 1: Never duplicate server state in Redux or local component state.
RULE 2: Use TanStack React Query for all server-state data fetching.
RULE 3: Always use tenant-scoped query keys from `queryKeys.ts` containing `companyId`.
RULE 4: Debounce all search input fields (300ms window) before updating query state.
RULE 5: Always set `enabled: Boolean(user && companyId)` on protected queries.
RULE 6: Never call `invalidateQueries()` globally without specifying a target entity key.
RULE 7: Use `useMemo` and `useCallback` only when derived computations or references are costly.
RULE 8: Use server-side pagination for tables (`page` and `limit` query params).
RULE 9: Use granular skeleton loaders (`TableSkeleton`, `CardSkeleton`) instead of full-page blocking spinners.
RULE 10: Keep Redux strictly for client UI state (Theme, Sidebar, Active Modals).
```

---

## 2. STATE MANAGEMENT ARCHITECTURE DIAGRAM

```text
                        ┌───────────────┐
                        │   Backend API │
                        └───────┬───────┘
                                │
                                ▼
                        ┌───────────────┐
                        │ Axios/Fetch   │
                        └───────┬───────┘
                                │
                                ▼
                        ┌───────────────┐
                        │ Services      │
                        └───────┬───────┘
                                │
                                ▼
                        ┌──────────────────┐
                        │ TanStack Query   │
                        │ Server State     │
                        └────────┬─────────┘
                                 │
                                 ▼
                           React Components


Redux Toolkit / Local React State
      │
      ▼
Client / UI State Only
(Sidebar, Modals, Theme, Auth UI State)
```

---

## 3. QUERY KEY FACTORY PATTERN

Always import `queryKeys` from `@/lib/queryKeys`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { productService } from '@/services/productService';

export function useProducts(companyId?: string, filters?: any) {
  return useQuery({
    queryKey: queryKeys.products.list(companyId, filters),
    queryFn: () => productService.getProducts(filters),
    enabled: Boolean(companyId),
  });
}
```

---

## 4. CODE REVIEW CHECKLIST FOR FRONTEND PULL REQUESTS
- [ ] No `useEffect` fetch loops.
- [ ] Query key includes `companyId`.
- [ ] Search input uses `useDebounce`.
- [ ] Loading state uses skeletons.
- [ ] No un-memoized expensive list transformations in render body.
