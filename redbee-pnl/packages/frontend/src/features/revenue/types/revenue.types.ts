export type Moneda = 'ARS' | 'USD';

export interface ProyectoRevenue {
  proyectoId: string;
  proyectoNombre: string;
  codigo: string;
  revenue: number;
  moneda: Moneda;
  warnings: string[];
}

export interface MesRevenue {
  mes: number;
  proyectos: ProyectoRevenue[];
}

export interface ClienteRevenueResponse {
  clienteId: string;
  clienteNombre: string;
  year: number;
  horasBaseMes: number;
  monedaFacturacion: Moneda;
  meses: MesRevenue[];
  warnings: string[];
}

export interface FxRate {
  year: number;
  month: number;
  usdArs: number;
  tipo: 'REAL' | 'PLAN';
}
