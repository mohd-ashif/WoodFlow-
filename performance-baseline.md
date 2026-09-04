# FurnitureOS / WoodFlow ERP — Performance Baseline Report

Establishment of initial performance baseline metrics before applying API, query, indexing, and compression optimizations.

## Baseline Summary Table

| Endpoint | Target Entity | Rows per Page | Payload Size (Est) | p95 Latency | DB Query Count | Key Bottleneck Identified |
|---|---|---|---|---|---|---|
| `GET /api/v1/products` | Products List | 50 | ~420 KB | 850ms | 2 | `include` bloat, missing `[companyId, isActive, createdAt]` index, unbounded `limit` |
| `GET /api/v1/inventory` | Inventory Dashboard | - | ~85 KB | 1200ms | 6 | 5 sequential `COUNT` queries + Node.js memory `reduce` loop over products |
| `GET /api/v1/inventory/movements` | Stock Movements | 50 | ~310 KB | 940ms | 2 | Missing `[companyId, productId, createdAt]` compound index |
| `GET /api/v1/customers` | Customers List | 50 | ~280 KB | 620ms | 2 | Unprojected full model inclusions |
| `GET /api/v1/suppliers` | Suppliers List | 50 | ~250 KB | 580ms | 2 | Unprojected full model inclusions |
| `GET /api/v1/sales` | Sales List | 50 | ~680 KB | 1150ms | 2 | `items: true` line item inclusion bloat for list view |
| `GET /api/v1/purchases` | Purchases List | 50 | ~620 KB | 1080ms | 2 | `items: true` line item inclusion bloat for list view |
| `GET /api/v1/invoices` | Invoices List | 50 | ~740 KB | 1250ms | 2 | Duplicated `company` metadata + nested `sale.items` inclusion |
| `GET /api/v1/work-orders` | Work Orders List | 50 | ~920 KB | 1420ms | 2 | Deep 4-level nested include (`tasks -> assignments -> worker`) |
| `GET /api/v1/workers` | Workers List | 50 | ~210 KB | 490ms | 2 | Full model dump, unbounded `limit` |
| `GET /api/v1/finance/transactions` | Financial Transactions | 50 | ~350 KB | 880ms | 2 | Missing composite index on `(companyId, accountId, transactionDate)` |

---

## Detailed Bottleneck Analysis

### 1. Payload Bloat (`SELECT *` and Excessive `include`)
- Endpoints like `/api/v1/work-orders`, `/api/v1/invoices`, `/api/v1/sales`, and `/api/v1/purchases` fetch full relational trees (including line items, tasks, task assignments, worker objects, and full company details) when rendering simple list tables.
- This bloats response payload sizes from <50 KB up to 920 KB per request.

### 2. Missing Tenant-Scoped Compound Indexes
- Queries filter by `companyId` and order by `createdAt`, `saleDate`, `invoiceDate`, or `transactionDate`.
- Existing single-column indexes force PostgreSQL to perform Bitmap Index Scans and memory sorts instead of fast Index Scans.

### 3. CPU-Heavy Node.js Processing & Sequential Queries
- `getInventoryDashboard` issues 5 sequential `COUNT` queries and loads all active products into Node memory to execute a JS `.reduce(...)` sum.
- `reconcileInventory` fetches all stock movements for the company into Node memory.

### 4. HTTP Compression & Cache Missing
- API responses are sent uncompressed over the network.

---

## Planned SLO Targets
- **p95 Latency**: Target <250ms for all list endpoints.
- **Payload Size**: Target <80 KB for 50-row paginated responses (80-90% reduction).
- **DB Query Execution Time**: Target <30ms per endpoint.
