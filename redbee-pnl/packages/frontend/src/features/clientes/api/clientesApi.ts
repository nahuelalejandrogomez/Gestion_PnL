import { api } from '@/lib/api';
import type {
  Cliente,
  ClienteWithRelations,
  ClientesResponse,
  CreateClienteDto,
  UpdateClienteDto,
  QueryClienteParams,
} from '../types/cliente.types';

export const clientesApi = {
  getAll: async (params?: QueryClienteParams): Promise<ClientesResponse> => {
    const { data } = await api.get<ClientesResponse>('/clientes', { params });
    return data;
  },

  getById: async (id: string): Promise<ClienteWithRelations> => {
    const { data } = await api.get<ClienteWithRelations>(`/clientes/${id}`);
    return data;
  },

  create: async (dto: CreateClienteDto): Promise<Cliente> => {
    const { data } = await api.post<Cliente>('/clientes', dto);
    return data;
  },

  update: async (id: string, dto: UpdateClienteDto): Promise<Cliente> => {
    const { data } = await api.put<Cliente>(`/clientes/${id}`, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/clientes/${id}`);
  },
};
