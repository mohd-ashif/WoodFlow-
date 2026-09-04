import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { financeService } from '../services/financeService';
import { queryKeys } from '../lib/queryKeys';

export function usePaymentAccounts() {
  return useQuery({
    queryKey: queryKeys.finance.accounts(undefined),
    queryFn: () => financeService.getAccounts(),
  });
}

export function useAccountTransactions(accountId: string, params: Record<string, any> = {}) {
  return useQuery({
    queryKey: ['finance', 'account-transactions', accountId, params],
    queryFn: () => financeService.getAccountTransactions(accountId, params),
    enabled: Boolean(accountId),
    placeholderData: keepPreviousData,
  });
}

export function useRecordCustomerPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => financeService.recordCustomerPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.accounts(undefined) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all(undefined) });
    },
  });
}

export function useRecordSupplierPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => financeService.recordSupplierPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.accounts(undefined) });
      queryClient.invalidateQueries({ queryKey: queryKeys.purchases.all(undefined) });
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => financeService.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.accounts(undefined) });
    },
  });
}

export function useRecordTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => financeService.recordTransfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.accounts(undefined) });
    },
  });
}
