/**
 * Coverage ANY Match Helper
 *
 * Nueva lógica de cobertura: CUALQUIER recurso asignado puede cubrir CUALQUIER forecast,
 * sin importar perfil ni seniority.
 *
 * Perfil y seniority quedan solo informativos (para UI/reporting),
 * pero NO condicionan la cobertura.
 *
 * Regla base:
 * - Forecast = demanda de FTEs por mes (sumatoria de FTEs planificados)
 * - Asignado = oferta real de FTEs por mes (sumatoria de FTEs asignados)
 * - Cobertura mensual = min(FTE_asignados_mes, FTE_forecast_mes)
 * - FTE faltantes = max(FTE_forecast_mes - FTE_asignados_mes, 0)
 * - Sobreasignado = max(FTE_asignados_mes - FTE_forecast_mes, 0)
 *
 * Revenue:
 * - Forecast $ = suma de forecast líneas con rate
 * - Asignado $ = forecast_total_mes * clamp(FTE_asignados_mes / FTE_forecast_mes, 0..1)
 * - Sin staffing $ = forecast_total_mes - asignado $
 */

export interface MonthCoverageData {
  fteForecast: number;
  fteAssigned: number;
  coverageRatio: number; // 0..1 (or >1 if sobreasignado)
  forecastRevenue: number;
  assignedRevenue: number; // proporcional por coverageRatio (capped at 100%)
  revenueSinStaffing: number;
  ftesFaltantes: number; // max(0, forecast - assigned)
  ftesSobreasignados: number; // max(0, assigned - forecast)
}

/**
 * Calcula la cobertura ANY para un mes específico
 * @param fteForecast - Total FTE forecast para el mes (suma de todas las líneas)
 * @param fteAssigned - Total FTE asignado para el mes (suma de todos los recursos)
 * @param forecastRevenue - Total revenue forecast para el mes (suma de forecast con rates)
 * @returns Datos de cobertura del mes
 */
export function calculateMonthCoverageAny(
  fteForecast: number,
  fteAssigned: number,
  forecastRevenue: number,
): MonthCoverageData {
  // Coverage ratio (puede ser > 1 si sobreasignado)
  const coverageRatio = fteForecast > 0 ? fteAssigned / fteForecast : 0;

  // Revenue asignado = proporcional al forecast, capped at 100%
  const coverageRatioCapped = Math.min(coverageRatio, 1);
  const assignedRevenue = forecastRevenue * coverageRatioCapped;

  // Revenue sin staffing = lo que falta cubrir
  const revenueSinStaffing = forecastRevenue - assignedRevenue;

  // FTEs faltantes y sobreasignados
  const ftesFaltantes = Math.max(0, fteForecast - fteAssigned);
  const ftesSobreasignados = Math.max(0, fteAssigned - fteForecast);

  return {
    fteForecast,
    fteAssigned,
    coverageRatio,
    forecastRevenue,
    assignedRevenue,
    revenueSinStaffing,
    ftesFaltantes,
    ftesSobreasignados,
  };
}

/**
 * Determina el estado de cobertura de un mes
 * @param coverageRatio - Ratio de cobertura (0..n)
 * @returns Estado: CUBIERTO | PARCIAL | SIN_ASIGNAR | SOBRE_ASIGNADO
 */
export function determineMonthCoverageStatus(
  fteForecast: number,
  coverageRatio: number,
): 'CUBIERTO' | 'PARCIAL' | 'SIN_ASIGNAR' | 'SOBRE_ASIGNADO' {
  if (fteForecast === 0) {
    return coverageRatio > 0 ? 'SOBRE_ASIGNADO' : 'SIN_ASIGNAR';
  }

  if (coverageRatio >= 1) {
    return coverageRatio > 1 ? 'SOBRE_ASIGNADO' : 'CUBIERTO';
  }

  if (coverageRatio > 0) {
    return 'PARCIAL';
  }

  return 'SIN_ASIGNAR';
}

/**
 * Redondea un número a 2 decimales
 */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
