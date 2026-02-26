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

// Bloque Potencial — fuente: ClientePotencial ACTIVO ponderado por probabilidadCierre.
// Meses sin real: potencial SE SUMA al total. Meses con real: real sobrescribe.
export interface PotencialMes {
  ftePotencial: number;    // sum(linea.ftes × prob/100) por mes
  fcstRevPot: number;      // sum(linea.revenueEstimado × prob/100) por mes
  forecastCostPot: number; // siempre 0: sin costo de nómina asociado
}

// Nuevos indicadores de negocio (16 indicadores anuales)
export interface IndicadoresNegocio {
  // Revenue & Forecast
  ftePotencial: number; // anual — viene del bloque potencial
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
  // Datos reales ingresados manualmente (solo Cliente P&L)
  revenueReal?: number | null;
  recursosReales?: number | null;
  otrosReales?: number | null;
  ftesReales?: number | null;
  // Fuente del valor efectivo del mes (solo Cliente P&L)
  // REAL: tiene ClientePnlMesReal | POTENCIAL: sin real, tiene ClientePotencial | ASIGNADO: solo asignaciones
  fuente?: 'REAL' | 'POTENCIAL' | 'ASIGNADO';
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
  // Bloque Potencial — separado del confirmado (B-25/B-26)
  // Solo presente en el endpoint de cliente (no de proyecto individual)
  potencial?: {
    meses: Record<number, PotencialMes>;
    anual: PotencialMes;
  };
  hasRealData?: boolean; // Indica si hay datos reales ingresados (solo para Cliente P&L)
}
