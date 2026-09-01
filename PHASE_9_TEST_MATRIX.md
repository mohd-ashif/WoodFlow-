# PHASE 9 — CRITICAL BUSINESS TEST MATRIX

## Overview
This document contains the execution matrix for end-to-end business validation, inventory accuracy testing, financial ledger verification, multi-tenant security isolation, and return workflows.

---

## E2E Business Test Execution Matrix

| Test ID | Test Scenario | Expected Outcome | Status |
| :---: | :--- | :--- | :---: |
| **TEST-01** | **Opening Stock Creation** | Sets initial inventory stock and logs `OPENING_STOCK` movement | **PASS** |
| **TEST-02** | **Purchase Order Execution** | Increases product stock (`+qty`), creates PO, and increases Supplier outstanding balance | **PASS** |
| **TEST-03** | **Sales Invoice Execution** | Checks stock availability, decreases stock (`-qty`), creates invoice, increases Customer outstanding balance | **PASS** |
| **TEST-04** | **Insufficient Stock Guard** | Attempting sale with insufficient stock is blocked with error | **PASS** |
| **TEST-05** | **Sales Return Workflow** | Return increases stock (`+qty`), logs `SALES_RETURN` movement, and reduces Customer receivable balance | **PASS** |
| **TEST-06** | **Purchase Return Workflow** | Return decreases stock (`-qty`), logs `PURCHASE_RETURN` movement, and reduces Supplier payable balance | **PASS** |
| **TEST-07** | **Physical Stock Adjustment** | Manual physical count adjust creates explicit `ADJUSTMENT_ADD` or `ADJUSTMENT_SUBTRACT` movement log | **PASS** |
| **TEST-08** | **Customer Payment Recording** | Recording customer payment reduces receivable balance; prevents payment > balance | **PASS** |
| **TEST-09** | **Supplier Payment Recording** | Recording supplier payment reduces payable balance; updates financial ledger | **PASS** |
| **TEST-10** | **Server Financial Calculation Guard** | Submitting altered totals from client is overridden and recalculated server-side | **PASS** |
| **TEST-11** | **Global Search Isolation** | Searching `Ctrl+K` returns only records belonging to authenticated tenant (`companyId`) | **PASS** |
| **TEST-12** | **Notification Triggering** | Dropping stock below reorder level automatically creates a `LOW_STOCK` in-app notification | **PASS** |
| **TEST-13** | **Cloudinary Tenant Hierarchy** | Images saved under `stockrow/{companyId}/{entityType}` folder; cross-tenant delete returns `403` | **PASS** |
| **TEST-14** | **Universal Excel/CSV Import** | Imports Excel files for Products/Sales/Purchases cleanly into database within transaction | **PASS** |
| **TEST-15** | **Data Consistency Audit** | `GET /api/v1/system/data-consistency` verifies `currentStock` equals sum of `StockMovement` logs | **PASS** |
| **TEST-16** | **RBAC Worker Salary Masking** | Worker salary fields hidden for non-owner roles lacking `payroll.manage` permission | **PASS** |
| **TEST-17** | **Double Click Submit Guard** | Form buttons enter loading state during async execution, preventing duplicate submissions | **PASS** |
| **TEST-18** | **Tenant Isolation Breach Attempt** | Attempting direct URL access or API fetch with another company ID returns `403 Forbidden` | **PASS** |
