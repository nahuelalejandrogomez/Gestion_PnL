import { api } from '@/lib/api';
import type {
  Asignacion,
  AsignacionesResponse,
  CreateAsignacionDto,
  UpdateAsignacionDto,
  RecursosResponse,
  Perfil,
  PlannerData,
  UpsertMesBatchDto,
} from '../types/asignacion.types';

export const asignacionesApi = {
  getAll: async (params?: Record<string, unknown>): Promise<AsignacionesResponse> => {
    const { data } = await api.get<AsignacionesResponse>('/asignaciones', { params });
    return data;
  },

  getById: async (id: string): Promise<Asignacion> => {
    const { data } = await api.get<Asignacion>(`/asignaciones/${id}`);
    return data;
  },

  create: async (dto: CreateAsignacionDto): Promise<Asignacion> => {
    const { data } = await api.post<Asignacion>('/asignaciones', dto);
    return data;
  },

  update: async (id: string, dto: UpdateAsignacionDto): Promise<Asignacion> => {
    const { data } = await api.put<Asignacion>(`/asignaciones/${id}`, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/asignaciones/${id}`);
  },

  // Support endpoints for selectors
  getRecursos: async (params?: Record<string, unknown>): Promise<RecursosResponse> => {
    const { data } = await api.get<RecursosResponse>('/recursos', { params });
    return data;
  },

  getPerfiles: async (): Promise<Perfil[]> => {
    const { data } = await api.get<Perfil[]>('/perfiles');
    return data;
  },

  // Planner endpoints
  getPlannerData: async (proyectoId: string, year: number): Promise<PlannerData> => {
    const { data } = await api.get<PlannerData>(
      `/asignaciones/proyecto/${proyectoId}/planner`,
      { params: { year } },
    );
    return data;
  },

  savePlannerBatch: async (proyectoId: string, dto: UpsertMesBatchDto): Promise<{ updated: number }> => {
    const { data } = await api.put<{ updated: number }>(
      `/asignaciones/proyecto/${proyectoId}/planner`,
      dto,
    );
    return data;
  },
};
