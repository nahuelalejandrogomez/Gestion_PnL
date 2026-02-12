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
  // Nuevos indicadores anuales
  estadoProyecto: EstadoProyecto;
  analisisBrecha: AnalisisBrechaAnual;
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
      }),

      this.prisma.asignacionRecurso.findMany({
        where: { proyectoId },
        include: {
          recurso: {
            select: {
              id: true,
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

    // 3. Rate map: perfilId -> monthly rate (normalised to per-month)
    const rateMap: Record<string, number> = {};
    for (const linea of tarifarioLineas) {
      let monthlyRate = Number(linea.rate);
      if (linea.unidad === 'HORA') {
        monthlyRate = monthlyRate * HORAS_BASE_MES;
      } else if (linea.unidad === 'DIA') {
        monthlyRate = monthlyRate * DIAS_BASE_MES;
      }
      rateMap[linea.perfilId] = monthlyRate;
    }

    // 4. FX map: month -> effective USD/ARS
    const fxMap = this.buildFxMap(fxRatesRaw);

    // 5. Salary overrides map: recursoId -> { month -> costo }
    const salaryOverrides: Record<string, Record<number, number>> = {};
    for (const ov of recursoCostosOverrides) {
      if (!salaryOverrides[ov.recursoId]) salaryOverrides[ov.recursoId] = {};
      salaryOverrides[ov.recursoId][ov.month] = Number(ov.costoMensual);
    }

    // 6. Forecast FTEs: perfilId -> { month -> totalFtes }
    const forecastByPerfil: Record<string, Record<number, number>> = {};
    for (const linea of planLineas) {
      const pid = linea.perfilId;
      if (!forecastByPerfil[pid]) {
        forecastByPerfil[pid] = {};
        for (let m = 1; m <= 12; m++) forecastByPerfil[pid][m] = 0;
      }
      for (const mes of linea.meses) {
        forecastByPerfil[pid][mes.month] += Number(mes.ftes);
      }
    }

    // 7. Assigned FTEs by perfil + resource costs by month
    const assignedByPerfil: Record<string, Record<number, number>> = {};
    const costByMonthARS: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) costByMonthARS[m] = 0;

    for (const asig of asignaciones) {
      const perfId = asig.recurso.perfil?.id;
      const baseCosto = Number(asig.recurso.costoMensual);
      const recursoId = asig.recurso.id;

      if (perfId && !assignedByPerfil[perfId]) {
        assignedByPerfil[perfId] = {};
        for (let m = 1; m <= 12; m++) assignedByPerfil[perfId][m] = 0;
      }

      for (const mes of asig.meses) {
        const pct = Number(mes.porcentajeAsignacion);
        if (pct === 0) continue;
        const fte = pct / 100;

        if (perfId) {
          assignedByPerfil[perfId][mes.month] += fte;
        }

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

    // 9. Compute per-month P&L
    const allPerfilIds = new Set([
      ...Object.keys(forecastByPerfil),
      ...Object.keys(assignedByPerfil),
    ]);

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

      let revForecast = 0;
      let revAsignado = 0;
      let revNoAsignado = 0;
      let ftesForecast = 0;
      let ftesAsignados = 0;

      for (const pid of allPerfilIds) {
        const fteFc = forecastByPerfil[pid]?.[m] || 0;
        const fteAs = assignedByPerfil[pid]?.[m] || 0;
        const rate = rateMap[pid] || 0;

        ftesForecast += fteFc;
        ftesAsignados += fteAs;

        revForecast += fteFc * rate;
        revAsignado += Math.min(fteAs, fteFc) * rate;
        revNoAsignado += Math.max(0, fteFc - fteAs) * rate;
      }

      // Costs: convert ARS -> USD using FX
      const costRecursos = fx > 0 ? costByMonthARS[m] / fx : 0;
      const costOtros = fx > 0 ? otrosCostosARS[m] / fx : 0;
      const costGuardias = fx > 0 ? guardiasARS[m] / fx : 0;
      const costTotal = costRecursos + costOtros + costGuardias;

      const ftesNoAsignados = Math.max(0, ftesForecast - ftesAsignados);
      const diffAmount = revAsignado - costTotal;

      // Nuevos indicadores de negocio
      const margenReal = revAsignado - costTotal;
      const margenPotencial = revForecast - costTotal;
      const cobertura = ftesForecast > 0 ? (ftesAsignados / ftesForecast) * 100 : null;

      meses[m] = {
        revenue: {
          forecast: round2(revForecast),
          asignado: round2(revAsignado),
          noAsignado: round2(revNoAsignado),
        },
        costos: {
          recursos: round2(costRecursos),
          otros: round2(costOtros),
          guardiasExtras: round2(costGuardias),
          total: round2(costTotal),
        },
        indicadores: {
          ftesForecast: round2(ftesForecast),
          ftesAsignados: round2(ftesAsignados),
          ftesNoAsignados: round2(ftesNoAsignados),
          diffAmount: round2(diffAmount),
          diffPct:
            revAsignado > 0
              ? round2((diffAmount / revAsignado) * 100)
              : null,
          gmPct:
            revAsignado > 0
              ? round2(((revAsignado - costTotal) / revAsignado) * 100)
              : null,
          blendRate:
            ftesAsignados > 0 ? round2(revAsignado / ftesAsignados) : null,
          blendCost:
            ftesAsignados > 0 ? round2(costRecursos / ftesAsignados) : null,
          // Nuevos indicadores
          margenReal: round2(margenReal),
          margenPotencial: round2(margenPotencial),
          cobertura: cobertura !== null ? round2(cobertura) : null,
        },
      };

      acc.revForecast += revForecast;
      acc.revAsignado += revAsignado;
      acc.revNoAsignado += revNoAsignado;
      acc.costRecursos += costRecursos;
      acc.costOtros += costOtros;
      acc.costGuardias += costGuardias;
      acc.costTotal += costTotal;
      acc.ftesForecast += ftesForecast;
      acc.ftesAsignados += ftesAsignados;
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
        // Nuevos indicadores
        margenReal: round2(margenRealAnual),
        margenPotencial: round2(margenPotencialAnual),
        cobertura: coberturaAnual !== null ? round2(coberturaAnual) : null,
      },
    };

    // 11. Calculate Estado del Proyecto (según modelo de negocio)
    const estadoProyecto = this.calcularEstadoProyecto(
      acc.revForecast,
      acc.revAsignado,
      acc.costTotal,
      margenRealAnual,
      margenPotencialAnual,
    );

    // 12. Calculate Análisis de Brecha
    const analisisBrecha: AnalisisBrechaAnual = {
      revenueSinStaffing: round2(acc.revNoAsignado),
      ftesFaltantes: round2(Math.max(0, avgFteForecast - avgFteAsignados)),
      margenSiSeCubre: round2(margenPotencialAnual),
      coberturaActual: coberturaAnual !== null ? round2(coberturaAnual) : null,
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
      estadoProyecto,
      analisisBrecha,
    };
  }

  /**
   * Calcula el estado del proyecto según el modelo de negocio.
   * Prioridad:
   * 1. INVIABLE: Margen potencial < 0 (nunca será rentable)
   * 2. SOBRE_ASIGNADO: Asignado > Forecast (puede ser oportunidad o desvío)
   * 3. EN_PERDIDA: Margen real < 0 Y Margen potencial >= 0 (necesita ajuste)
   * 4. SIN_CUBRIR: Asignado < Forecast Y Margen real >= 0 (hay oportunidad)
   * 5. CUBIERTO: Asignado >= Forecast Y Margen real >= 0 (proyecto saludable)
   */
  private calcularEstadoProyecto(
    revenueForecast: number,
    revenueAsignado: number,
    costosTotal: number,
    margenReal: number,
    margenPotencial: number,
  ): EstadoProyecto {
    // 🔴 INVIABLE: Nunca será rentable (margen potencial < 0)
    if (margenPotencial < 0) {
      return 'INVIABLE';
    }

    // 🔵 SOBRE_ASIGNADO: Más staffing del previsto
    if (revenueAsignado > revenueForecast) {
      return 'SOBRE_ASIGNADO';
    }

    // 🟠 EN_PERDIDA: Margen real negativo pero potencial positivo
    if (margenReal < 0 && margenPotencial >= 0) {
      return 'EN_PERDIDA';
    }

    // 🟡 SIN_CUBRIR: Revenue potencial sin staffing
    if (revenueAsignado < revenueForecast && margenReal >= 0) {
      return 'SIN_CUBRIR';
    }

    // 🟢 CUBIERTO: Proyecto saludable
    return 'CUBIERTO';
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
