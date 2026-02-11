import { api } from '@/lib/api';
import type { ProyectoPresupuesto, UpdatePresupuestoDto } from '../types/presupuesto.types';

export const presupuestoApi = {
  /**
   * Get presupuesto for proyecto + year
   */
  getPresupuesto: async (proyectoId: string, year: number): Promise<ProyectoPresupuesto> => {
    const { data } = await api.get<ProyectoPresupuesto>(
      `/proyectos/${proyectoId}/presupuesto`,
      { params: { year } }
    );
    return data;
  },

  /**
   * Update presupuesto (moneda and/or months)
   */
  updatePresupuesto: async (
    proyectoId: string,
    year: number,
    dto: UpdatePresupuestoDto,
  ): Promise<ProyectoPresupuesto> => {
    const { data } = await api.put<ProyectoPresupuesto>(
      `/proyectos/${proyectoId}/presupuesto`,
      dto,
      { params: { year } }
    );
    return data;
  },
};
