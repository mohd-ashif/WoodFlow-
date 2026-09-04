import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { inventoryService } from '../services/inventoryService';
import { queryKeys } from '../lib/queryKeys';
import { fetchApi } from '../lib/api';

export function useInventoryDashboard() {
  return useQuery({
    queryKey: queryKeys.inventory.all(undefined),
    queryFn: () => inventoryService.getDashboardStats(),
  });
}

export function useLowStock(page = 1, limit = 20) {
  return useQuery({
    queryKey: queryKeys.inventory.lowStock(undefined),
    queryFn: () => inventoryService.getLowStock(page, limit),
    placeholderData: keepPreviousData,
  });
}

export function useOutOfStock(page = 1, limit = 20) {
  return useQuery({
    queryKey: queryKeys.inventory.outOfStock(undefined),
    queryFn: () => inventoryService.getOutOfStock(page, limit),
    placeholderData: keepPreviousData,
  });
}

export function useStockMovements(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: queryKeys.inventory.movements(undefined, filters),
    queryFn: () => inventoryService.getStockMovements(filters),
    placeholderData: keepPreviousData,
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => inventoryService.adjustStock(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all(undefined) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all(undefined) });
    },
  });
}

export function useReconcileInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => fetchApi('/inventory/reconcile', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all(undefined) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all(undefined) });
    },
  });
}
