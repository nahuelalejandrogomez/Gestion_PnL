import { api } from '@/lib/api';
import type { ClienteRevenueResponse } from '../types/revenue.types';

export const revenueApi = {
  /**
   * Get revenue data for a cliente by year
   */
  getClienteRevenue: async (
    clienteId: string,
    year: number,
  ): Promise<ClienteRevenueResponse> => {
    const { data } = await api.get<ClienteRevenueResponse>(
      `/revenue/cliente/${clienteId}`,
      { params: { year } },
    );
    return data;
  },
};
