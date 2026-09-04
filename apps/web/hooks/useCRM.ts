import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { crmService } from '../services/crmService';
import { queryKeys } from '../lib/queryKeys';

export function useCustomers(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: queryKeys.crm.customers(undefined, params),
    queryFn: () => crmService.getCustomers(params),
    placeholderData: keepPreviousData,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: queryKeys.crm.customerDetail(undefined, id),
    queryFn: () => crmService.getCustomerById(id),
    enabled: Boolean(id),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => crmService.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crm.customers(undefined) });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => crmService.updateCustomer(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crm.customers(undefined) });
      queryClient.invalidateQueries({ queryKey: queryKeys.crm.customerDetail(undefined, variables.id) });
    },
  });
}

export function useSuppliers(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: queryKeys.crm.suppliers(undefined, params),
    queryFn: () => crmService.getSuppliers(params),
    placeholderData: keepPreviousData,
  });
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: queryKeys.crm.supplierDetail(undefined, id),
    queryFn: () => crmService.getSupplierById(id),
    enabled: Boolean(id),
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => crmService.createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crm.suppliers(undefined) });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => crmService.updateSupplier(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crm.suppliers(undefined) });
      queryClient.invalidateQueries({ queryKey: queryKeys.crm.supplierDetail(undefined, variables.id) });
    },
  });
}
