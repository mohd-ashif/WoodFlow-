import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

export function useInvoices(params: Record<string, any> = {}) {
  const queryString = new URLSearchParams(params as any).toString();
  const endpoint = `/invoices${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: queryKeys.sales.invoices(undefined, params),
    queryFn: () => fetchApi<any>(endpoint),
    placeholderData: keepPreviousData,
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoices', 'detail', id],
    queryFn: () => fetchApi<any>(`/invoices/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (saleId: string) => fetchApi<any>(`/invoices`, { method: 'POST', body: JSON.stringify({ saleId }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all(undefined) });
    },
  });
}
