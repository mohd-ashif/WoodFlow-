import { describe, it, expect } from 'vitest';
import { calculateSaleTotals } from '../src/modules/sales/sale.calculator.js';

describe('Phase 4.5 — Sales & Invoicing Business Rules', () => {
  it('should accurately calculate subtotal, discount, GST tax, and grand total', () => {
    const rawItems = [
      {
        product: { id: 'p1', name: 'Teak Dining Table', sku: 'TBL-001', sellingPrice: 10000 },
        quantity: 2,
        discountAmount: 1000,
        taxRate: 18,
      },
      {
        product: { id: 'p2', name: 'Dining Chair', sku: 'CHR-001', sellingPrice: 2500 },
        quantity: 4,
        discountAmount: 0,
        taxRate: 18,
      },
    ];

    const totals = calculateSaleTotals({
      rawItems,
      overallDiscountAmount: 500,
      overallTaxRate: 0,
    });

    // Item 1: (2 * 10000) = 20000 - 1000 = 19000 taxable. Tax @ 18% = 3420. Line total = 22420.
    // Item 2: (4 * 2500) = 10000 - 0 = 10000 taxable. Tax @ 18% = 1800. Line total = 11800.
    // Subtotal: 30000
    // Item Discounts: 1000, Overall Discount: 500 => Total Discount: 1500
    // Item Taxes: 3420 + 1800 = 5220
    // Grand Total: 30000 - 1500 + 5220 = 33720

    expect(totals.subtotal).toBe(30000);
    expect(totals.discountAmount).toBe(1500);
    expect(totals.taxAmount).toBe(5220);
    expect(totals.totalAmount).toBe(33720);
    expect(totals.dueAmount).toBe(33720);
    expect(totals.items.length).toBe(2);
  });

  it('should handle zero discount and zero tax without floating point precision issues', () => {
    const rawItems = [
      {
        product: { id: 'p1', name: 'Wooden Stool', sku: 'STL-001', sellingPrice: 99.99 },
        quantity: 3,
        discountAmount: 0,
        taxRate: 0,
      },
    ];

    const totals = calculateSaleTotals({
      rawItems,
    });

    expect(totals.subtotal).toBe(299.97);
    expect(totals.discountAmount).toBe(0);
    expect(totals.taxAmount).toBe(0);
    expect(totals.totalAmount).toBe(299.97);
  });
});
