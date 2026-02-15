import { useQuery } from '@tanstack/react-query';
import { pnlApi } from '../api/pnlApi';

export const PNL_QUERY_KEY = 'pnl';

export function useProyectoPnlYear(
  proyectoId: string | undefined,
  year: number,
) {
  return useQuery({
    queryKey: [PNL_QUERY_KEY, 'proyecto', proyectoId, year],
    queryFn: () => pnlApi.getByProyectoYear(proyectoId!, year),
    enabled: !!proyectoId,
  });
}

export function useClientePnlYear(
  clienteId: string | undefined,
  year: number,
) {
  return useQuery({
    queryKey: [PNL_QUERY_KEY, 'cliente', clienteId, year],
    queryFn: () => pnlApi.getByClienteYear(clienteId!, year),
    enabled: !!clienteId,
  });
}
