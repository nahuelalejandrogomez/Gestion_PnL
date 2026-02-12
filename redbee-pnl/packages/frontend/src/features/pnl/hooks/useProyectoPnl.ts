import { useQuery } from '@tanstack/react-query';
import { pnlApi } from '../api/pnlApi';

export const PNL_QUERY_KEY = 'pnl';

export function useProyectoPnlYear(
  proyectoId: string | undefined,
  year: number,
) {
  return useQuery({
    queryKey: [PNL_QUERY_KEY, proyectoId, year],
    queryFn: () => pnlApi.getByProyectoYear(proyectoId!, year),
    enabled: !!proyectoId,
  });
}
