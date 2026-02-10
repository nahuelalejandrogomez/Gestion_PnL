import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createContrato, updateContrato, deleteContrato } from '../api/contratosApi';
import type { CreateContratoDto, UpdateContratoDto } from '../types/contrato.types';
import { CONTRATOS_QUERY_KEY } from './useClienteContratos';
import { toast } from 'sonner';

export function useCreateContrato(clienteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateContratoDto) => createContrato(clienteId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTRATOS_QUERY_KEY, 'cliente', clienteId] });
      toast.success('Contrato creado correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear contrato: ${error.message}`);
    },
  });
}

export function useUpdateContrato(clienteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateContratoDto }) => updateContrato(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTRATOS_QUERY_KEY, 'cliente', clienteId] });
      toast.success('Contrato actualizado correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar contrato: ${error.message}`);
    },
  });
}

export function useDeleteContrato(clienteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteContrato(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTRATOS_QUERY_KEY, 'cliente', clienteId] });
      toast.success('Contrato eliminado correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar contrato: ${error.message}`);
    },
  });
}
