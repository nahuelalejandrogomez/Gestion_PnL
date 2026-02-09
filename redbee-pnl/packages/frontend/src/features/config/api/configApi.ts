import { api } from '@/lib/api';
import type { AppConfig, UpdateConfigResponse } from '../types/config.types';

export const configApi = {
  getAll: async (): Promise<AppConfig> => {
    const { data } = await api.get<AppConfig>('/config');
    return data;
  },

  update: async (key: string, value: string): Promise<UpdateConfigResponse> => {
    const { data } = await api.put<UpdateConfigResponse>(`/config/${key}`, { value });
    return data;
  },
};
