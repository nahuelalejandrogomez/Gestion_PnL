import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tarifariosApi } from '../api/tarifariosApi';
import type { CreateTarifarioDto, UpdateTarifarioDto } from '../types/tarifario.types';
import { toast } from 'sonner';

export const TARIFARIOS_QUERY_KEY = 'tarifarios';

/**
 * Hook to get all tarifarios
 */
export function useTarifarios(params?: {
  skip?: number;
  take?: number;
  clienteId?: string;
  estado?: string;
  esTemplate?: boolean;
}) {
  return useQuery({
    queryKey: [TARIFARIOS_QUERY_KEY, params],
    queryFn: () => tarifariosApi.getAll(params),
  });
}

/**
 * Hook to get a single tarifario by ID
 */
export function useTarifario(id?: string) {
  return useQuery({
    queryKey: [TARIFARIOS_QUERY_KEY, id],
    queryFn: () => tarifariosApi.getById(id!),
    enabled: !!id,
  });
}

/**
 * Hook to create a tarifario
 */
export function useCreateTarifario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateTarifarioDto) => tarifariosApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TARIFARIOS_QUERY_KEY] });
      toast.success('Tarifario creado');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      console.error('[Create Tarifario Error]', error);
      toast.error(error.response?.data?.message || 'Error al crear tarifario');
    },
  });
}

/**
 * Hook to create a tarifario from a template
 */
export function useCreateFromTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { clienteId: string; templateId: string; nombre?: string }) =>
      tarifariosApi.createFromTemplate(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TARIFARIOS_QUERY_KEY] });
      toast.success('Tarifario creado desde template');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      console.error('[Create From Template Error]', error);
      toast.error(error.response?.data?.message || 'Error al crear desde template');
    },
  });
}

/**
 * Hook to update a tarifario
 */
export function useUpdateTarifario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTarifarioDto }) =>
      tarifariosApi.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [TARIFARIOS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [TARIFARIOS_QUERY_KEY, variables.id] });
      toast.success('Tarifario actualizado');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      console.error('[Update Tarifario Error]', error);
      toast.error(error.response?.data?.message || 'Error al actualizar tarifario');
    },
  });
}

/**
 * Hook to delete a tarifario
 */
export function useDeleteTarifario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tarifariosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TARIFARIOS_QUERY_KEY] });
      toast.success('Tarifario eliminado');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      console.error('[Delete Tarifario Error]', error);
      toast.error(error.response?.data?.message || 'Error al eliminar tarifario');
    },
  });
}
