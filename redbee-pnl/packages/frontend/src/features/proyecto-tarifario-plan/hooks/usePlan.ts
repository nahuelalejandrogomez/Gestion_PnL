import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planApi } from '../api/planApi';
import type { UpdatePlanDto, AplicarTarifarioDto } from '../types/plan.types';
import { toast } from 'sonner';

export const PLAN_QUERY_KEY = 'proyectoTarifarioPlan';

export function usePlan(proyectoId: string, year: number) {
  return useQuery({
    queryKey: [PLAN_QUERY_KEY, proyectoId, year],
    queryFn: () => planApi.getPlan(proyectoId, year),
    enabled: !!proyectoId && !!year,
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      proyectoId,
      year,
      dto,
    }: {
      proyectoId: string;
      year: number;
      dto: UpdatePlanDto;
    }) => planApi.updatePlan(proyectoId, year, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [PLAN_QUERY_KEY, variables.proyectoId, variables.year],
      });
      toast.success('Plan guardado correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al guardar plan: ${error.message}`);
    },
  });
}

export function useAplicarTarifario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      proyectoId,
      year,
      dto,
    }: {
      proyectoId: string;
      year: number;
      dto: AplicarTarifarioDto;
    }) => planApi.aplicarTarifario(proyectoId, year, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [PLAN_QUERY_KEY, variables.proyectoId, variables.year],
      });
      const currentMonth = new Date().getMonth();
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      toast.success(`Tarifario aplicado desde ${monthNames[currentMonth]} hasta Dic`);
    },
    onError: (error: Error) => {
      toast.error(`Error al aplicar tarifario: ${error.message}`);
    },
  });
}
