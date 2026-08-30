import { z } from 'zod';

export const PaymentAccountTypeEnum = z.enum(['CASH', 'BANK', 'UPI', 'CREDIT_CARD']);
export type PaymentAccountType = z.infer<typeof PaymentAccountTypeEnum>;

export const FinancialTransactionTypeEnum = z.enum([
  'OPENING_BALANCE',
  'CUSTOMER_PAYMENT',
  'SUPPLIER_PAYMENT',
  'EXPENSE',
  'ACCOUNT_TRANSFER_IN',
  'ACCOUNT_TRANSFER_OUT',
  'REFUND',
  'OTHER_INCOME',
]);
export type FinancialTransactionType = z.infer<typeof FinancialTransactionTypeEnum>;

export const TransactionDirectionEnum = z.enum(['CREDIT', 'DEBIT']);
export type TransactionDirection = z.infer<typeof TransactionDirectionEnum>;

export const PaymentMethodEnum = z.enum(['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'OTHER']);
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

export const ExpenseStatusEnum = z.enum(['PAID', 'VOID']);
export type ExpenseStatus = z.infer<typeof ExpenseStatusEnum>;

// Account Schemas
export const createPaymentAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  type: PaymentAccountTypeEnum.default('CASH'),
  accountNumber: z.string().optional(),
  openingBalance: z.number().min(0).default(0),
});
export type CreatePaymentAccountInput = z.infer<typeof createPaymentAccountSchema>;

export const updatePaymentAccountSchema = z.object({
  name: z.string().min(1).optional(),
  type: PaymentAccountTypeEnum.optional(),
  accountNumber: z.string().optional(),
  isActive: z.boolean().optional(),
});
export type UpdatePaymentAccountInput = z.infer<typeof updatePaymentAccountSchema>;

// Customer Payment Schema
export const recordCustomerPaymentSchema = z.object({
  saleId: z.string().optional(),
  customerId: z.string().optional(),
  paymentAccountId: z.string().min(1, 'Payment account is required'),
  amount: z.number().positive('Payment amount must be greater than 0'),
  paymentMethod: PaymentMethodEnum.default('CASH'),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  paymentDate: z.string().optional(),
});
export type RecordCustomerPaymentInput = z.infer<typeof recordCustomerPaymentSchema>;

// Supplier Payment Schema
export const recordSupplierPaymentSchema = z.object({
  purchaseId: z.string().optional(),
  supplierId: z.string().optional(),
  paymentAccountId: z.string().min(1, 'Payment account is required'),
  amount: z.number().positive('Payment amount must be greater than 0'),
  paymentMethod: PaymentMethodEnum.default('CASH'),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  paymentDate: z.string().optional(),
});
export type RecordSupplierPaymentInput = z.infer<typeof recordSupplierPaymentSchema>;

// Expense Category Schema
export const createExpenseCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
});
export type CreateExpenseCategoryInput = z.infer<typeof createExpenseCategorySchema>;

// Expense Schema
export const createExpenseSchema = z.object({
  categoryId: z.string().optional(),
  paymentAccountId: z.string().min(1, 'Payment account is required'),
  title: z.string().min(1, 'Expense title is required'),
  description: z.string().optional(),
  amount: z.number().positive('Expense amount must be greater than 0'),
  expenseDate: z.string().optional(),
  paymentMethod: PaymentMethodEnum.default('CASH'),
  referenceNumber: z.string().optional(),
  receiptUrl: z.string().optional(),
});
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

// Account Transfer Schema
export const recordAccountTransferSchema = z.object({
  fromAccountId: z.string().min(1, 'Source account is required'),
  toAccountId: z.string().min(1, 'Destination account is required'),
  amount: z.number().positive('Transfer amount must be greater than 0'),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  transferDate: z.string().optional(),
}).refine((data) => data.fromAccountId !== data.toAccountId, {
  message: 'Source and destination accounts must be different',
  path: ['toAccountId'],
});
export type RecordAccountTransferInput = z.infer<typeof recordAccountTransferSchema>;
