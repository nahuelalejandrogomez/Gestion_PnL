import { useQuery } from '@tanstack/react-query';
import { RollingData, ClienteRollingData, ForecastData } from '../types/rolling.types';

const CLIENTE_IDS = ['link', 'ueno', 'prisma', 'valo', 'falabella', 'santander'] as const;

async function fetchClientePnl(clienteId: string, year: number) {
  const response = await fetch(`/api/clientes/${clienteId}/pnl/${year}`);
  if (!response.ok) {
    if (response.status === 404) {
      console.warn(`[Rolling] Cliente ${clienteId} sin datos para ${year}`);
      return null;
    }
    throw new Error(`Failed to fetch ${clienteId}: ${response.status}`);
  }
  return response.json();
}

function transformToRollingData(pnlData: any, clienteId: string): ClienteRollingData {
  // Transform existing P&L structure to Rolling structure
  const meses: Record<number, any> = {};
  
  for (let m = 1; m <= 12; m++) {
    const monthData = pnlData.meses[m];
    meses[m] = {
      revenueAsignado: monthData.revenue.asignado,
      revenueReal: monthData.revenueReal ?? null,
      revenueNoAsignado: monthData.revenue.noAsignado,
      revenueForecast: monthData.revenue.forecast,
      
      ftesAsignados: monthData.indicadores.ftesAsignados,
      ftesReales: monthData.ftesReales ?? null,
      ftesNoAsignados: monthData.indicadores.ftesNoAsignados,
      ftesForecast: monthData.indicadores.ftesForecast,
      
      costosProyectados: monthData.costos.total,
      recursosReales: monthData.recursosReales ?? null,
      otrosReales: monthData.otrosReales ?? null,
      
      // Calcular valores efectivos
      gross: 0, // Calculated below
      gmPct: null,
    };
    
    // Calculate effective values
    const effectiveRevenue = meses[m].revenueReal ?? meses[m].revenueAsignado;
    const effectiveCostos = 
      (meses[m].recursosReales !== null && meses[m].otrosReales !== null)
        ? meses[m].recursosReales + meses[m].otrosReales
        : meses[m].costosProyectados;
    
    meses[m].gross = effectiveRevenue - effectiveCostos;
    meses[m].gmPct = effectiveRevenue > 0 
      ? ((effectiveRevenue - effectiveCostos) / effectiveRevenue) * 100 
      : null;
  }
  
  return {
    clienteId,
    clienteNombre: pnlData.clienteNombre || clienteId,
    region: pnlData.region || 'AR', // TBD: Get from metadata
    moneda: pnlData.moneda || 'USD',
    meses,
    totalesAnuales: {
      revenue: pnlData.totalesAnuales.revenue.asignado,
      revenueBacklog: pnlData.totalesAnuales.revenue.asignado,
      revenuePotencial: pnlData.totalesAnuales.revenue.noAsignado,
      ftes: pnlData.totalesAnuales.indicadores.ftesAsignados,
      ftesBacklog: pnlData.totalesAnuales.indicadores.ftesAsignados,
      ftesPotencial: pnlData.totalesAnuales.indicadores.ftesNoAsignados,
      costos: pnlData.totalesAnuales.costos.total,
      gross: pnlData.totalesAnuales.indicadores.diffAmount,
      gpPct: pnlData.totalesAnuales.indicadores.gmPct,
    },
  };
}

export function useRollingData(year: number) {
  return useQuery({
    queryKey: ['rolling-data', year],
    queryFn: async (): Promise<RollingData> => {
      // Fetch all clients in parallel
      const clientesPromises = CLIENTE_IDS.map(id => 
        fetchClientePnl(id, year).catch(err => {
          console.error(`[Rolling] Error fetching ${id}:`, err);
          return null;
        })
      );
      
      const clientesResults = await Promise.all(clientesPromises);
      
      // Filter out failed fetches
      const clientesData = clientesResults
        .filter((data): data is NonNullable<typeof data> => data !== null)
        .map((data, idx) => transformToRollingData(data, CLIENTE_IDS[idx]));
      
      // TBD: Fetch forecasts (hardcoded empty for now)
      const forecasts: ForecastData[] = [];
      
      // TBD: Fetch FX rates (hardcoded 1:1 for now)
      const fxRates: Record<number, number> = {};
      for (let m = 1; m <= 12; m++) {
        fxRates[m] = 1; // TBD: Real rates
      }
      
      // Calculate totals
      const totales = calculateTotales(clientesData, forecasts);
      
      return {
        year,
        clientes: clientesData,
        forecasts,
        totales,
        fxRates,
        lastUpdated: new Date().toISOString(),
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

function calculateTotales(
  clientes: ClienteRollingData[], 
  forecasts: ForecastData[]
): RollingTotales {
  const porMes: Record<number, any> = {};
  
  for (let m = 1; m <= 12; m++) {
    let ftesBacklog = 0;
    let ftesPotencial = 0;
    let revenueBacklog = 0;
    let revenuePotencial = 0;
    let costos = 0;
    
    clientes.forEach(cliente => {
      const monthData = cliente.meses[m];
      ftesBacklog += monthData.ftesAsignados;
      ftesPotencial += monthData.ftesNoAsignados;
      revenueBacklog += monthData.revenueAsignado;
      revenuePotencial += monthData.revenueNoAsignado;
      
      // Effective costos
      const effectiveCostos = 
        (monthData.recursosReales !== null && monthData.otrosReales !== null)
          ? monthData.recursosReales + monthData.otrosReales
          : monthData.costosProyectados;
      costos += effectiveCostos;
    });
    
    const ftesNew = forecasts.reduce((sum, f) => sum + (f.meses[m]?.ftes || 0), 0);
    const revenueNew = forecasts.reduce((sum, f) => sum + (f.meses[m]?.revenue || 0), 0);
    
    const ftesTotal = ftesBacklog + ftesPotencial + ftesNew;
    const revenueTotal = revenueBacklog + revenuePotencial + revenueNew;
    const gross = revenueTotal - costos;
    const gmPct = revenueTotal > 0 ? (gross / revenueTotal) * 100 : null;
    
    // Evolution vs previous month
    const ftesEvolucion = m > 1 
      ? ((ftesTotal - porMes[m - 1].ftesTotal) / porMes[m - 1].ftesTotal) * 100
      : null;
    
    porMes[m] = {
      ftesBacklog,
      ftesPotencial,
      ftesNew,
      ftesTotal,
      ftesEvolucion,
      revenueBacklog,
      revenuePotencial,
      revenueNew,
      revenueTotal,
      costos,
      gross,
      gmPct,
    };
  }
  
  // Annual totals
  const anuales = {
    ftes: Object.values(porMes).reduce((sum: number, m: any) => sum + m.ftesTotal, 0) / 12,
    ftesBacklog: Object.values(porMes).reduce((sum: number, m: any) => sum + m.ftesBacklog, 0) / 12,
    ftesPotencial: Object.values(porMes).reduce((sum: number, m: any) => sum + m.ftesPotencial, 0) / 12,
    ftesNew: Object.values(porMes).reduce((sum: number, m: any) => sum + m.ftesNew, 0) / 12,
    revenue: Object.values(porMes).reduce((sum: number, m: any) => sum + m.revenueTotal, 0),
    revenueBacklog: Object.values(porMes).reduce((sum: number, m: any) => sum + m.revenueBacklog, 0),
    revenuePotencial: Object.values(porMes).reduce((sum: number, m: any) => sum + m.revenuePotencial, 0),
    revenueNew: Object.values(porMes).reduce((sum: number, m: any) => sum + m.revenueNew, 0),
    revenueBudget: null, // TBD
    costos: Object.values(porMes).reduce((sum: number, m: any) => sum + m.costos, 0),
    gross: Object.values(porMes).reduce((sum: number, m: any) => sum + m.gross, 0),
    gpPct: 0, // Calculated below
  };
  
  anuales.gpPct = anuales.revenue > 0 ? (anuales.gross / anuales.revenue) * 100 : 0;
  
  return { porMes, anuales };
}
