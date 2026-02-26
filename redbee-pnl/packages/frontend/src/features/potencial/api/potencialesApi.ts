import { api } from '@/lib/api';
import type {
  ClientePotencial,
  CreateClientePotencialDto,
  UpdateClientePotencialDto,
  UpsertLineaDto,
  CambiarEstadoDto,
} from '../types/potencial.types';

export const potencialesApi = {
  getAll: async (clienteId: string): Promise<ClientePotencial[]> => {
    const { data } = await api.get<ClientePotencial[]>(`/clientes/${clienteId}/potenciales`);
    return data;
  },

  getOne: async (clienteId: string, id: string): Promise<ClientePotencial> => {
    const { data } = await api.get<ClientePotencial>(`/clientes/${clienteId}/potenciales/${id}`);
    return data;
  },

  create: async (clienteId: string, dto: CreateClientePotencialDto): Promise<ClientePotencial> => {
    const { data } = await api.post<ClientePotencial>(`/clientes/${clienteId}/potenciales`, dto);
    return data;
  },

  update: async (clienteId: string, id: string, dto: UpdateClientePotencialDto): Promise<ClientePotencial> => {
    const { data } = await api.put<ClientePotencial>(`/clientes/${clienteId}/potenciales/${id}`, dto);
    return data;
  },

  remove: async (clienteId: string, id: string): Promise<{ deleted: boolean }> => {
    const { data } = await api.delete<{ deleted: boolean }>(`/clientes/${clienteId}/potenciales/${id}`);
    return data;
  },

  upsertLineas: async (
    clienteId: string,
    potencialId: string,
    lineas: UpsertLineaDto[],
  ): Promise<unknown> => {
    const { data } = await api.put(`/clientes/${clienteId}/potenciales/${potencialId}/lineas`, lineas);
    return data;
  },

  removeLinea: async (
    clienteId: string,
    potencialId: string,
    lineaId: string,
  ): Promise<{ deleted: boolean }> => {
    const { data } = await api.delete<{ deleted: boolean }>(
      `/clientes/${clienteId}/potenciales/${potencialId}/lineas/${lineaId}`,
    );
    return data;
  },

  /** B-28: Cambiar estado (ACTIVO → GANADO | PERDIDO) */
  cambiarEstado: async (
    clienteId: string,
    id: string,
    dto: CambiarEstadoDto,
  ): Promise<ClientePotencial> => {
    const { data } = await api.patch<ClientePotencial>(
      `/clientes/${clienteId}/potenciales/${id}/estado`,
      dto,
    );
    return data;
  },
};
