import { useQuery } from '@tanstack/react-query';
import { asignacionesApi } from '../api/asignacionesApi';

export const ASIGNACIONES_QUERY_KEY = 'asignaciones';
export const RECURSOS_QUERY_KEY = 'recursos';
export const PERFILES_QUERY_KEY = 'perfiles';

export function useAsignaciones(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [ASIGNACIONES_QUERY_KEY, params],
    queryFn: () => asignacionesApi.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useRecursos(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [RECURSOS_QUERY_KEY, params],
    queryFn: () => asignacionesApi.getRecursos(params),
  });
}

export function usePerfiles() {
  return useQuery({
    queryKey: [PERFILES_QUERY_KEY],
    queryFn: () => asignacionesApi.getPerfiles(),
  });
}
