import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fxApi } from '../api/fxApi';
import type { FxRateItemInput } from '../api/fxApi';
import { toast } from 'sonner';

export const FX_QUERY_KEY = 'fx-rates';

/**
 * Hook to get FX rates for a year
 */
export function useFxRates(year: number) {
  return useQuery({
    queryKey: [FX_QUERY_KEY, year],
    queryFn: () => fxApi.getByYear(year),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to upsert FX rates
 */
export function useUpsertFxRates(year: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: FxRateItemInput[]) => fxApi.upsertRates(year, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FX_QUERY_KEY, year] });
      // Also invalidate planner queries to recalculate costs
      queryClient.invalidateQueries({ queryKey: ['planner'] });
      toast.success('Tipos de cambio guardados');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      console.error('[FX Save Error]', error);
      toast.error(error.response?.data?.message || 'Error al guardar tipos de cambio');
    },
  });
}

/**
 * Helper to build a map of month -> effective FX rate
 */
export function buildFxMap(rates: { month: number; effective: number | null }[]): Record<number, number | null> {
  const map: Record<number, number | null> = {};
  for (const r of rates) {
    map[r.month] = r.effective;
  }
  return map;
}
