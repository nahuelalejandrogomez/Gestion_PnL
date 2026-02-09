export type TipoTiempo = 'BILLABLE' | 'NON_BILLABLE' | 'OVERHEAD' | 'BENCH';

export interface Asignacion {
  id: string;
  recursoId: string;
  proyectoId: string;
  porcentajeAsignacion: number;
  tipoTiempo: TipoTiempo;
  fechaDesde: string;
  fechaHasta: string | null;
  rolEnProyecto: string | null;
  notas: string | null;
  createdAt: string;
  updatedAt: string;
  recurso?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    costoMensual: number;
    monedaCosto: string;
    perfil?: { id: string; nombre: string };
  };
  proyecto?: {
    id: string;
    nombre: string;
    codigo: string;
  };
}

export interface CreateAsignacionDto {
  recursoId: string;
  proyectoId: string;
  porcentajeAsignacion: number;
  tipoTiempo?: TipoTiempo;
  fechaDesde: string;
  fechaHasta?: string;
  rolEnProyecto?: string;
  notas?: string;
}

export interface UpdateAsignacionDto {
  recursoId?: string;
  proyectoId?: string;
  porcentajeAsignacion?: number;
  tipoTiempo?: TipoTiempo;
  fechaDesde?: string;
  fechaHasta?: string | null;
  rolEnProyecto?: string | null;
  notas?: string | null;
}

export interface AsignacionesResponse {
  data: Asignacion[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface Recurso {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  costoMensual: number;
  monedaCosto: string;
  perfil?: { id: string; nombre: string; categoria: string; nivel: string | null };
}

export interface RecursosResponse {
  data: Recurso[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export interface Perfil {
  id: string;
  nombre: string;
  categoria: string;
  nivel: string | null;
  estado: string;
}
