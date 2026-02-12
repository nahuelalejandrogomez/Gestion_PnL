export type Moneda = 'USD' | 'ARS' | 'EUR';
export type NivelPerfil = 'JR' | 'SSR' | 'SR' | 'LEAD' | 'MANAGER' | 'STAFF';

export interface PlanMes {
  month: number;
  cantidad: number;
  isOverride: boolean;
}

export interface PlanLinea {
  id: string;
  planId: string;
  lineaTarifarioId: string;
  rateSnapshot: number;
  monedaSnapshot: Moneda;
  perfil?: {
    id: string;
    nombre: string;
    categoria: string;
    nivel: NivelPerfil | null;
  };
  meses: PlanMes[];
}

export interface ProyectoTarifarioPlan {
  id: string;
  proyectoId: string;
  tarifarioId: string;
  year: number;
  tarifario?: {
    id: string;
    nombre: string;
    moneda: Moneda;
    fechaVigenciaDesde: string;
    fechaVigenciaHasta: string | null;
  };
  lineas: PlanLinea[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdatePlanMesDto {
  lineaTarifarioId: string;
  perfilId?: string; // For reconciliation if lineaTarifarioId not found
  month: number;
  cantidad: number;
  isOverride: boolean;
}

export interface UpdatePlanDto {
  tarifarioId: string;
  meses: UpdatePlanMesDto[];
}

export interface AplicarTarifarioDto {
  tarifarioId: string;
}
