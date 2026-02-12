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

// Planner types

export interface PlannerRow {
  asignacionId: string;
  recursoId: string;
  recursoNombre: string;
  recursoApellido: string;
  perfilNombre: string;
  tipoTiempo: TipoTiempo;
  costoMensual: number;
  monedaCosto: string;
  meses: Record<number, number>; // month(1-12) → percentage
}

export interface PlannerData {
  proyectoId: string;
  year: number;
  rows: PlannerRow[];
}

export interface UpsertMesBatchDto {
  items: { asignacionId: string; year: number; month: number; porcentajeAsignacion: number }[];
}

// Salary overrides types
export interface RecursosCostosResponse {
  overrides: Record<string, Record<number, number>>; // { [recursoId]: { [month]: costoMensual } }
}

// Costos manuales types
export interface CostosManualesData {
  otrosCostos: Record<number, number>;   // { 1: 0, 2: 500, ... 12: 0 }
  guardiasExtras: Record<number, number>;
}

export interface UpsertCostosManualesDto {
  items: { month: number; otrosCostos: number; guardiasExtras: number }[];
}
