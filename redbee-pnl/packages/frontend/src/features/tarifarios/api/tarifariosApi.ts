import { api } from '@/lib/api';
import type {
  Tarifario,
  CreateTarifarioDto,
  UpdateTarifarioDto,
  TarifariosListResponse,
} from '../types/tarifario.types';

export const tarifariosApi = {
  /**
   * Get all tarifarios with pagination
   */
  getAll: async (params?: {
    skip?: number;
    take?: number;
    clienteId?: string;
    estado?: string;
    esTemplate?: boolean;
  }): Promise<TarifariosListResponse> => {
    const { data } = await api.get<TarifariosListResponse>('/tarifarios', { params });
    return data;
  },

  /**
   * Get a single tarifario by ID with lineas
   */
  getById: async (id: string): Promise<Tarifario> => {
    const { data } = await api.get<Tarifario>(`/tarifarios/${id}`);
    return data;
  },

  /**
   * Create a new tarifario
   */
  create: async (dto: CreateTarifarioDto): Promise<Tarifario> => {
    const { data } = await api.post<Tarifario>('/tarifarios', dto);
    return data;
  },

  /**
   * Create a tarifario from a template
   */
  createFromTemplate: async (params: {
    clienteId: string;
    templateId: string;
    nombre?: string;
  }): Promise<Tarifario> => {
    const { data } = await api.post<Tarifario>('/tarifarios/from-template', params);
    return data;
  },

  /**
   * Update a tarifario
   */
  update: async (id: string, dto: UpdateTarifarioDto): Promise<Tarifario> => {
    const { data } = await api.put<Tarifario>(`/tarifarios/${id}`, dto);
    return data;
  },

  /**
   * Delete a tarifario
   */
  delete: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await api.delete<{ success: boolean }>(`/tarifarios/${id}`);
    return data;
  },

  /**
   * Update a linea tarifario
   */
  updateLinea: async (
    lineaId: string,
    dto: { rate?: number; moneda?: string | null },
  ): Promise<any> => {
    const { data } = await api.put(`/tarifarios/lineas/${lineaId}`, dto);
    return data;
  },

  /**
   * Delete a linea tarifario
   */
  deleteLinea: async (lineaId: string): Promise<{ success: boolean }> => {
    const { data } = await api.delete<{ success: boolean }>(`/tarifarios/lineas/${lineaId}`);
    return data;
  },
};
