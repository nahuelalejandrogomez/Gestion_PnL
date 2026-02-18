/**
 * useRollingData - Hook para fetch consolidado Rolling
 * ÉPICA 2 US-004: Fetch dinámico de TODOS los clientes activos
 */

import { useQuery } from '@tanstack/react-query';
import { clientesApi } from '@/features/clientes/api/clientesApi';
import { pnlApi } from '@/features/pnl/api/pnlApi';
import type { PnlYearResult } from '@/features/pnl/types/pnl.types';
import type { Cliente as ClienteSystem } from '@/features/clientes/types/cliente.types';
import type {
  RollingData,
  ClienteRollingData,
  RollingMonthData,
  PaisCliente,
  TipoComercialCliente,
  Moneda,
} from '../types/rolling.types';

/**
 * Transforma PnlYearResult a ClienteRollingData
 */
function transformToRollingData(
  pnlData: PnlYearResult,
  clienteSystem: ClienteSystem,
): ClienteRollingData {
  // Mapear meses
  const meses: Record<number, RollingMonthData> = {};

  for (let m = 1; m <= 12; m++) {
    const monthData = pnlData.meses[m];
    if (!monthData) continue;

    meses[m] = {
      // Revenue
      revenueAsignado: monthData.revenue.asignado,
      revenueReal: monthData.revenueReal ?? null,
      revenueNoAsignado: monthData.revenue.noAsignado,
      revenueForecast: monthData.revenue.forecast,

      // FTEs
      ftesAsignados: monthData.indicadores.ftesAsignados,
      ftesReales: monthData.ftesReales ?? null,
      ftesNoAsignados: monthData.indicadores.ftesNoAsignados,
      ftesForecast: monthData.indicadores.ftesForecast,

      // Costos
      costosProyectados: monthData.costos.total,
      recursosReales: monthData.recursosReales ?? null,
      otrosReales: monthData.otrosReales ?? null,

      // Indicadores
      gross: monthData.indicadores.diffAmount,
      gmPct: monthData.indicadores.gmPct,
    };
  }

  // Mapear totales anuales
  const totales = pnlData.totalesAnuales;
  const totalesAnuales = {
    revenue: totales.revenue.asignado,
    ftes: totales.indicadores.ftesAsignados,
    costos: totales.costos.total,
    gross: totales.indicadores.diffAmount,
    gmPct: totales.indicadores.gmPct,
  };

  // Usar país y tipoComercial directamente desde el modelo Cliente
  // Ahora estos campos están disponibles en la base de datos (ÉPICA 1 y 2 completadas)
  const pais: PaisCliente = clienteSystem.pais;
  const tipoComercial: TipoComercialCliente = clienteSystem.tipoComercial;
  const moneda: Moneda = pnlData.monedaTarifario === 'ARS' ? 'ARS' : 'USD';

  return {
    clienteId: clienteSystem.id,
    clienteNombre: clienteSystem.nombre,
    pais,
    tipoComercial,
    moneda,
    meses,
    totalesAnuales,
    hasRealData: pnlData.hasRealData ?? false,
  };
}

/**
 * Ejecutar promesas con límite de concurrencia
 * Procesa en batches para evitar saturar conexiones TCP
 */
async function promiseAllWithLimit<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<any>
): Promise<any[]> {
  const results: any[] = [];

  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }

  return results;
}

/**
 * Consolidar FX rates desde múltiples clientes
 * Toma el primer cliente que tenga FX rates completos
 */
function consolidateFxRates(pnlResults: PnlYearResult[]): Record<number, number> {
  // Buscar el primer resultado con FX rates completos
  const fxRatesSource = pnlResults.find(pnl => pnl.fxRates && Object.keys(pnl.fxRates).length > 0);

  if (!fxRatesSource) {
    // Retornar FX rates vacíos si no hay fuente
    return {};
  }

  const consolidated: Record<number, number> = {};
  for (let m = 1; m <= 12; m++) {
    const rate = fxRatesSource.fxRates[m];
    if (rate !== null && rate !== undefined) {
      consolidated[m] = rate;
    }
  }

  return consolidated;
}

/**
 * Hook principal useRollingData
 * Fetch dinámico de TODOS los clientes activos
 */
export function useRollingData(year: number) {
  return useQuery({
    queryKey: ['rolling-data', year],
    queryFn: async (): Promise<RollingData> => {
      const startTime = performance.now();

      // 1. Fetch lista de clientes
      const clientesResponse = await clientesApi.getAll();
      const clientesActivos = clientesResponse.data.filter(c => c.estado === 'ACTIVO');

      // Warning si > 20 clientes
      if (clientesActivos.length > 20) {
        console.warn('[Rolling] Performance degradation risk', {
          totalClientes: clientesActivos.length,
          recommendation: 'Consider pagination or filtering',
        });
      }

      // 2. Fetch P&L de cada cliente con concurrencia limitada (3 simultáneos)
      const CONCURRENT_LIMIT = 3;

      const results = await promiseAllWithLimit(
        clientesActivos,
        CONCURRENT_LIMIT,
        async (cliente) => {
          try {
            const pnlData = await pnlApi.getByClienteYear(cliente.id, year);
            return {
              clienteSystem: cliente,
              pnlData,
              success: true,
            };
          } catch (error) {
            console.warn(`[Rolling] Cliente ${cliente.nombre} sin datos para ${year}`, error);
            return {
              clienteSystem: cliente,
              pnlData: null,
              success: false,
            };
          }
        }
      );

      // 3. Filtrar exitosos y transformar
      const successfulResults = results.filter(r => r.success && r.pnlData);
      const clientesData = successfulResults.map(r =>
        transformToRollingData(r.pnlData!, r.clienteSystem)
      );

      // 4. Consolidar FX rates
      const pnlResults = successfulResults.map(r => r.pnlData!);
      const fxRates = consolidateFxRates(pnlResults);

      // 5. Logs instrumentación
      const duration = Math.round(performance.now() - startTime);
      const clientesFailed = clientesActivos.length - clientesData.length;

      console.log('[Rolling] Fetch completed', {
        year,
        duration: `${duration}ms`,
        totalClientes: clientesActivos.length,
        clientesOk: clientesData.length,
        clientesFailed,
      });

      return {
        year,
        clientes: clientesData,
        totalClientes: clientesActivos.length,
        fxRates,
        forecasts: [], // TBD US-006+
        lastUpdated: new Date().toISOString(),
      };
    },
    staleTime: 5 * 60 * 1000, // 5 min
    retry: 2, // Retry 2 veces si falla
  });
}
