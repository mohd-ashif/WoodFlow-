import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { salesService } from '../services/salesService';
import { queryKeys } from '../lib/queryKeys';

export function useSales(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: queryKeys.sales.list(undefined, params),
    queryFn: () => salesService.getSales(params),
    placeholderData: keepPreviousData,
  });
}

export function useSale(id: string) {
  return useQuery({
    queryKey: queryKeys.sales.detail(undefined, id),
    queryFn: () => salesService.getSaleById(id),
    enabled: Boolean(id),
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => salesService.createSale(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all(undefined) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all(undefined) });
    },
  });
}

export function useCancelSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => salesService.cancelSale(id, reason || ''),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all(undefined) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.detail(undefined, variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all(undefined) });
    },
  });
}
