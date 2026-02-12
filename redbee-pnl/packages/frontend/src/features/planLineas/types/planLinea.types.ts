export type EstadoCobertura = 'CUBIERTO' | 'PARCIAL' | 'SIN_ASIGNAR';

export interface CoberturaMes {
  ftesAsignados: number;
  porcentajeCobertura: number | null;
  estado: EstadoCobertura;
}

export interface PlanLinea {
  id: string;
  perfilId: string;
  perfilNombre: string;
  perfilCategoria: string;
  perfilNivel: string | null;
  nombreLinea: string | null;
  meses: Record<number, number>; // month -> ftes forecast
  total: number;
  cobertura: Record<number, CoberturaMes>; // month -> cobertura info
}

export interface GetPlanLineasResponse {
  proyectoId: string;
  year: number;
  lineas: PlanLinea[];
}

export interface MesData {
  month: number;
  ftes: number;
}

export interface PlanLineaInput {
  id?: string;
  perfilId: string;
  nombreLinea?: string;
  meses: MesData[];
}

export interface UpsertPlanLineasDto {
  year: number;
  tarifarioId?: string; // Tarifario del cliente usado para Revenue Plan
  lineas: PlanLineaInput[];
  deletedLineaIds?: string[];
}
