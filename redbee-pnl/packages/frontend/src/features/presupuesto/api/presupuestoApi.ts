import { api } from '@/lib/api';
import type { ProyectoPresupuesto, UpdatePresupuestoDto } from '../types/presupuesto.types';
import type { ClientePresupuesto, AplicarClientePresupuestoDto } from '../types/cliente-presupuesto.types';

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

  /**
   * Get presupuestos for cliente
   */
  getClientePresupuestos: async (
    clienteId: string,
    year?: number,
  ): Promise<ClientePresupuesto[]> => {
    const { data } = await api.get<ClientePresupuesto[]>(
      `/clientes/${clienteId}/presupuestos`,
      { params: year ? { year } : {} }
    );
    return data;
  },

  /**
   * Apply cliente presupuesto to proyecto (from current month to Dec)
   */
  aplicarClientePresupuesto: async (
    proyectoId: string,
    year: number,
    dto: AplicarClientePresupuestoDto,
  ): Promise<ProyectoPresupuesto> => {
    const { data } = await api.post<ProyectoPresupuesto>(
      `/proyectos/${proyectoId}/presupuesto/aplicar`,
      dto,
      { params: { year } }
    );
    return data;
  },
};
