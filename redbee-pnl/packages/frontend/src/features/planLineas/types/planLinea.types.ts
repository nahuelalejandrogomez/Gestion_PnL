export interface PlanLinea {
  id: string;
  perfilId: string;
  perfilNombre: string;
  perfilCategoria: string;
  nombreLinea: string | null;
  meses: Record<number, number>; // month -> ftes
  total: number;
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
  lineas: PlanLineaInput[];
  deletedLineaIds?: string[];
}
