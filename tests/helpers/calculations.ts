/**
 * Independent Mathematical Calculation Helpers for FurnitureOS QA Assertions.
 * These functions calculate expected business values independently of the API implementation.
 */

/**
 * Calculates expected Weighted Average Cost (WAC) price after receiving new inventory stock.
 * Formula: ((ExistingStock * ExistingCost) + (ReceivedQty * ReceivedCost)) / (ExistingStock + ReceivedQty)
 */
export function calculateExpectedWeightedAverageCost(
  existingQty: number,
  existingCost: number,
  receivedQty: number,
  receivedCost: number
): number {
  const totalQty = existingQty + receivedQty;
  if (totalQty <= 0) return 0;
  const totalValue = existingQty * existingCost + receivedQty * receivedCost;
  return Number((totalValue / totalQty).toFixed(2));
}

/**
 * Calculates expected available stock.
 * Formula: AvailableQty = Quantity - ReservedQty
 */
export function calculateExpectedAvailableStock(quantity: number, reservedQty: number): number {
  return Math.max(0, quantity - reservedQty);
}

/**
 * Calculates expected financial account liquid balance.
 * Formula: CurrentBalance = OpeningBalance + Incomes + TransfersIn - Expenses - TransfersOut
 */
export function calculateExpectedAccountBalance(params: {
  openingBalance: number;
  incomes?: number[];
  transfersIn?: number[];
  expenses?: number[];
  transfersOut?: number[];
}): number {
  const totalIncomes = (params.incomes || []).reduce((acc, val) => acc + val, 0);
  const totalTransfersIn = (params.transfersIn || []).reduce((acc, val) => acc + val, 0);
  const totalExpenses = (params.expenses || []).reduce((acc, val) => acc + val, 0);
  const totalTransfersOut = (params.transfersOut || []).reduce((acc, val) => acc + val, 0);

  const balance = params.openingBalance + totalIncomes + totalTransfersIn - totalExpenses - totalTransfersOut;
  return Number(balance.toFixed(2));
}

/**
 * Calculates expected line item total and order totals.
 */
export function calculateExpectedOrderTotals(items: Array<{ quantity: number; unitPrice: number; discountAmount?: number; taxRate?: number }>, overallDiscount: number = 0, overallTaxRate: number = 0) {
  let subtotal = 0;
  let totalItemTax = 0;

  items.forEach((item) => {
    const itemSub = item.quantity * item.unitPrice - (item.discountAmount || 0);
    const itemTax = (itemSub * (item.taxRate || 0)) / 100;
    subtotal += itemSub;
    totalItemTax += itemTax;
  });

  const netSubtotal = Math.max(0, subtotal - overallDiscount);
  const overallTaxAmount = (netSubtotal * overallTaxRate) / 100;
  const grandTotal = netSubtotal + totalItemTax + overallTaxAmount;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    taxAmount: Number((totalItemTax + overallTaxAmount).toFixed(2)),
    grandTotal: Number(grandTotal.toFixed(2)),
  };
}
