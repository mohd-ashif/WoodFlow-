import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { purchasesService } from '../services/purchasesService';
import { queryKeys } from '../lib/queryKeys';

export function usePurchases(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: queryKeys.purchases.list(undefined, params),
    queryFn: () => purchasesService.getPurchases(params),
    placeholderData: keepPreviousData,
  });
}

export function usePurchase(id: string) {
  return useQuery({
    queryKey: queryKeys.purchases.detail(undefined, id),
    queryFn: () => purchasesService.getPurchaseById(id),
    enabled: Boolean(id),
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => purchasesService.createPurchase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purchases.all(undefined) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all(undefined) });
    },
  });
}

export function useConfirmPurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchasesService.confirmPurchase(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purchases.all(undefined) });
      queryClient.invalidateQueries({ queryKey: queryKeys.purchases.detail(undefined, id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all(undefined) });
    },
  });
}

export function useCancelPurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => purchasesService.cancelPurchase(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purchases.all(undefined) });
      queryClient.invalidateQueries({ queryKey: queryKeys.purchases.detail(undefined, variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all(undefined) });
    },
  });
}
