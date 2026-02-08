import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { clientesApi } from '../api/clientesApi';
import { CLIENTES_QUERY_KEY } from './useClientes';
import type { CreateClienteDto, UpdateClienteDto } from '../types/cliente.types';

export function useClienteMutations() {
  const queryClient = useQueryClient();

  const createCliente = useMutation({
    mutationFn: (data: CreateClienteDto) => clientesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTES_QUERY_KEY] });
      toast.success('Cliente creado exitosamente');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Error al crear cliente');
    },
  });

  const updateCliente = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClienteDto }) =>
      clientesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CLIENTES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CLIENTES_QUERY_KEY, variables.id] });
      toast.success('Cliente actualizado exitosamente');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Error al actualizar cliente');
    },
  });

  const deleteCliente = useMutation({
    mutationFn: (id: string) => clientesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTES_QUERY_KEY] });
      toast.success('Cliente eliminado exitosamente');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Error al eliminar cliente');
    },
  });

  return {
    createCliente,
    updateCliente,
    deleteCliente,
  };
}
