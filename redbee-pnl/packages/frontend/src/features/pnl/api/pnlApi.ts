import { api } from '@/lib/api';
import type { PnlYearResult } from '../types/pnl.types';

export const pnlApi = {
  getByProyectoYear: async (
    proyectoId: string,
    year: number,
  ): Promise<PnlYearResult> => {
    const { data } = await api.get<PnlYearResult>(
      `/pnl/proyecto/${proyectoId}`,
      { params: { year } },
    );
    return data;
  },
};
