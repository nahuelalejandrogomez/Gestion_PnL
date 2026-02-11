import { api } from '@/lib/api';
import type {
  ProyectoTarifarioPlan,
  UpdatePlanDto,
  AplicarTarifarioDto,
} from '../types/plan.types';

export const planApi = {
  getPlan: async (proyectoId: string, year: number): Promise<ProyectoTarifarioPlan | null> => {
    const { data } = await api.get<ProyectoTarifarioPlan | null>(
      `/proyectos/${proyectoId}/tarifario-plan`,
      { params: { year } }
    );
    return data;
  },

  updatePlan: async (
    proyectoId: string,
    year: number,
    dto: UpdatePlanDto
  ): Promise<ProyectoTarifarioPlan> => {
    const { data } = await api.put<ProyectoTarifarioPlan>(
      `/proyectos/${proyectoId}/tarifario-plan`,
      dto,
      { params: { year } }
    );
    return data;
  },

  aplicarTarifario: async (
    proyectoId: string,
    year: number,
    dto: AplicarTarifarioDto
  ): Promise<ProyectoTarifarioPlan> => {
    const { data } = await api.post<ProyectoTarifarioPlan>(
      `/proyectos/${proyectoId}/tarifario-plan/aplicar`,
      dto,
      { params: { year } }
    );
    return data;
  },
};
