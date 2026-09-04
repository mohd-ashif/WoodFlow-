# INVENTORY RECONCILIATION REPORT — 30-DAY BUSINESS SIMULATION

Company: **Modern Furniture House**  
Location: Kochi, Kerala, India  
Audit Date: September 2026  
Status: **100% RECONCILED (0 MISMATCHES)**

---

## 1. RECONCILIATION FORMULA
$$\text{Expected Stock} = \text{Opening Stock} + \text{Purchases} + \text{Sales Returns} - \text{Sales} - \text{Purchase Returns} + \text{Adjustments} - \text{Damage}$$

---

## 2. PRODUCT-BY-PRODUCT RECONCILIATION TABLE

| Product SKU | Product Name | Opening | Purchases | Sales Ret | Sales | Purch Ret | Adjustments | Damage | Expected Stock | Database Stock | UI Stock | Reconciliation Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **CHAIR-WOOD-001** | Premium Wooden Chair | 50 | +20 | +2 | -13 | -2 | 0 | -1 | **56** | 56 | 56 | **✓ PASS** |
| **SOFA-3SEAT-001** | Teakwood 3-Seater Sofa | 15 | +5 | 0 | 0 | 0 | +1 | 0 | **21** | 21 | 21 | **✓ PASS** |
| **DINING-SET-001** | 6-Seater Wooden Dining Set | 10 | 0 | 0 | -2 | 0 | 0 | 0 | **8** | 8 | 8 | **✓ PASS** |
| **BED-KING-001** | King Size Storage Bed | 8 | 0 | 0 | 0 | 0 | 0 | 0 | **8** | 8 | 8 | **✓ PASS** |
| **WARDROBE-WOOD-001** | 3-Door Wooden Wardrobe | 12 | 0 | 0 | 0 | 0 | 0 | 0 | **12** | 12 | 12 | **✓ PASS** |

---

## 3. AUDIT TRAIL OF STOCK MOVEMENTS (MODERN FURNITURE HOUSE)

1. **OPENING STOCK**: 50 Chairs, 15 Sofas, 10 Dining Sets, 8 Beds, 12 Wardrobes logged via `OPENING_STOCK`.
2. **DAY 2 PURCHASE (`PUR-000001`)**: Received +20 Chairs (stock 50 → 70) & +5 Sofas (stock 15 → 20) via `PURCHASE`.
3. **DAY 3 SALE (`SAL-000001`)**: Sold -3 Chairs (stock 70 → 67) via `SALE`.
4. **DAY 5 SALE (`SAL-000002`)**: Sold -10 Chairs (stock 67 → 57) & -2 Dining Sets (stock 10 → 8) via `SALE`.
5. **DAY 10 SALES RETURN**: Customer returned +2 Chairs (stock 57 → 59) via `SALES_RETURN`.
6. **DAY 15 PURCHASE RETURN**: Returned -2 damaged Chairs to supplier (stock 59 → 57) via `PURCHASE_RETURN`.
7. **DAY 20 DAMAGE**: Logged -1 damaged Chair during showroom transport (stock 57 → 56) via `DAMAGE`.
8. **DAY 20 ADJUSTMENT**: Added +1 Sofa physical stock correction (stock 20 → 21) via `STOCK_ADJUSTMENT_IN`.

---

## 4. FINANCIAL & LEDGER RECONCILIATION

### Sales & Invoicing Accuracy
- **SAL-000001 (Cash Sale)**: $3 \times ₹4,000 = ₹12,000 + 18\% \text{ GST } (₹2,160) = ₹14,160$. Paid: ₹14,160. Due: ₹0. `✓ MATCH`
- **SAL-000002 (Credit Sale)**: $(10 \times ₹4,000) + (2 \times ₹42,000) = ₹1,24,000 - ₹4,000 \text{ Disc} = ₹1,20,000 + 18\% \text{ GST } (₹21,600) = ₹1,41,600$. Initial Paid: ₹41,600. Initial Due: ₹1,00,000. `✓ MATCH`
- **Sales Return Credit Note**: $2 \times ₹4,000 \text{ Chair } + 18\% \text{ GST } = ₹9,440$. Customer Due updated: $₹1,00,000 - ₹9,440 = ₹90,560$. `✓ MATCH`
- **Final Customer Payment**: Received ₹90,560. Final Customer Due: ₹0. `✓ MATCH`

### Purchase & Payables Accuracy
- **PUR-000001**: $(20 \times ₹2,500) + (5 \times ₹18,000) = ₹1,40,000 + 18\% \text{ GST } (₹25,200) = ₹1,65,200$. `✓ MATCH`
- **Purchase Return Debit Note**: $2 \times ₹2,500 \text{ Chair } + 18\% \text{ GST } = ₹5,900$. Supplier Payable updated: $₹1,65,200 - ₹5,900 = ₹1,59,300$. `✓ MATCH`
- **Supplier Payment**: Paid ₹1,00,000. Outstanding Supplier Balance: ₹59,300. `✓ MATCH`

---

## 5. CONCLUSION
Inventory ledger math, current database quantities, inventory available stock, customer outstanding balance, and supplier payable ledger match 100% with zero discrepancies.
