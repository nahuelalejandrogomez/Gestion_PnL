import { api } from '@/lib/api';
import type { PnlYearResult } from '../types/pnl.types';

export interface ClientePnlRealMesDto {
  month: number;
  revenueReal?: number;
  recursosReales?: number;
  otrosReales?: number;
  ftesReales?: number;
}

export interface UpdateClientePnlRealDto {
  meses: ClientePnlRealMesDto[];
}

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

  getByClienteYear: async (
    clienteId: string,
    year: number,
  ): Promise<PnlYearResult> => {
    const { data } = await api.get<PnlYearResult>(
      `/clientes/${clienteId}/pnl/${year}`,
    );
    return data;
  },

  updateClientePnlReal: async (
    clienteId: string,
    year: number,
    dto: UpdateClientePnlRealDto,
  ): Promise<{ success: boolean; updated: number }> => {
    const { data } = await api.put(
      `/clientes/${clienteId}/pnl/${year}/real`,
      dto,
    );
    return data;
  },
};
