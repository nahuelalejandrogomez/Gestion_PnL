import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { asignacionesApi } from '../api/asignacionesApi';
import { ASIGNACIONES_QUERY_KEY } from './useAsignaciones';
import { PROYECTOS_QUERY_KEY } from '@/features/proyectos/hooks/useProyectos';
import { PNL_QUERY_KEY } from '@/features/pnl';
import type { CreateAsignacionDto, UpdateAsignacionDto } from '../types/asignacion.types';

const ROLLING_QUERY_KEY = 'rolling-data';

export function useAsignacionMutations() {
  const queryClient = useQueryClient();

  const invalidateAfterAsignacionChange = () => {
    queryClient.invalidateQueries({ queryKey: [ASIGNACIONES_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: [PROYECTOS_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: [PNL_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: [ROLLING_QUERY_KEY] });
  };

  const createAsignacion = useMutation({
    mutationFn: (data: CreateAsignacionDto) => asignacionesApi.create(data),
    onSuccess: () => {
      invalidateAfterAsignacionChange();
      toast.success('Asignación creada exitosamente');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Error al crear asignación');
    },
  });

  const updateAsignacion = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAsignacionDto }) =>
      asignacionesApi.update(id, data),
    onSuccess: () => {
      invalidateAfterAsignacionChange();
      toast.success('Asignación actualizada exitosamente');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Error al actualizar asignación');
    },
  });

  const deleteAsignacion = useMutation({
    mutationFn: (id: string) => asignacionesApi.delete(id),
    onSuccess: () => {
      invalidateAfterAsignacionChange();
      toast.success('Asignación eliminada exitosamente');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Error al eliminar asignación');
    },
  });

  return { createAsignacion, updateAsignacion, deleteAsignacion };
}
