import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tarifariosApi } from '../api/tarifariosApi';
import { TARIFARIOS_QUERY_KEY } from './useTarifarios';
import type { CreateTarifarioDto, UpdateTarifarioDto } from '../types/tarifario.types';
import { toast } from 'sonner';

export function useTarifarioMutations() {
  const queryClient = useQueryClient();

  const createTarifario = useMutation({
    mutationFn: (dto: CreateTarifarioDto) => tarifariosApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TARIFARIOS_QUERY_KEY] });
      toast.success('Tarifario creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear tarifario: ${error.message}`);
    },
  });

  const updateTarifario = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTarifarioDto }) =>
      tarifariosApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TARIFARIOS_QUERY_KEY] });
      toast.success('Tarifario actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar tarifario: ${error.message}`);
    },
  });

  const deleteTarifario = useMutation({
    mutationFn: (id: string) => tarifariosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TARIFARIOS_QUERY_KEY] });
      toast.success('Tarifario eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar tarifario: ${error.message}`);
    },
  });

  return {
    createTarifario,
    updateTarifario,
    deleteTarifario,
  };
}
