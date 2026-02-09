import { useQuery } from '@tanstack/react-query';
import { proyectosApi } from '../api/proyectosApi';
import { PROYECTOS_QUERY_KEY } from './useProyectos';

export function useProyecto(id: string | undefined) {
  return useQuery({
    queryKey: [PROYECTOS_QUERY_KEY, id],
    queryFn: () => proyectosApi.getById(id!),
    enabled: !!id,
  });
}
