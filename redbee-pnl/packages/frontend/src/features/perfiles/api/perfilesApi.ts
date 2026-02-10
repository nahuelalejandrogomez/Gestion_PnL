import { api } from '@/lib/api';
import type { PerfilesResponse, Perfil, CreatePerfilDto, UpdatePerfilDto } from '../types/perfil.types';

export const perfilesApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    estado?: string;
  }): Promise<PerfilesResponse> => {
    const { data } = await api.get<PerfilesResponse>('/perfiles', { params });
    return data;
  },

  create: async (dto: CreatePerfilDto): Promise<Perfil> => {
    const { data } = await api.post<Perfil>('/perfiles', dto);
    return data;
  },

  update: async (id: string, dto: UpdatePerfilDto): Promise<Perfil> => {
    const { data } = await api.put<Perfil>(`/perfiles/${id}`, dto);
    return data;
  },
};
