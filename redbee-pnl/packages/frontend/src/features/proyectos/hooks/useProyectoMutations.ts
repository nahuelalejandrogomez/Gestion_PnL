import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { proyectosApi } from '../api/proyectosApi';
import { PROYECTOS_QUERY_KEY } from './useProyectos';
import { CLIENTES_QUERY_KEY } from '@/features/clientes/hooks/useClientes';
import type { CreateProyectoDto, UpdateProyectoDto } from '../types/proyecto.types';

export function useProyectoMutations() {
  const queryClient = useQueryClient();

  const createProyecto = useMutation({
    mutationFn: (data: CreateProyectoDto) => proyectosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROYECTOS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CLIENTES_QUERY_KEY] });
      toast.success('Proyecto creado exitosamente');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Error al crear proyecto');
    },
  });

  const updateProyecto = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProyectoDto }) =>
      proyectosApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PROYECTOS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [PROYECTOS_QUERY_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: [CLIENTES_QUERY_KEY] });
      toast.success('Proyecto actualizado exitosamente');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Error al actualizar proyecto');
    },
  });

  const deleteProyecto = useMutation({
    mutationFn: (id: string) => proyectosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROYECTOS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CLIENTES_QUERY_KEY] });
      toast.success('Proyecto eliminado exitosamente');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Error al eliminar proyecto');
    },
  });

  return {
    createProyecto,
    updateProyecto,
    deleteProyecto,
  };
}
