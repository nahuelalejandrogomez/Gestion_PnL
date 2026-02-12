export interface PnlMonthRevenue {
  forecast: number;
  asignado: number;
  noAsignado: number;
}

export interface PnlMonthCostos {
  recursos: number;
  otros: number;
  guardiasExtras: number;
  total: number;
}

export interface PnlMonthIndicadores {
  ftesForecast: number;
  ftesAsignados: number;
  ftesNoAsignados: number;
  diffAmount: number;
  diffPct: number | null;
  gmPct: number | null;
  blendRate: number | null;
  blendCost: number | null;
  // Nuevos indicadores de negocio
  margenReal: number; // Revenue asignado - Costos totales
  margenPotencial: number; // Revenue forecast - Costos totales
  cobertura: number | null; // % FTEs asignados / FTEs forecast
}

export interface PnlMonthData {
  revenue: PnlMonthRevenue;
  costos: PnlMonthCostos;
  indicadores: PnlMonthIndicadores;
}

// Estados posibles del proyecto (según modelo de negocio)
export type EstadoProyecto =
  | 'CUBIERTO' // 🟢 Asignado >= Forecast Y Margen real >= 0
  | 'SIN_CUBRIR' // 🟡 Asignado < Forecast Y Margen real >= 0
  | 'EN_PERDIDA' // 🟠 Margen real < 0 Y Margen potencial >= 0
  | 'INVIABLE' // 🔴 Margen potencial < 0
  | 'SOBRE_ASIGNADO'; // 🔵 Asignado > Forecast

export interface AnalisisBrechaAnual {
  revenueSinStaffing: number; // Revenue forecast no asignado
  ftesFaltantes: number; // FTEs forecast no asignados
  margenSiSeCubre: number; // Margen potencial (forecast - costos)
  coberturaActual: number | null; // % cobertura
}

export interface PnlYearResult {
  proyectoId: string;
  proyectoNombre: string;
  year: number;
  monedaTarifario: string;
  costoEmpresaPct: number;
  fxRates: Record<number, number | null>;
  meses: Record<number, PnlMonthData>;
  totalesAnuales: PnlMonthData;
  // Nuevos indicadores anuales
  estadoProyecto: EstadoProyecto;
  analisisBrecha: AnalisisBrechaAnual;
}
