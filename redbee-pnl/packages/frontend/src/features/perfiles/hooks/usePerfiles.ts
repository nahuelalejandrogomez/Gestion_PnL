import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { perfilesApi } from '../api/perfilesApi';
import type { CreatePerfilDto, UpdatePerfilDto } from '../types/perfil.types';
import { toast } from 'sonner';

export const PERFILES_QUERY_KEY = 'perfiles';

export function usePerfiles(params?: { page?: number; limit?: number; estado?: string }) {
  return useQuery({
    queryKey: [PERFILES_QUERY_KEY, params],
    queryFn: () => perfilesApi.getAll(params),
  });
}

export function usePerfilMutations() {
  const queryClient = useQueryClient();

  const createPerfil = useMutation({
    mutationFn: (dto: CreatePerfilDto) => perfilesApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PERFILES_QUERY_KEY] });
      toast.success('Perfil creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear perfil: ${error.message}`);
    },
  });

  const updatePerfil = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePerfilDto }) => perfilesApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PERFILES_QUERY_KEY] });
      toast.success('Perfil actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar perfil: ${error.message}`);
    },
  });

  return {
    createPerfil,
    updatePerfil,
  };
}
