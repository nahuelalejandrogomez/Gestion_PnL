import { api } from '@/lib/api';
import type { PnlResult } from '../types/pnl.types';

export const pnlApi = {
  getByProyecto: async (proyectoId: string, anio?: number, mes?: number): Promise<PnlResult> => {
    const params: Record<string, number> = {};
    if (anio) params.anio = anio;
    if (mes) params.mes = mes;
    const { data } = await api.get<PnlResult>(`/pnl/proyecto/${proyectoId}`, { params });
    return data;
  },
};
