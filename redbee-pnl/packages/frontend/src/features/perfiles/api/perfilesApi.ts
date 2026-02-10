import { api } from '@/lib/api';
import type { PerfilesResponse } from '../types/perfil.types';

export const perfilesApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    estado?: string;
  }): Promise<PerfilesResponse> => {
    const { data } = await api.get<PerfilesResponse>('/perfiles', { params });
    return data;
  },
};
