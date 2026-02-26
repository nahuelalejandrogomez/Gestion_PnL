import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { potencialesApi } from '../api/potencialesApi';
import type {
  CreateClientePotencialDto,
  UpdateClientePotencialDto,
  UpsertLineaDto,
  CambiarEstadoDto,
} from '../types/potencial.types';

const queryKey = (clienteId: string) => ['potenciales', clienteId];

export function usePotenciales(clienteId: string | undefined) {
  return useQuery({
    queryKey: queryKey(clienteId ?? ''),
    queryFn: () => potencialesApi.getAll(clienteId!),
    enabled: !!clienteId,
    staleTime: 2 * 60 * 1000,
  });
}

export function usePotencialMutations(clienteId: string) {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: queryKey(clienteId) });
    // Invalida el P&L del cliente porque el bloque potencial cambia
    qc.invalidateQueries({ queryKey: ['pnl-cliente', clienteId] });
    qc.invalidateQueries({ queryKey: ['rolling-data'] });
  };

  const create = useMutation({
    mutationFn: (dto: CreateClientePotencialDto) => potencialesApi.create(clienteId, dto),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateClientePotencialDto }) =>
      potencialesApi.update(clienteId, id, dto),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => potencialesApi.remove(clienteId, id),
    onSuccess: invalidate,
  });

  const upsertLineas = useMutation({
    mutationFn: ({ potencialId, lineas }: { potencialId: string; lineas: UpsertLineaDto[] }) =>
      potencialesApi.upsertLineas(clienteId, potencialId, lineas),
    onSuccess: invalidate,
  });

  const cambiarEstado = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CambiarEstadoDto }) =>
      potencialesApi.cambiarEstado(clienteId, id, dto),
    onSuccess: invalidate,
  });

  return { create, update, remove, upsertLineas, cambiarEstado };
}
