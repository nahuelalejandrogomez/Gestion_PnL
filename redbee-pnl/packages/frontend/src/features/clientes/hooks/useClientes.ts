import { useQuery } from '@tanstack/react-query';
import { clientesApi } from '../api/clientesApi';
import type { QueryClienteParams } from '../types/cliente.types';

export const CLIENTES_QUERY_KEY = 'clientes';

export function useClientes(params?: QueryClienteParams) {
  return useQuery({
    queryKey: [CLIENTES_QUERY_KEY, params],
    queryFn: () => clientesApi.getAll(params),
    placeholderData: (previousData) => previousData,
  });
}
