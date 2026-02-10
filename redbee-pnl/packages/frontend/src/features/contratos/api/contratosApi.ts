import { api } from '@/lib/api';
import type { Contrato, CreateContratoDto, UpdateContratoDto } from '../types/contrato.types';

export async function getContratosByCliente(clienteId: string): Promise<Contrato[]> {
  const { data } = await api.get<Contrato[]>(`/clientes/${clienteId}/contratos`);
  return data;
}

export async function getContratoById(id: string): Promise<Contrato> {
  const { data } = await api.get<Contrato>(`/contratos/${id}`);
  return data;
}

export async function createContrato(clienteId: string, dto: CreateContratoDto): Promise<Contrato> {
  const { data } = await api.post<Contrato>(`/clientes/${clienteId}/contratos`, dto);
  return data;
}

export async function updateContrato(id: string, dto: UpdateContratoDto): Promise<Contrato> {
  const { data } = await api.put<Contrato>(`/contratos/${id}`, dto);
  return data;
}

export async function deleteContrato(id: string): Promise<Contrato> {
  const { data } = await api.delete<Contrato>(`/contratos/${id}`);
  return data;
}
