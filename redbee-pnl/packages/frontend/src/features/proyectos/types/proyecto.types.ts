// Tipos basados en SPECS.md - Modelo Proyecto

export type TipoProyecto = 'PROYECTO' | 'POTENCIAL' | 'SOPORTE' | 'RETAINER';
export type EstadoProyecto = 'ACTIVO' | 'PAUSADO' | 'CERRADO' | 'POTENCIAL' | 'TENTATIVO';

export interface Proyecto {
  id: string;
  clienteId: string;
  nombre: string;
  codigo: string;
  tipo: TipoProyecto;
  estado: EstadoProyecto;
  probabilidadCierre: number | null;
  fechaInicio: string;
  fechaFinEstimada: string | null;
  fechaFinReal: string | null;
  tarifarioId: string | null;
  contratoId: string | null;
  notas: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  cliente?: {
    id: string;
    nombre: string;
  };
  _count?: {
    asignaciones: number;
    lineasPnL: number;
  };
}

export interface ProyectoWithRelations extends Proyecto {
  cliente: {
    id: string;
    nombre: string;
    razonSocial: string;
  };
  tarifario?: {
    id: string;
    nombre: string;
  } | null;
  contrato?: {
    id: string;
    nombre: string;
    tipo: string;
  } | null;
  _count: {
    asignaciones: number;
    lineasPnL: number;
    skillsRequeridos: number;
  };
}

export interface CreateProyectoDto {
  clienteId: string;
  nombre: string;
  codigo: string;
  tipo?: TipoProyecto;
  estado?: EstadoProyecto;
  probabilidadCierre?: number;
  fechaInicio: string;
  fechaFinEstimada?: string;
  fechaFinReal?: string;
  tarifarioId?: string;
  contratoId?: string;
  notas?: string;
}

export interface UpdateProyectoDto {
  clienteId?: string;
  nombre?: string;
  codigo?: string;
  tipo?: TipoProyecto;
  estado?: EstadoProyecto;
  probabilidadCierre?: number | null;
  fechaInicio?: string;
  fechaFinEstimada?: string | null;
  fechaFinReal?: string | null;
  tarifarioId?: string | null;
  contratoId?: string | null;
  notas?: string | null;
}

export interface QueryProyectoParams {
  clienteId?: string;
  estado?: EstadoProyecto;
  tipo?: TipoProyecto;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProyectosResponse {
  data: Proyecto[];
  pagination: PaginationInfo;
}
