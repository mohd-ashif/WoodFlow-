# Export Coverage Matrix

## Objective
Universal data export coverage documentation detailing module endpoints, supported formats (PDF, Excel, CSV), column selection capability, and role-based permissions.

---

## Module Export Matrix

| Module / Table | Table Export | PDF Format | Excel (.xlsx) Format | CSV Format | Column Selection | RBAC Permission | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- | :---: |
| **Sales Reports & Orders** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | `sales.export` | **VERIFIED** |
| **Inventory Valuation & Catalog** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | `inventory.export` | **VERIFIED** |
| **Purchase Orders & Vendors** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | `purchase.export` | **VERIFIED** |
| **Customer Analytics & Receivables** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | `customer.export` | **VERIFIED** |
| **Supplier Analytics & Payables** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | `supplier.export` | **VERIFIED** |
| **Cash Flow & Finance Statements** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | `finance.export` | **VERIFIED** |
| **Business Expense Reports** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | `finance.export` | **VERIFIED** |
| **Production & Work Orders** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | `worker.export` | **VERIFIED** |

---

## Security & Multi-Tenant Rules
- **Authenticated Context**: Tenant context (`req.tenantId`) is automatically retrieved from authenticated user session. Direct URL or API manipulation (`?companyId=other`) is blocked.
- **Sensitive Field Shielding**: Internal database cuid strings, password hashes, and security metadata are excluded from all generated export files.
- **Format Integrity**:
  - **PDF**: Renders printable document with company header, multi-page print table styling, summary totals, and page numbers.
  - **Excel (.xlsx)**: Generates SpreadsheetML XML workbook with company header, bold headers, formatted numerical values, and summary totals.
  - **CSV**: RFC 4180 escaped CSV payload.
