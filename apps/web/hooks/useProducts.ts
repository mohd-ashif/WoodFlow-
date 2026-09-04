import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { inventoryService } from '../services/inventoryService';
import { queryKeys } from '../lib/queryKeys';

export function useProducts(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: queryKeys.products.list(undefined, filters),
    queryFn: () => inventoryService.getProducts(filters),
    placeholderData: keepPreviousData,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(undefined, id),
    queryFn: () => inventoryService.getProductById(id),
    enabled: Boolean(id),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.products.categories(undefined),
    queryFn: () => inventoryService.getCategories({ isActive: true }),
  });
}

export function useUnits() {
  return useQuery({
    queryKey: queryKeys.products.units(undefined),
    queryFn: () => inventoryService.getUnits(),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => inventoryService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all(undefined) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all(undefined) });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => inventoryService.updateProduct(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all(undefined) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(undefined, variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all(undefined) });
    },
  });
}

export function useDeactivateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryService.deactivateProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all(undefined) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all(undefined) });
    },
  });
}

export function useActivateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryService.activateProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all(undefined) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all(undefined) });
    },
  });
}
