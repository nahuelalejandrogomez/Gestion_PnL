/**
 * Tipos para módulo Rolling
 * ÉPICA 1: Tipos base (ActiveTab)
 * ÉPICA 2 US-004: Tipos completos (Cliente, RollingMonthData, ClienteRollingData, RollingData)
 */

/**
 * Tipo para identificar tabs activos
 */
export type ActiveTab = 'rf-actuals' | 'revenue' | 'pnls' | 'dashboard';

/**
 * Regiones geográficas de clientes
 * Ahora importadas desde tipos de Cliente
 */
export type PaisCliente = 'AR' | 'UY' | 'CL' | 'MX' | 'US' | 'BR' | 'PE' | 'CO' | 'OTRO';

/**
 * Tipo comercial del cliente
 */
export type TipoComercialCliente = 'BASE_INSTALADA' | 'NUEVA_VENTA';

/**
 * Moneda del cliente
 */
export type Moneda = 'USD' | 'ARS';

/**
 * Cliente del sistema (para fetch lista clientes)
 * DEPRECATED: Usar ClienteSystem de @/features/clientes/types/cliente.types
 */
export interface Cliente {
  id: string;
  nombre: string;
  activo: boolean;
  pais: PaisCliente;
  tipoComercial: TipoComercialCliente;
  moneda: Moneda;
}

/**
 * Datos de un mes específico para Rolling
 * Estructura simplificada de PnlMonthData orientada a vista consolidada
 */
export interface RollingMonthData {
  // Revenue
  revenueAsignado: number;
  revenueReal: number | null;
  revenueNoAsignado: number;
  revenueForecast: number;

  // FTEs
  ftesAsignados: number;
  ftesReales: number | null;
  ftesNoAsignados: number;
  ftesForecast: number;

  // Costos
  costosProyectados: number; // costos.total
  recursosReales: number | null;
  otrosReales: number | null;

  // Indicadores
  gross: number; // revenue - costos
  gmPct: number | null; // gross margin %

  // Bloque Potencial — fuente: ClientePotencial ACTIVO ponderado por probabilidadCierre
  // Meses sin real: potencial SE SUMA al efectivo. Meses con real: real sobrescribe.
  ftePotencial: number;      // contribución potencial (para subfila desglose)
  revenuePotencial: number;  // contribución potencial (para subfila desglose)

  // Valores efectivos por mes: real si existe, sino asignado + potencial
  revenueEfectivo: number;
  ftesEfectivos: number;
  fuente: 'REAL' | 'POTENCIAL' | 'ASIGNADO';
}

/**
 * Datos completos de un cliente para Rolling
 */
export interface ClienteRollingData {
  clienteId: string;
  clienteNombre: string;
  pais: PaisCliente;
  tipoComercial: TipoComercialCliente;
  moneda: Moneda;

  // Datos mensuales (1-12)
  meses: Record<number, RollingMonthData>;

  // Totales anuales
  totalesAnuales: {
    revenue: number;
    ftes: number;
    costos: number;
    gross: number;
    gmPct: number | null;
  };

  // Metadata
  hasRealData: boolean; // Si tiene al menos 1 mes con datos reales
}

/**
 * Datos consolidados Rolling
 */
export interface RollingData {
  year: number;
  clientes: ClienteRollingData[];
  totalClientes: number; // Cantidad total clientes activos
  fxRates: Record<number, number>; // 1-12 → tasa USD/ARS
  forecasts: unknown[]; // TBD en US-006+
  lastUpdated: string; // ISO timestamp
}
