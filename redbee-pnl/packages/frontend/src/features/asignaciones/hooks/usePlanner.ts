import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { asignacionesApi } from '../api/asignacionesApi';
import { ASIGNACIONES_QUERY_KEY } from './useAsignaciones';
import { PROYECTOS_QUERY_KEY } from '@/features/proyectos/hooks/useProyectos';
import { PNL_QUERY_KEY } from '@/features/pnl';
import type { UpsertMesBatchDto } from '../types/asignacion.types';

export const PLANNER_QUERY_KEY = 'planner';

export function usePlannerData(proyectoId: string, year: number) {
  return useQuery({
    queryKey: [PLANNER_QUERY_KEY, proyectoId, year],
    queryFn: () => asignacionesApi.getPlannerData(proyectoId, year),
    enabled: !!proyectoId,
  });
}

export function usePlannerSave(proyectoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpsertMesBatchDto) =>
      asignacionesApi.savePlannerBatch(proyectoId, dto),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [PLANNER_QUERY_KEY, proyectoId] });
      queryClient.invalidateQueries({ queryKey: [PNL_QUERY_KEY, proyectoId] });
      queryClient.invalidateQueries({ queryKey: [ASIGNACIONES_QUERY_KEY] });
      toast.success(`${result.updated} celdas guardadas`);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Error al guardar planner');
    },
  });
}

export function useRecursoSearch(search: string) {
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  return useQuery({
    queryKey: ['recursos-search', debouncedSearch],
    queryFn: () =>
      asignacionesApi.getRecursos({ search: debouncedSearch, estado: 'ACTIVO', limit: 20 }),
    enabled: debouncedSearch.length >= 2,
  });
}

export function usePlannerDeleteAsignacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => asignacionesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PLANNER_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [ASIGNACIONES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [PROYECTOS_QUERY_KEY] });
      toast.success('Recurso removido del proyecto');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Error al eliminar asignación');
    },
  });
}
