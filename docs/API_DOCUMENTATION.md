# REST API Architecture & Endpoint Specification v1.0.0

Base URL: `https://api.furnitureos.com/api/v1`

---

## Headers & Multi-Tenant Context

All authenticated requests must supply:

- `Authorization: Bearer <JWT_ACCESS_TOKEN>`
- `x-company-id: <COMPANY_ID>` (Mandatory header for company-scoped routes)
- `Content-Type: application/json`

---

## 1. Authentication API (`/auth`)

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register new user account |
| `POST` | `/auth/login` | Public | User login, returns JWT access token & HTTP cookie |
| `POST` | `/auth/logout` | Public | Clears authentication cookies |
| `GET` | `/auth/me` | Authenticated | Fetch current user session profile & company memberships |
| `POST` | `/auth/refresh` | Public | Refresh expired JWT access token |

---

## 2. Access Request API (`/access-requests`)

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/access-requests` | Authenticated | Submit company creation access request |
| `GET` | `/access-requests/mine` | Authenticated | Fetch user submitted access requests |
| `GET` | `/access-requests` | Admin | List all pending company access requests |
| `POST` | `/access-requests/:id/approve` | Admin | Approve company request & auto-provision tenant |
| `POST` | `/access-requests/:id/reject` | Admin | Reject company request with reason |

---

## 3. Product & Inventory API (`/products`, `/inventory`)

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/products` | Member | List company products (supports pagination, search, category filter) |
| `POST` | `/products` | Staff+ | Create new product & opening stock |
| `GET` | `/products/:id` | Member | Fetch product details by ID |
| `PUT` | `/products/:id` | Staff+ | Update product details |
| `DELETE` | `/products/:id` | Owner/Manager | Delete product |
| `GET` | `/inventory` | Member | Get real-time stock levels & reserved quantities |
| `POST` | `/inventory/adjust` | Staff+ | Perform stock adjustment (IN/OUT/CORRECTION/DAMAGE) |
| `GET` | `/inventory/movements` | Member | Fetch stock movement audit trail |

---

## 4. Sales & Invoicing API (`/sales`, `/invoices`)

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/sales` | Member | List sales transactions |
| `POST` | `/sales` | Staff+ | Create sale & update inventory stock levels |
| `GET` | `/sales/:id` | Member | Fetch sale invoice details |
| `POST` | `/sales/:id/cancel` | Manager+ | Cancel sale & restore stock |
| `POST` | `/sales/:id/returns` | Staff+ | Process full or partial sales return |
| `GET` | `/invoices/:id/pdf` | Member | Stream PDF invoice download |

---

## 5. Purchase & Supplier API (`/purchases`, `/suppliers`)

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/purchases` | Member | List purchase orders |
| `POST` | `/purchases` | Staff+ | Create purchase order |
| `PATCH` | `/purchases/:id/status` | Staff+ | Receive purchase items & increase stock |
| `GET` | `/suppliers` | Member | List suppliers |
| `POST` | `/suppliers` | Staff+ | Create supplier record |

---

## 6. Workers & Production API (`/workers`, `/work-orders`)

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/workers` | Member | List workers & employment details |
| `POST` | `/workers` | Manager+ | Create worker record |
| `GET` | `/work-orders` | Member | List production work orders |
| `POST` | `/work-orders` | Manager+ | Create production work order |
| `PATCH` | `/work-orders/:id/status` | Staff+ | Update production stage & quality status |

---

## 7. Reports & Universal Data Import API (`/analytics`, `/imports`)

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/analytics/dashboard` | Member | Fetch high level business KPI summary |
| `GET` | `/analytics/sales` | Member | Detailed sales performance report |
| `POST` | `/imports/upload` | Staff+ | Upload CSV/Excel file for bulk module data import |
| `GET` | `/imports/history` | Member | Get historical import job status logs |

---

## Standard Error Response Structure

```json
{
  "success": false,
  "message": "Human readable error summary message",
  "code": "ERROR_CODE_CONSTANT"
}
```
