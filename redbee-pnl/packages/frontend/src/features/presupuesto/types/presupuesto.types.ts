export type Moneda = 'ARS' | 'USD' | 'EUR';

export interface PresupuestoMes {
  id: string;
  month: number;
  amount: number;
  isOverride: boolean;
}

export interface ProyectoPresupuesto {
  proyectoId: string;
  year: number;
  moneda: Moneda;
  months: PresupuestoMes[];
  totalAnual: number;
}

export interface UpdatePresupuestoMesDto {
  month: number;
  amount: number;
  isOverride?: boolean;
}

export interface UpdatePresupuestoDto {
  moneda?: Moneda;
  months?: UpdatePresupuestoMesDto[];
}
