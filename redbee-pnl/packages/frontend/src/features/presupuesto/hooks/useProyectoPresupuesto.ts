import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { presupuestoApi } from '../api/presupuestoApi';
import type { UpdatePresupuestoDto } from '../types/presupuesto.types';
import { toast } from 'sonner';

export const PRESUPUESTO_QUERY_KEY = 'presupuesto';

export function useProyectoPresupuesto(proyectoId: string, year: number) {
  return useQuery({
    queryKey: [PRESUPUESTO_QUERY_KEY, 'proyecto', proyectoId, year],
    queryFn: () => presupuestoApi.getPresupuesto(proyectoId, year),
    enabled: !!proyectoId && !!year,
  });
}

export function useUpdatePresupuesto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      proyectoId,
      year,
      dto,
    }: {
      proyectoId: string;
      year: number;
      dto: UpdatePresupuestoDto;
    }) => presupuestoApi.updatePresupuesto(proyectoId, year, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [PRESUPUESTO_QUERY_KEY, 'proyecto', variables.proyectoId, variables.year],
      });
      toast.success('Presupuesto actualizado');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar presupuesto: ${error.message}`);
    },
  });
}
