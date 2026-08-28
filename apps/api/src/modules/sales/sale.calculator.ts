export interface CalculatedItem {
  productId: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

export interface CalculatedSaleTotals {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  items: CalculatedItem[];
}

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateSaleTotals(params: {
  rawItems: Array<{
    product: { id: string; name: string; sku: string; sellingPrice: number };
    quantity: number;
    overrideUnitPrice?: number;
    discountAmount?: number;
    taxRate?: number;
  }>;
  overallDiscountAmount?: number;
  overallTaxRate?: number;
  paidAmount?: number;
}): CalculatedSaleTotals {
  let subtotal = 0;
  let itemsDiscountTotal = 0;
  let itemsTaxTotal = 0;

  const calculatedItems: CalculatedItem[] = params.rawItems.map((item) => {
    const qty = Math.max(0, item.quantity);
    const unitPrice = roundCurrency(
      item.overrideUnitPrice !== undefined && item.overrideUnitPrice !== null
        ? item.overrideUnitPrice
        : item.product.sellingPrice
    );
    const lineSubtotal = roundCurrency(qty * unitPrice);
    const lineDiscount = roundCurrency(Math.min(lineSubtotal, item.discountAmount || 0));
    const taxableLine = Math.max(0, lineSubtotal - lineDiscount);

    const taxRate = Math.max(0, item.taxRate || 0);
    const lineTax = roundCurrency((taxableLine * taxRate) / 100);
    const lineTotal = roundCurrency(taxableLine + lineTax);

    subtotal = roundCurrency(subtotal + lineSubtotal);
    itemsDiscountTotal = roundCurrency(itemsDiscountTotal + lineDiscount);
    itemsTaxTotal = roundCurrency(itemsTaxTotal + lineTax);

    return {
      productId: item.product.id,
      productNameSnapshot: item.product.name,
      skuSnapshot: item.product.sku,
      quantity: qty,
      unitPrice,
      discountAmount: lineDiscount,
      taxRate,
      taxAmount: lineTax,
      totalAmount: lineTotal,
    };
  });

  const overallDiscount = roundCurrency(params.overallDiscountAmount || 0);
  const totalDiscount = roundCurrency(itemsDiscountTotal + overallDiscount);
  const taxableSubtotal = Math.max(0, subtotal - totalDiscount);

  const overallTaxRate = Math.max(0, params.overallTaxRate || 0);
  const overallTax = roundCurrency((taxableSubtotal * overallTaxRate) / 100);
  const totalTax = roundCurrency(itemsTaxTotal + overallTax);

  const grandTotal = roundCurrency(Math.max(0, subtotal - totalDiscount + totalTax));
  const paid = roundCurrency(Math.max(0, params.paidAmount || 0));
  const due = roundCurrency(Math.max(0, grandTotal - paid));

  return {
    subtotal,
    discountAmount: totalDiscount,
    taxAmount: totalTax,
    totalAmount: grandTotal,
    paidAmount: paid,
    dueAmount: due,
    items: calculatedItems,
  };
}
