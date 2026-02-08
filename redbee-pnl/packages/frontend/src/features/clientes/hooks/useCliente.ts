import { useQuery } from '@tanstack/react-query';
import { clientesApi } from '../api/clientesApi';
import { CLIENTES_QUERY_KEY } from './useClientes';

export function useCliente(id: string | undefined) {
  return useQuery({
    queryKey: [CLIENTES_QUERY_KEY, id],
    queryFn: () => clientesApi.getById(id!),
    enabled: !!id,
  });
}
