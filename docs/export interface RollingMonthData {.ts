export interface RollingMonthData {
  // Revenue
  revenueAsignado: number;      // Con staffing
  revenueReal: number | null;   // Dato real ingresado
  revenueNoAsignado: number;    // Sin staffing (potencial)
  revenueForecast: number;      // Forecast original
  
  // FTEs
  ftesAsignados: number;
  ftesReales: number | null;
  ftesNoAsignados: number;
  ftesForecast: number;
  
  // Costos
  costosProyectados: number;    // Total proyectado
  recursosReales: number | null;
  otrosReales: number | null;
  
  // Indicadores calculados
  gross: number;                // Revenue efectivo - Costos efectivos
  gmPct: number | null;         // GM% efectivo
}

export interface ClienteRollingData {
  clienteId: string;
  clienteNombre: string;
  region: 'AR' | 'CL' | 'UY' | 'US';
  moneda: 'USD' | 'ARS';
  meses: Record<number, RollingMonthData>; // 1-12
  totalesAnuales: {
    revenue: number;
    revenueBacklog: number;      // Asignado
    revenuePotencial: number;    // No asignado
    ftes: number;                // Promedio anual
    ftesBacklog: number;
    ftesPotencial: number;
    costos: number;
    gross: number;
    gpPct: number | null;
  };
}

export interface ForecastData {
  forecastId: string;
  nombre: string;               // "Forecast AR Staffing"
  region: 'AR' | 'CL' | 'LA' | 'US';
  tipo: 'staffing' | 'proyectos';
  meses: Record<number, {
    revenue: number;
    ftes: number;
    costos: number;
  }>;
  totalesAnuales: {
    revenue: number;
    ftes: number;
    costos: number;
  };
}

export interface RollingTotales {
  porMes: Record<number, {
    // FTEs
    ftesBacklog: number;
    ftesPotencial: number;
    ftesNew: number;             // Forecasts
    ftesTotal: number;
    ftesEvolucion: number | null; // % vs mes anterior
    
    // Revenue
    revenueBacklog: number;
    revenuePotencial: number;
    revenueNew: number;
    revenueTotal: number;
    
    // Costos y Gross
    costos: number;
    gross: number;
    gmPct: number | null;
  }>;
  anuales: {
    ftes: number;
    ftesBacklog: number;
    ftesPotencial: number;
    ftesNew: number;
    revenue: number;
    revenueBacklog: number;
    revenuePotencial: number;
    revenueNew: number;
    revenueBudget: number | null; // TBD
    costos: number;
    gross: number;
    gpPct: number;
  };
}

export interface RollingData {
  year: number;
  clientes: ClienteRollingData[];
  forecasts: ForecastData[];
  totales: RollingTotales;
  fxRates: Record<number, number>; // 1-12
  lastUpdated: string;              // ISO timestamp
}
