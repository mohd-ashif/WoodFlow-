import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { workOrderService } from '../services/workOrderService';
import { queryKeys } from '../lib/queryKeys';

export function useWorkOrders(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: queryKeys.workers.workOrders(undefined, params),
    queryFn: () => workOrderService.listWorkOrders(params),
    placeholderData: keepPreviousData,
  });
}

export function useWorkOrder(id: string) {
  return useQuery({
    queryKey: ['work-orders', 'detail', id],
    queryFn: () => workOrderService.getWorkOrder(id),
    enabled: Boolean(id),
  });
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => workOrderService.createWorkOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workers.all(undefined) });
    },
  });
}

export function useUpdateWorkOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      workOrderService.updateWorkOrderStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workers.all(undefined) });
      queryClient.invalidateQueries({ queryKey: ['work-orders', 'detail', variables.id] });
    },
  });
}
