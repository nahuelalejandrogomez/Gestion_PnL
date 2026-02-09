import { api } from '@/lib/api';
import type {
  Proyecto,
  ProyectoWithRelations,
  ProyectosResponse,
  CreateProyectoDto,
  UpdateProyectoDto,
  QueryProyectoParams,
} from '../types/proyecto.types';

export const proyectosApi = {
  getAll: async (params?: QueryProyectoParams): Promise<ProyectosResponse> => {
    const { data } = await api.get<ProyectosResponse>('/proyectos', { params });
    return data;
  },

  getById: async (id: string): Promise<ProyectoWithRelations> => {
    const { data } = await api.get<ProyectoWithRelations>(`/proyectos/${id}`);
    return data;
  },

  create: async (dto: CreateProyectoDto): Promise<Proyecto> => {
    const { data } = await api.post<Proyecto>('/proyectos', dto);
    return data;
  },

  update: async (id: string, dto: UpdateProyectoDto): Promise<Proyecto> => {
    const { data } = await api.put<Proyecto>(`/proyectos/${id}`, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/proyectos/${id}`);
  },
};
