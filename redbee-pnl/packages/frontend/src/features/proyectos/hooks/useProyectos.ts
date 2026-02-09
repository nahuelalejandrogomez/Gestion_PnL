import { useQuery } from '@tanstack/react-query';
import { proyectosApi } from '../api/proyectosApi';
import type { QueryProyectoParams } from '../types/proyecto.types';

export const PROYECTOS_QUERY_KEY = 'proyectos';

export function useProyectos(params?: QueryProyectoParams) {
  return useQuery({
    queryKey: [PROYECTOS_QUERY_KEY, params],
    queryFn: () => proyectosApi.getAll(params),
    placeholderData: (previousData) => previousData,
  });
}
