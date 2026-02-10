import { useQuery } from '@tanstack/react-query';
import { getContratosByCliente } from '../api/contratosApi';

export const CONTRATOS_QUERY_KEY = 'contratos';

export function useClienteContratos(clienteId: string | undefined) {
  return useQuery({
    queryKey: [CONTRATOS_QUERY_KEY, 'cliente', clienteId],
    queryFn: () => getContratosByCliente(clienteId!),
    enabled: !!clienteId,
  });
}
