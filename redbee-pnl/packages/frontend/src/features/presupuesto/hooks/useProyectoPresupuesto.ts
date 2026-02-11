import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { presupuestoApi } from '../api/presupuestoApi';
import type { UpdatePresupuestoDto } from '../types/presupuesto.types';
import type { AplicarClientePresupuestoDto } from '../types/cliente-presupuesto.types';
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

export function useClientePresupuestos(clienteId: string | undefined, year?: number) {
  return useQuery({
    queryKey: [PRESUPUESTO_QUERY_KEY, 'cliente', clienteId, year],
    queryFn: () => presupuestoApi.getClientePresupuestos(clienteId!, year),
    enabled: !!clienteId,
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

export function useAplicarClientePresupuesto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      proyectoId,
      year,
      dto,
    }: {
      proyectoId: string;
      year: number;
      dto: AplicarClientePresupuestoDto;
    }) => presupuestoApi.aplicarClientePresupuesto(proyectoId, year, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [PRESUPUESTO_QUERY_KEY, 'proyecto', variables.proyectoId, variables.year],
      });
      // Get current month name for toast
      const currentMonth = new Date().getMonth();
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const fromMonthName = monthNames[currentMonth];
      toast.success(`Presupuesto aplicado desde ${fromMonthName} hasta Dic`);
    },
    onError: (error: Error) => {
      toast.error(`Error al aplicar presupuesto: ${error.message}`);
    },
  });
}
