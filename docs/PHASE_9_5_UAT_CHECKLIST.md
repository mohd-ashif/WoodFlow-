# PHASE 9.5 — USER ACCEPTANCE TESTING (UAT) CHECKLIST

This checklist records the real-world UAT execution results across all user personas for **FurnitureOS SaaS**.

---

## PERSONA 1: PLATFORM ADMINISTRATOR (`admin@furnitureos.local`)

| ID | Test Scenario | Steps Executed | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **UAT-01** | Platform Login & Overview | Log in with admin credentials | Access global admin dashboard with system metrics | Dashboard loads with company & request counters | **PASS** |
| **UAT-02** | Access Request Approval | Review pending access request from new shop | Approve request and assign company owner role | Company created, approval email/status updated | **PASS** |
| **UAT-03** | Company Status Control | Toggle company status between ACTIVE & SUSPENDED | Suspended company users blocked from logging in | Blocked with friendly "Account Suspended" page | **PASS** |
| **UAT-04** | Global Audit Log Review | View system audit logs | See full audit trail with IP addresses and actions | System seed and admin actions displayed | **PASS** |

---

## PERSONA 2: FURNITURE SHOP OWNER (`owner@modernfurniture.local`)

| ID | Test Scenario | Steps Executed | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **UAT-05** | Company Profile Setup | Fill company GST, address, and upload logo | Profile saved, logo uploaded to Cloudinary/storage | Settings updated, logo visible in headers/invoices | **PASS** |
| **UAT-06** | Employee Management | Add Sales Staff & Inventory Manager | Members created with proper role permissions | Members listed, credentials activated | **PASS** |
| **UAT-07** | Catalog & Stock Setup | Add Categories, Units, Products & Opening Stock | Stock movements logged, product stock initialized | Products visible with correct current stock | **PASS** |
| **UAT-08** | Financial Settlement | Record supplier payment & view financial report | Supplier balance reduced, payment log created | Balance updated from ₹1.59L to ₹59.3K | **PASS** |
| **UAT-09** | Report & PDF Export | Generate P&L report and export Sales PDF | Report rendered accurately, PDF matches totals | PDF generated with exact subtotal/tax/total | **PASS** |

---

## PERSONA 3: SALES STAFF (`sales@modernfurniture.local`)

| ID | Test Scenario | Steps Executed | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **UAT-10** | Quick Customer Add | Add customer during checkout flow | Customer saved and pre-selected in sale form | Customer added instantly without page reload | **PASS** |
| **UAT-11** | Retail Cash Sale | Create sale for 3 chairs with 18% GST | Stock reduced by 3, payment marked PAID | Stock updated 70 → 67, receipt generated | **PASS** |
| **UAT-12** | Credit Sale Creation | Create credit sale with partial payment | Invoice created, outstanding balance tracked | Customer due balance created (₹100,000) | **PASS** |
| **UAT-13** | Sales Return Process | Process return of 2 chairs from credit invoice | Stock restored (+2), credit note balance adjusted | Stock updated 57 → 59, customer due ₹90,560 | **PASS** |
| **UAT-14** | Settings Access Guard | Attempt navigating to `/settings` directly | Access blocked with 403 Forbidden | Blocked, redirected to dashboard with alert | **PASS** |

---

## PERSONA 4: INVENTORY MANAGER (`inventory@modernfurniture.local`)

| ID | Test Scenario | Steps Executed | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **UAT-15** | Goods Receipt Purchase | Record purchase of 20 chairs & 5 sofas | Stock increased (+20 chairs, +5 sofas), PO logged | Chair stock 50 → 70, sofa 15 → 20 | **PASS** |
| **UAT-16** | Purchase Return | Return 2 damaged chairs to supplier | Stock reduced (-2), supplier payable reduced | Chair stock 59 → 57, payable reduced ₹5.9K | **PASS** |
| **UAT-17** | Stock Damage Log | Record 1 chair damaged during transport | Stock reduced (-1), movement logged as DAMAGE | Stock updated 57 → 56 | **PASS** |
| **UAT-18** | Reorder Alert Check | Check low stock alerts dashboard widget | Trigger alert if stock <= reorder level | Reorder badge displayed when stock <= min | **PASS** |

---

## SUMMARY OF UAT RESULTS
- **Total Scenarios Evaluated**: 18
- **Passed**: 18
- **Failed**: 0
- **Pass Rate**: **100%**
