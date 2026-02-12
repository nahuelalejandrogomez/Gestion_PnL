import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { asignacionesApi } from '../api/asignacionesApi';
import { ASIGNACIONES_QUERY_KEY } from './useAsignaciones';
import { PROYECTOS_QUERY_KEY } from '@/features/proyectos/hooks/useProyectos';
import { PNL_QUERY_KEY } from '@/features/pnl';
import type { UpsertMesBatchDto, UpsertCostosManualesDto } from '../types/asignacion.types';

export const PLANNER_QUERY_KEY = 'planner';
export const COSTOS_MANUALES_QUERY_KEY = 'costos-manuales';

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
    onError: (error: Error & { response?: { data?: { message?: string | string[] } } }) => {
      // Log full error details for debugging
      console.error('[Planner Save Error]', error.response?.data || error.message);
      
      // Show user-friendly message
      const rawMessage = error.response?.data?.message;
      let userMessage = 'Error al guardar. Revisá la consola para más detalles.';
      
      if (Array.isArray(rawMessage)) {
        // Validation errors come as array - show generic message
        userMessage = 'No se pudo guardar: hay datos inválidos en la grilla. Revisá los valores ingresados.';
      } else if (typeof rawMessage === 'string') {
        userMessage = rawMessage;
      }
      
      toast.error(userMessage);
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
      asignacionesApi.getRecursos({ search: debouncedSearch || undefined, estado: 'ACTIVO', limit: 50 }),
    // Always enabled - show all recursos by default, filter when searching
    enabled: true,
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

// =====================
// SALARY OVERRIDES
// =====================

export const RECURSOS_COSTOS_QUERY_KEY = 'recursos-costos';

/**
 * Get salary overrides for all recursos of a proyecto in a given year
 */
export function useRecursosCostos(proyectoId: string, year: number) {
  return useQuery({
    queryKey: [RECURSOS_COSTOS_QUERY_KEY, proyectoId, year],
    queryFn: () => asignacionesApi.getRecursosCostos(proyectoId, year),
    enabled: !!proyectoId,
  });
}

/**
 * Mutation to upsert a salary override for a recurso
 */
export function useUpsertRecursoCosto(proyectoId: string, year: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recursoId, month, costoMensual }: { recursoId: string; month: number; costoMensual: number }) =>
      asignacionesApi.upsertRecursoCosto(recursoId, year, [{ month, costoMensual }]),
    onSuccess: () => {
      // Invalidate recursos costos and planner to recalculate costs
      queryClient.invalidateQueries({ queryKey: [RECURSOS_COSTOS_QUERY_KEY, proyectoId, year] });
      queryClient.invalidateQueries({ queryKey: [PLANNER_QUERY_KEY, proyectoId, year] });
      toast.success('Sueldo actualizado');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      console.error('[Salary Override Error]', error);
      toast.error(error.response?.data?.message || 'Error al actualizar sueldo');
    },
  });
}

/**
 * Mutation to delete a salary override
 */
export function useDeleteRecursoCosto(proyectoId: string, year: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recursoId, month }: { recursoId: string; month: number }) =>
      asignacionesApi.deleteRecursoCosto(recursoId, year, month),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECURSOS_COSTOS_QUERY_KEY, proyectoId, year] });
      queryClient.invalidateQueries({ queryKey: [PLANNER_QUERY_KEY, proyectoId, year] });
      toast.success('Override eliminado - usando sueldo base');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      console.error('[Delete Salary Override Error]', error);
      toast.error(error.response?.data?.message || 'Error al eliminar override');
    },
  });
}

// =====================
// COSTOS MANUALES
// =====================

export function useCostosManuales(proyectoId: string, year: number) {
  return useQuery({
    queryKey: [COSTOS_MANUALES_QUERY_KEY, proyectoId, year],
    queryFn: () => asignacionesApi.getCostosManuales(proyectoId, year),
    enabled: !!proyectoId,
  });
}

export function useSaveCostosManuales(proyectoId: string, year: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpsertCostosManualesDto) =>
      asignacionesApi.saveCostosManuales(proyectoId, year, dto),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [COSTOS_MANUALES_QUERY_KEY, proyectoId, year] });
      queryClient.invalidateQueries({ queryKey: [PNL_QUERY_KEY, proyectoId] });
      toast.success(`${result.updated} meses de costos manuales guardados`);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Error al guardar costos manuales');
    },
  });
}
