import { api } from '@/lib/api';
import type { GetPlanLineasResponse, UpsertPlanLineasDto } from '../types/planLinea.types';

export const planLineasApi = {
  getPlanLineas: async (proyectoId: string, year: number): Promise<GetPlanLineasResponse> => {
    const { data } = await api.get<GetPlanLineasResponse>(
      `/proyectos/${proyectoId}/plan-lineas`,
      { params: { year } },
    );
    return data;
  },

  upsertPlanLineas: async (
    proyectoId: string,
    dto: UpsertPlanLineasDto,
  ): Promise<{ success: boolean; updated: number }> => {
    const { data } = await api.put<{ success: boolean; updated: number }>(
      `/proyectos/${proyectoId}/plan-lineas`,
      dto,
    );
    return data;
  },

  deletePlanLineas: async (
    proyectoId: string,
    year: number,
  ): Promise<{ ok: boolean; deletedLines: number; deletedCells: number }> => {
    const { data } = await api.delete<{ ok: boolean; deletedLines: number; deletedCells: number }>(
      `/proyectos/${proyectoId}/plan-lineas`,
      { params: { year } },
    );
    return data;
  },
};
