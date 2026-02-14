import type { PnlMonthData } from '../pnl.service';

/**
 * Helper para calcular totales anuales de FTEs (suma)
 * Regla: Total anual = suma de ene a dic (meses vacíos = 0)
 */
export function calculateAnnualFtesSum(
  meses: Record<number, PnlMonthData>,
): {
  totalFtesForecast: number;
  totalFtesAsignados: number;
  totalFtesNoAsignados: number;
} {
  let totalFtesForecast = 0;
  let totalFtesAsignados = 0;

  for (let m = 1; m <= 12; m++) {
    const monthData = meses[m];
    totalFtesForecast += monthData.indicadores.ftesForecast;
    totalFtesAsignados += monthData.indicadores.ftesAsignados;
  }

  return {
    totalFtesForecast,
    totalFtesAsignados,
    totalFtesNoAsignados: totalFtesForecast - totalFtesAsignados,
  };
}

/**
 * Helper para calcular promedio anual de Blend Rate/Cost
 * Regla: Promedio simple de meses donde hay número, ignorar meses vacíos o null
 */
export function calculateAnnualBlendAverage(
  meses: Record<number, PnlMonthData>,
): {
  avgBlendRate: number | null;
  avgBlendCost: number | null;
} {
  let sumBlendRate = 0;
  let countBlendRate = 0;
  let sumBlendCost = 0;
  let countBlendCost = 0;

  for (let m = 1; m <= 12; m++) {
    const monthData = meses[m];
    if (monthData.indicadores.blendRate !== null) {
      sumBlendRate += monthData.indicadores.blendRate;
      countBlendRate++;
    }
    if (monthData.indicadores.blendCost !== null) {
      sumBlendCost += monthData.indicadores.blendCost;
      countBlendCost++;
    }
  }

  return {
    avgBlendRate: countBlendRate > 0 ? sumBlendRate / countBlendRate : null,
    avgBlendCost: countBlendCost > 0 ? sumBlendCost / countBlendCost : null,
  };
}

/**
 * Helper para calcular GM% anual
 * Regla: GM% anual = (Revenue anual - Costos anuales) / Revenue anual
 * No se debe promediar los porcentajes mensuales
 */
export function calculateAnnualGmPct(
  totalRevenueAsignado: number,
  totalCostos: number,
): number | null {
  if (totalRevenueAsignado === 0) return null;
  return ((totalRevenueAsignado - totalCostos) / totalRevenueAsignado) * 100;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ============================================================================
// TESTS
// ============================================================================

describe('Annual Totals Calculation Helpers', () => {
  // -------------------------------------------------------------------------
  // Test 1: FTEs Total = suma de meses
  // -------------------------------------------------------------------------
  describe('calculateAnnualFtesSum', () => {
    it('debe sumar FTEs de todos los meses (regla: suma anual)', () => {
      // Mock de datos mensuales con FTEs variados
      const meses: Record<number, PnlMonthData> = {};
      
      // Meses con valores
      for (let m = 1; m <= 12; m++) {
        meses[m] = {
          revenue: { forecast: 0, asignado: 0, noAsignado: 0 },
          costos: { recursos: 0, otros: 0, guardiasExtras: 0, total: 0 },
          indicadores: {
            ftesForecast: m <= 6 ? 10 : 5, // 10 FTEs en H1, 5 en H2
            ftesAsignados: m <= 6 ? 8 : 4,  // 8 FTEs en H1, 4 en H2
            ftesNoAsignados: 0,
            diffAmount: 0,
            diffPct: null,
            gmPct: null,
            blendRate: null,
            blendCost: null,
          },
        };
      }

      const result = calculateAnnualFtesSum(meses);

      // H1: 6 meses × 10 = 60, H2: 6 meses × 5 = 30 → Total = 90
      expect(result.totalFtesForecast).toBe(90);
      
      // H1: 6 meses × 8 = 48, H2: 6 meses × 4 = 24 → Total = 72
      expect(result.totalFtesAsignados).toBe(72);
      
      // Faltantes = 90 - 72 = 18
      expect(result.totalFtesNoAsignados).toBe(18);
    });

    it('debe considerar 0 los meses vacíos en la suma', () => {
      const meses: Record<number, PnlMonthData> = {};
      
      // Solo 3 meses con valores, resto en 0
      for (let m = 1; m <= 12; m++) {
        meses[m] = {
          revenue: { forecast: 0, asignado: 0, noAsignado: 0 },
          costos: { recursos: 0, otros: 0, guardiasExtras: 0, total: 0 },
          indicadores: {
            ftesForecast: m <= 3 ? 5 : 0, // Solo ene-mar con 5 FTEs
            ftesAsignados: m <= 3 ? 3 : 0,
            ftesNoAsignados: 0,
            diffAmount: 0,
            diffPct: null,
            gmPct: null,
            blendRate: null,
            blendCost: null,
          },
        };
      }

      const result = calculateAnnualFtesSum(meses);

      // 3 meses × 5 = 15
      expect(result.totalFtesForecast).toBe(15);
      
      // 3 meses × 3 = 9
      expect(result.totalFtesAsignados).toBe(9);
    });
  });

  // -------------------------------------------------------------------------
  // Test 2: Blend Total = promedio de meses con valor
  // -------------------------------------------------------------------------
  describe('calculateAnnualBlendAverage', () => {
    it('debe promediar solo los meses con valor (ignorar null)', () => {
      const meses: Record<number, PnlMonthData> = {};
      
      // 6 meses con valores, 6 meses null
      for (let m = 1; m <= 12; m++) {
        meses[m] = {
          revenue: { forecast: 0, asignado: 0, noAsignado: 0 },
          costos: { recursos: 0, otros: 0, guardiasExtras: 0, total: 0 },
          indicadores: {
            ftesForecast: 0,
            ftesAsignados: 0,
            ftesNoAsignados: 0,
            diffAmount: 0,
            diffPct: null,
            gmPct: null,
            blendRate: m <= 6 ? 5000 : null, // Solo H1 tiene blend rate
            blendCost: m <= 6 ? 3000 : null, // Solo H1 tiene blend cost
          },
        };
      }

      const result = calculateAnnualBlendAverage(meses);

      // Promedio de 6 meses con valor 5000 = 5000
      expect(result.avgBlendRate).toBe(5000);
      
      // Promedio de 6 meses con valor 3000 = 3000
      expect(result.avgBlendCost).toBe(3000);
    });

    it('debe calcular promedio correcto con valores variados', () => {
      const meses: Record<number, PnlMonthData> = {};
      
      // Valores variados en cada mes
      const blendRates = [4000, 4500, 5000, 5500, 6000, null, null, null, null, null, null, null];
      const blendCosts = [2500, 3000, 3500, null, null, null, null, null, null, null, null, null];
      
      for (let m = 1; m <= 12; m++) {
        meses[m] = {
          revenue: { forecast: 0, asignado: 0, noAsignado: 0 },
          costos: { recursos: 0, otros: 0, guardiasExtras: 0, total: 0 },
          indicadores: {
            ftesForecast: 0,
            ftesAsignados: 0,
            ftesNoAsignados: 0,
            diffAmount: 0,
            diffPct: null,
            gmPct: null,
            blendRate: blendRates[m - 1],
            blendCost: blendCosts[m - 1],
          },
        };
      }

      const result = calculateAnnualBlendAverage(meses);

      // Blend Rate: (4000 + 4500 + 5000 + 5500 + 6000) / 5 = 5000
      expect(result.avgBlendRate).toBe(5000);
      
      // Blend Cost: (2500 + 3000 + 3500) / 3 = 3000
      expect(result.avgBlendCost).toBe(3000);
    });

    it('debe retornar null si no hay meses con valor', () => {
      const meses: Record<number, PnlMonthData> = {};
      
      // Todos los meses null
      for (let m = 1; m <= 12; m++) {
        meses[m] = {
          revenue: { forecast: 0, asignado: 0, noAsignado: 0 },
          costos: { recursos: 0, otros: 0, guardiasExtras: 0, total: 0 },
          indicadores: {
            ftesForecast: 0,
            ftesAsignados: 0,
            ftesNoAsignados: 0,
            diffAmount: 0,
            diffPct: null,
            gmPct: null,
            blendRate: null,
            blendCost: null,
          },
        };
      }

      const result = calculateAnnualBlendAverage(meses);

      expect(result.avgBlendRate).toBeNull();
      expect(result.avgBlendCost).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Test 3: GM% Total = fórmula anual con revenue y costos totales
  // -------------------------------------------------------------------------
  describe('calculateAnnualGmPct', () => {
    it('debe calcular GM% con valores anuales (no promedio de meses)', () => {
      // Escenario: Revenue anual = $120,000, Costos = $90,000
      // GM% = (120000 - 90000) / 120000 * 100 = 25%
      
      const totalRevenue = 120000;
      const totalCostos = 90000;

      const gmPct = calculateAnnualGmPct(totalRevenue, totalCostos);

      expect(gmPct).toBe(25);
    });

    it('debe calcular GM% negativo correctamente', () => {
      // Escenario: Revenue = $100,000, Costos = $120,000
      // GM% = (100000 - 120000) / 100000 * 100 = -20%
      
      const totalRevenue = 100000;
      const totalCostos = 120000;

      const gmPct = calculateAnnualGmPct(totalRevenue, totalCostos);

      expect(gmPct).toBe(-20);
    });

    it('debe retornar null si revenue es 0 (evitar división por cero)', () => {
      const totalRevenue = 0;
      const totalCostos = 50000;

      const gmPct = calculateAnnualGmPct(totalRevenue, totalCostos);

      expect(gmPct).toBeNull();
    });

    it('debe calcular GM% 100% si costos son 0', () => {
      // Escenario: Revenue = $100,000, Costos = $0
      // GM% = (100000 - 0) / 100000 * 100 = 100%
      
      const totalRevenue = 100000;
      const totalCostos = 0;

      const gmPct = calculateAnnualGmPct(totalRevenue, totalCostos);

      expect(gmPct).toBe(100);
    });

    it('debe demostrar que no se debe promediar GM% mensuales', () => {
      // Escenario que demuestra por qué NO se debe promediar porcentajes
      // 
      // Mes 1: Revenue $10,000, Costos $8,000 → GM% = 20%
      // Mes 2: Revenue $90,000, Costos $72,000 → GM% = 20%
      // 
      // Si promediamos: (20% + 20%) / 2 = 20% ✓
      // 
      // Pero si los valores son diferentes:
      // Mes 1: Revenue $1,000, Costos $900 → GM% = 10%
      // Mes 2: Revenue $99,000, Costos $89,100 → GM% = 10%
      // 
      // Promedio simple: (10% + 10%) / 2 = 10%
      // Pero anual correcto: (100,000 - 90,000) / 100,000 = 10% ✓
      // 
      // Contraejemplo problemático:
      // Mes 1: Revenue $1,000, Costos $500 → GM% = 50%
      // Mes 2: Revenue $99,000, Costos $94,050 → GM% = 5%
      // 
      // Promedio INCORRECTO: (50% + 5%) / 2 = 27.5% ✗
      // Anual CORRECTO: (100,000 - 94,550) / 100,000 = 5.45% ✓

      const mes1Revenue = 1000;
      const mes1Costos = 500;
      const mes1GmPct = calculateAnnualGmPct(mes1Revenue, mes1Costos); // 50%

      const mes2Revenue = 99000;
      const mes2Costos = 94050;
      const mes2GmPct = calculateAnnualGmPct(mes2Revenue, mes2Costos); // 5%

      // Promedio INCORRECTO de porcentajes mensuales
      const promedioIncorrecto = ((mes1GmPct || 0) + (mes2GmPct || 0)) / 2;

      // Cálculo CORRECTO con valores anuales
      const totalRevenue = mes1Revenue + mes2Revenue;
      const totalCostos = mes1Costos + mes2Costos;
      const gmPctAnualCorrecto = calculateAnnualGmPct(totalRevenue, totalCostos);

      expect(round2(promedioIncorrecto)).toBe(27.5); // INCORRECTO
      expect(round2(gmPctAnualCorrecto || 0)).toBe(5.45); // CORRECTO

      // Demostración: la diferencia es significativa
      expect(Math.abs(promedioIncorrecto - (gmPctAnualCorrecto || 0))).toBeGreaterThan(20);
    });
  });
});
