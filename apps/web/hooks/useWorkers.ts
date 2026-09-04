import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { workerService } from '../services/workerService';
import { queryKeys } from '../lib/queryKeys';

export function useWorkers(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: queryKeys.workers.list(undefined, params),
    queryFn: () => workerService.listWorkers(params),
    placeholderData: keepPreviousData,
  });
}

export function useWorker(id: string) {
  return useQuery({
    queryKey: queryKeys.workers.detail(undefined, id),
    queryFn: () => workerService.getWorker(id),
    enabled: Boolean(id),
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ['workers', 'departments'],
    queryFn: () => workerService.getDepartments(),
  });
}

export function useCreateWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => workerService.createWorker(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workers.all(undefined) });
    },
  });
}

export function useUpdateWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => workerService.updateWorker(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workers.all(undefined) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workers.detail(undefined, variables.id) });
    },
  });
}
