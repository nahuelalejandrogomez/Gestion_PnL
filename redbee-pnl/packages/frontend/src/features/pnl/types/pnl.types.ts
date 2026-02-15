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
}

// Nuevos indicadores de negocio (16 indicadores anuales)
export interface IndicadoresNegocio {
  // Revenue & Forecast
  ftePotencial: number; // Placeholder en 0
  fte: number; // Suma anual de FTEs asignados
  fcstRevPot: number; // Placeholder en 0
  fcstRev: number; // Revenue forecast anual
  revenue: number; // Revenue asignado anual
  difEstimacionRev: number; // Revenue sin staffing anual
  
  // Costos
  forecastCostPot: number; // Placeholder en 0
  forecastCostos: number; // Placeholder en 0
  costosDirectos: number; // Recursos + Guardias anual
  difEstimacionCD: number; // Placeholder en 0
  
  // Márgenes y ratios
  laborMargin: number | null; // (Revenue - CD) / Revenue
  costosIndirectos: number; // Otros costos anual
  costosTotales: number; // CD + CI
  grossProject: number | null; // (Revenue - CT) / Revenue
  blendRate: number | null; // Revenue / FTE / 160
  blendCost: number | null; // CD / FTE / 160
}

export interface PnlMonthData {
  revenue: PnlMonthRevenue;
  costos: PnlMonthCostos;
  indicadores: PnlMonthIndicadores;
  // Datos reales ingresados manualmente (solo para Cliente P&L)
  revenueReal?: number | null;
  recursosReales?: number | null;
  otrosReales?: number | null;
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
  indicadoresNegocio: IndicadoresNegocio; // 16 indicadores de negocio
  hasRealData?: boolean; // Indica si hay datos reales ingresados (solo para Cliente P&L)
}
