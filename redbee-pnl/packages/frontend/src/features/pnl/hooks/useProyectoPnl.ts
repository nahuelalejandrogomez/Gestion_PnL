import { useQuery } from '@tanstack/react-query';
import { pnlApi } from '../api/pnlApi';

export const PNL_QUERY_KEY = 'pnl';

export function useProyectoPnl(proyectoId: string | undefined, anio?: number, mes?: number) {
  return useQuery({
    queryKey: [PNL_QUERY_KEY, proyectoId, anio, mes],
    queryFn: () => pnlApi.getByProyecto(proyectoId!, anio, mes),
    enabled: !!proyectoId,
  });
}
