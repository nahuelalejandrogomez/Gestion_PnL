import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const HORAS_BASE_MES = 176; // 22 days x 8 hours (SPECS)
const DIAS_BASE_MES = 22;

// ---------- Response types ----------

interface PnlMonthRevenue {
  forecast: number;
  asignado: number;
  noAsignado: number;
}

interface PnlMonthCostos {
  recursos: number;
  otros: number;
  guardiasExtras: number;
  total: number;
}

interface PnlMonthIndicadores {
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
}

// Estados posibles del proyecto (según modelo de negocio)
export type EstadoProyecto =
  | 'CUBIERTO' // Asignado >= Forecast Y Margen real >= 0
  | 'SIN_CUBRIR' // Asignado < Forecast Y Margen real >= 0
  | 'EN_PERDIDA' // Margen real < 0 Y Margen potencial >= 0
  | 'INVIABLE' // Margen potencial < 0
  | 'SOBRE_ASIGNADO'; // Asignado > Forecast

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
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

@Injectable()
export class PnlService {
  constructor(private prisma: PrismaService) {}

  async calculatePnlYear(
    proyectoId: string,
    year: number,
  ): Promise<PnlYearResult> {
    // 1. Fetch proyecto with tarifario link
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id: proyectoId },
      select: {
        id: true,
        nombre: true,
        codigo: true,
        deletedAt: true,
        tarifarioId: true,
        tarifarioRevenuePlanId: true,
      },
    });

    if (!proyecto || proyecto.deletedAt) {
      throw new NotFoundException(
        `Proyecto con ID ${proyectoId} no encontrado`,
      );
    }

    const tarifarioId =
      proyecto.tarifarioRevenuePlanId || proyecto.tarifarioId;

    // 2. Fetch all data in parallel (one big read, compute in memory)
    const [
      tarifarioLineas,
      tarifario,
      planLineas,
      asignaciones,
      costosManuales,
      fxRatesRaw,
      appConfig,
      recursoCostosOverrides,
    ] = await Promise.all([
      tarifarioId
        ? this.prisma.lineaTarifario.findMany({
            where: { tarifarioId },
            include: {
              perfil: { select: { id: true, nombre: true, nivel: true } },
            },
          })
        : Promise.resolve([]),

      tarifarioId
        ? this.prisma.tarifario.findUnique({
            where: { id: tarifarioId },
            select: { moneda: true },
          })
        : Promise.resolve(null),

      this.prisma.proyectoPlanLinea.findMany({
        where: { proyectoId, deletedAt: null },
        include: {
          perfil: { select: { id: true, nombre: true, nivel: true } },
          meses: { where: { year } },
        },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      }),

      this.prisma.asignacionRecurso.findMany({
        where: { proyectoId },
        include: {
          recurso: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              costoMensual: true,
              monedaCosto: true,
              perfil: { select: { id: true, nombre: true, nivel: true } },
            },
          },
          meses: { where: { year } },
        },
      }),

      this.prisma.proyectoCostoManualesMes.findMany({
        where: { proyectoId, year },
      }),

      this.prisma.fxRateMensual.findMany({
        where: { year },
        orderBy: [{ month: 'asc' }, { tipo: 'asc' }],
      }),

      this.prisma.appConfig.findUnique({
        where: { key: 'costoEmpresaPct' },
      }),

      this.prisma.recursoCostoMes.findMany({ where: { year } }),
    ]);

    const costoEmpresaPct = appConfig ? Number(appConfig.value) : 45;
    const monedaTarifario = tarifario?.moneda || 'USD';

    // 3. Rate map: perfilId|nivel -> monthly rate (normalised to per-month)
    // NOTA: Perfil/seniority solo para calcular forecast revenue, NO para matching
    const rateMap: Record<string, number> = {};
    for (const linea of tarifarioLineas) {
      let monthlyRate = Number(linea.rate);
      if (linea.unidad === 'HORA') {
        monthlyRate = monthlyRate * HORAS_BASE_MES;
      } else if (linea.unidad === 'DIA') {
        monthlyRate = monthlyRate * DIAS_BASE_MES;
      }
      const key = `${linea.perfilId}|${linea.perfil.nivel || 'null'}`;
      rateMap[key] = monthlyRate;
    }

    // 4. FX map: month -> effective USD/ARS
    const fxMap = this.buildFxMap(fxRatesRaw);

    // 5. Salary overrides map: recursoId -> { month -> costo }
    const salaryOverrides: Record<string, Record<number, number>> = {};
    for (const ov of recursoCostosOverrides) {
      if (!salaryOverrides[ov.recursoId]) salaryOverrides[ov.recursoId] = {};
      salaryOverrides[ov.recursoId][ov.month] = Number(ov.costoMensual);
    }

    // ============================================================================
    // NUEVA LÓGICA: Coverage ANY Match (sin distinción por perfil/seniority)
    // ============================================================================

    // 6. Forecast FTEs y Revenue por mes (TOTAL, sin agrupar por perfil)
    const forecastByMonth: Record<number, { ftes: number; revenue: number }> = {};
    for (let m = 1; m <= 12; m++) {
      forecastByMonth[m] = { ftes: 0, revenue: 0 };
    }

    for (const linea of planLineas) {
      const key = `${linea.perfilId}|${linea.perfil.nivel || 'null'}`;
      const rate = rateMap[key] || 0;

      for (const mes of linea.meses) {
        const ftes = Number(mes.ftes);
        forecastByMonth[mes.month].ftes += ftes;
        forecastByMonth[mes.month].revenue += ftes * rate;
      }
    }

    // 7. Assigned FTEs por mes (TOTAL, sin agrupar por perfil) + resource costs
    const assignedByMonth: Record<number, number> = {};
    const costByMonthARS: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) {
      assignedByMonth[m] = 0;
      costByMonthARS[m] = 0;
    }

    for (const asig of asignaciones) {
      const baseCosto = Number(asig.recurso.costoMensual);
      const recursoId = asig.recurso.id;

      for (const mes of asig.meses) {
        const pct = Number(mes.porcentajeAsignacion);
        if (pct === 0) continue;
        const fte = pct / 100;

        // Sumar FTE asignado (ANY, sin importar perfil)
        assignedByMonth[mes.month] += fte;

        // Sumar costo
        const costForMonth =
          salaryOverrides[recursoId]?.[mes.month] ?? baseCosto;
        costByMonthARS[mes.month] += costForMonth * (pct / 100);
      }
    }

    // 8. Costos manuales (stored in ARS)
    const otrosCostosARS: Record<number, number> = {};
    const guardiasARS: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) {
      otrosCostosARS[m] = 0;
      guardiasARS[m] = 0;
    }
    for (const cm of costosManuales) {
      otrosCostosARS[cm.month] = Number(cm.otrosCostos);
      guardiasARS[cm.month] = Number(cm.guardiasExtras);
    }

    // 9. Compute per-month P&L usando ASIGNACIÓN DISTRIBUIDA
    // Distribuir FTEs asignados a líneas en orden (createdAt+id) para calcular revenue
    // Las líneas ya vienen ordenadas de Prisma con orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]
    const meses: Record<number, PnlMonthData> = {};
    const acc = {
      revForecast: 0,
      revAsignado: 0,
      revNoAsignado: 0,
      costRecursos: 0,
      costOtros: 0,
      costGuardias: 0,
      costTotal: 0,
      ftesForecast: 0,
      ftesAsignados: 0,
    };

    for (let m = 1; m <= 12; m++) {
      const fx = fxMap[m] || 1;

      // Obtener totales del mes
      const fteForecast = forecastByMonth[m].ftes;
      const fteAssigned = assignedByMonth[m];
      const forecastRevenue = forecastByMonth[m].revenue;

      // ============================================================================
      // ASIGNACIÓN DISTRIBUIDA: Distribuir FTEs a líneas para calcular revenue
      // ============================================================================
      let assignedRevenue = 0;
      let assignedRemaining = fteAssigned;
      let fteAssignedUsed = 0; // FTEs realmente usados (capped por forecast)

      for (const linea of planLineas) {
        const mesData = linea.meses.find((mes) => mes.month === m);
        const lineForecast = mesData ? Number(mesData.ftes) : 0;

        if (lineForecast === 0) continue;

        const key = `${linea.perfilId}|${linea.perfil.nivel || 'null'}`;
        const lineRate = rateMap[key] || 0;

        // Asignar lo que se pueda cubrir de esta línea
        const lineAssignedEquivalent = Math.min(
          lineForecast,
          assignedRemaining,
        );

        assignedRevenue += lineAssignedEquivalent * lineRate;
        fteAssignedUsed += lineAssignedEquivalent;
        assignedRemaining -= lineAssignedEquivalent;

        if (assignedRemaining < 0.0001) {
          assignedRemaining = 0; // Evitar errores de floating point
          break;
        }
      }

      const revenueSinStaffing = Math.max(0, forecastRevenue - assignedRevenue);
      const ftesFaltantes = Math.max(0, fteForecast - fteAssigned);

      // Costs: convert ARS -> USD using FX
      const costRecursos = fx > 0 ? costByMonthARS[m] / fx : 0;
      const costOtros = fx > 0 ? otrosCostosARS[m] / fx : 0;
      const costGuardias = fx > 0 ? guardiasARS[m] / fx : 0;
      const costTotal = costRecursos + costOtros + costGuardias;

      const diffAmount = assignedRevenue - costTotal;

      // Indicadores de negocio
      const margenReal = assignedRevenue - costTotal;
      const margenPotencial = forecastRevenue - costTotal;
      const coberturaRatio = fteForecast > 0 ? fteAssigned / fteForecast : 0;
      const coberturaRatioPct = coberturaRatio > 0 ? coberturaRatio * 100 : null;

      meses[m] = {
        revenue: {
          forecast: round2(forecastRevenue),
          asignado: round2(assignedRevenue),
          noAsignado: round2(revenueSinStaffing),
        },
        costos: {
          recursos: round2(costRecursos),
          otros: round2(costOtros),
          guardiasExtras: round2(costGuardias),
          total: round2(costTotal),
        },
        indicadores: {
          ftesForecast: round2(fteForecast),
          ftesAsignados: round2(fteAssigned),
          ftesNoAsignados: round2(ftesFaltantes),
          diffAmount: round2(diffAmount),
          diffPct:
            assignedRevenue > 0
              ? round2((diffAmount / assignedRevenue) * 100)
              : null,
          gmPct:
            assignedRevenue > 0
              ? round2(((assignedRevenue - costTotal) / assignedRevenue) * 100)
              : null,
          blendRate:
            fteAssignedUsed > 0
              ? round2(assignedRevenue / fteAssignedUsed)
              : null,
          blendCost:
            fteAssignedUsed > 0 ? round2(costRecursos / fteAssignedUsed) : null,
        },
      };

      acc.revForecast += forecastRevenue;
      acc.revAsignado += assignedRevenue;
      acc.revNoAsignado += revenueSinStaffing;
      acc.costRecursos += costRecursos;
      acc.costOtros += costOtros;
      acc.costGuardias += costGuardias;
      acc.costTotal += costTotal;
      acc.ftesForecast += fteForecast;
      acc.ftesAsignados += fteAssigned;
    }

    // 10. Annual totals (FTEs averaged, amounts summed)
    const annualDiff = acc.revAsignado - acc.costTotal;
    const avgFteForecast = acc.ftesForecast / 12;
    const avgFteAsignados = acc.ftesAsignados / 12;

    // Nuevos indicadores anuales
    const margenRealAnual = acc.revAsignado - acc.costTotal;
    const margenPotencialAnual = acc.revForecast - acc.costTotal;
    const coberturaAnual = acc.ftesForecast > 0 ? (acc.ftesAsignados / acc.ftesForecast) * 100 : null;

    const totalesAnuales: PnlMonthData = {
      revenue: {
        forecast: round2(acc.revForecast),
        asignado: round2(acc.revAsignado),
        noAsignado: round2(acc.revNoAsignado),
      },
      costos: {
        recursos: round2(acc.costRecursos),
        otros: round2(acc.costOtros),
        guardiasExtras: round2(acc.costGuardias),
        total: round2(acc.costTotal),
      },
      indicadores: {
        ftesForecast: round2(avgFteForecast),
        ftesAsignados: round2(avgFteAsignados),
        ftesNoAsignados: round2(avgFteForecast - avgFteAsignados),
        diffAmount: round2(annualDiff),
        diffPct:
          acc.revAsignado > 0
            ? round2((annualDiff / acc.revAsignado) * 100)
            : null,
        gmPct:
          acc.revAsignado > 0
            ? round2(
                ((acc.revAsignado - acc.costTotal) / acc.revAsignado) * 100,
              )
            : null,
        blendRate:
          acc.ftesAsignados > 0
            ? round2((acc.revAsignado / acc.ftesAsignados) * 12)
            : null,
        blendCost:
          acc.ftesAsignados > 0
            ? round2((acc.costRecursos / acc.ftesAsignados) * 12)
            : null,
      },
    };

    // 11. Calcular los 16 indicadores de negocio
    const costosDirectos = acc.costRecursos + acc.costGuardias;
    const costosIndirectos = acc.costOtros;
    const costosTotales = costosDirectos + costosIndirectos;
    const fteAnual = acc.ftesAsignados; // Suma anual de FTEs (promedio mensual ya calculado)
    
    const indicadoresNegocio: IndicadoresNegocio = {
      // Revenue & Forecast
      ftePotencial: 0, // Placeholder
      fte: round2(fteAnual),
      fcstRevPot: 0, // Placeholder
      fcstRev: round2(acc.revForecast),
      revenue: round2(acc.revAsignado),
      difEstimacionRev: round2(acc.revNoAsignado),
      
      // Costos
      forecastCostPot: 0, // Placeholder
      forecastCostos: 0, // Placeholder
      costosDirectos: round2(costosDirectos),
      difEstimacionCD: 0, // Placeholder
      
      // Márgenes y ratios
      laborMargin: acc.revAsignado > 0
        ? round2(((acc.revAsignado - costosDirectos) / acc.revAsignado) * 100)
        : null,
      costosIndirectos: round2(costosIndirectos),
      costosTotales: round2(costosTotales),
      grossProject: acc.revAsignado > 0
        ? round2(((acc.revAsignado - costosTotales) / acc.revAsignado) * 100)
        : null,
      blendRate: fteAnual > 0
        ? round2(acc.revAsignado / fteAnual / 160)
        : null,
      blendCost: fteAnual > 0
        ? round2(costosDirectos / fteAnual / 160)
        : null,
    };

    return {
      proyectoId,
      proyectoNombre: proyecto.nombre,
      year,
      monedaTarifario,
      costoEmpresaPct,
      fxRates: fxMap,
      meses,
      totalesAnuales,
      indicadoresNegocio,
    };
  }

  private buildFxMap(
    fxRatesRaw: { month: number; tipo: string; usdArs: unknown }[],
  ): Record<number, number | null> {
    const byMonth: Record<
      number,
      { real: number | null; plan: number | null }
    > = {};
    for (let m = 1; m <= 12; m++) byMonth[m] = { real: null, plan: null };

    for (const r of fxRatesRaw) {
      if (r.tipo === 'REAL') {
        byMonth[r.month].real = Number(r.usdArs);
      } else {
        byMonth[r.month].plan = Number(r.usdArs);
      }
    }

    const fxMap: Record<number, number | null> = {};
    let lastEffective: number | null = null;

    for (let m = 1; m <= 12; m++) {
      const { real, plan } = byMonth[m];
      if (real !== null) {
        fxMap[m] = real;
        lastEffective = real;
      } else if (plan !== null) {
        fxMap[m] = plan;
        lastEffective = plan;
      } else {
        fxMap[m] = lastEffective;
      }
    }

    return fxMap;
  }
}
