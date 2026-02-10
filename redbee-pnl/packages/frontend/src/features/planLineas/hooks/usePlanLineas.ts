import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planLineasApi } from '../api/planLineasApi';
import type { UpsertPlanLineasDto } from '../types/planLinea.types';
import { toast } from 'sonner';

export const PLAN_LINEAS_QUERY_KEY = 'plan-lineas';

export function usePlanLineas(proyectoId: string, year: number) {
  return useQuery({
    queryKey: [PLAN_LINEAS_QUERY_KEY, proyectoId, year],
    queryFn: () => planLineasApi.getPlanLineas(proyectoId, year),
    enabled: !!proyectoId && !!year,
  });
}

export function usePlanLineasMutations(proyectoId: string) {
  const queryClient = useQueryClient();

  const upsertPlanLineas = useMutation({
    mutationFn: (dto: UpsertPlanLineasDto) => planLineasApi.upsertPlanLineas(proyectoId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PLAN_LINEAS_QUERY_KEY, proyectoId] });
      toast.success('Plan guardado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al guardar plan: ${error.message}`);
    },
  });

  return {
    upsertPlanLineas,
  };
}
