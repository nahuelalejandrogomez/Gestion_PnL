import { useQuery } from '@tanstack/react-query';
import { revenueApi } from '../api/revenueApi';
import { fxApi } from '@/features/config/api/fxApi';

export const REVENUE_QUERY_KEY = 'revenue';

export function useClienteRevenue(clienteId: string, year: number) {
  return useQuery({
    queryKey: [REVENUE_QUERY_KEY, 'cliente', clienteId, year],
    queryFn: () => revenueApi.getClienteRevenue(clienteId, year),
    enabled: !!clienteId && !!year,
  });
}

export function useFxRates(year: number) {
  return useQuery({
    queryKey: ['fx', 'rates', year],
    queryFn: () => fxApi.getByYear(year),
    enabled: !!year,
  });
}
