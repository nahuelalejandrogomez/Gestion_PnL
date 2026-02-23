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
  ftesNoAsignados: number; // Dif. FTEs = Forecast - Asignado (con signo: + si falta, - si sobra)
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
        select: {
          id: true,
          porcentajeAsignacion: true,
          fechaDesde: true,
          fechaHasta: true,
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
      const monedaCosto = asig.recurso.monedaCosto; // 'ARS' | 'USD'
      const recursoId = asig.recurso.id;
      const basePct = Number(asig.porcentajeAsignacion);

      // Construir mapa de meses con datos reales del planner
      const mesPlannerMap = new Map(asig.meses.map((m) => [m.month, m]));

      for (let m = 1; m <= 12; m++) {
        let pct: number;

        if (mesPlannerMap.has(m)) {
          // Caso 1: Hay datos en el Allocation Planner → usar el % mensual
          pct = Number(mesPlannerMap.get(m)!.porcentajeAsignacion);
        } else {
          // Caso 2: Sin datos en planner → fallback al % base de la asignación
          // Solo si el mes cae dentro del rango fechaDesde-fechaHasta
          const fechaDelMes = new Date(year, m - 1, 1); // Primer día del mes
          const finDelMes = new Date(year, m, 0);        // Último día del mes
          const desde = new Date(asig.fechaDesde);
          const hasta = asig.fechaHasta ? new Date(asig.fechaHasta) : null;

          const mesActivo =
            desde <= finDelMes && (hasta === null || hasta >= fechaDelMes);

          pct = mesActivo ? basePct : 0;
        }

        if (pct === 0) continue;

        // Sumar FTE asignado (ANY, sin importar perfil)
        assignedByMonth[m] += pct / 100;

        // Costo nativo del recurso (en su moneda original: ARS o USD)
        const costNative = salaryOverrides[recursoId]?.[m] ?? baseCosto;

        // Convertir a ARS (igual que el Planner: si USD → multiply by FX)
        let costArs: number;
        if (monedaCosto === 'USD') {
          const fx = fxMap[m];
          costArs = fx && fx > 0 ? costNative * fx : 0;
        } else {
          costArs = costNative;
        }

        // Aplicar overhead de empresa (igual que el Planner: costoBase * (1 + pct/100))
        const costWithOverhead = costArs * (1 + costoEmpresaPct / 100);

        // Acumular en ARS (se convierte a USD más adelante con /fx)
        costByMonthARS[m] += costWithOverhead * (pct / 100);
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
      
      // E) NUEVA LÓGICA: Dif. FTEs Fcst vs Asig con SIGNO
      // Positivo si falta (Forecast > Asignado)
      // Negativo si sobra (Asignado > Forecast)
      // Fórmula: Forecast - Asignado
      const difFtes = fteForecast - fteAssigned;

      // Costs: convert ARS -> USD using FX
      const costRecursos = fx > 0 ? costByMonthARS[m] / fx : 0;
      const costOtros = fx > 0 ? otrosCostosARS[m] / fx : 0;
      const costGuardias = fx > 0 ? guardiasARS[m] / fx : 0;
      const costTotal = costRecursos + costOtros + costGuardias;

      const diffAmount = assignedRevenue - costTotal;

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
          // Dif. FTEs con signo: positivo si falta, negativo si sobra
          ftesNoAsignados: round2(difFtes),
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

    // 10. Annual totals
    const annualDiff = acc.revAsignado - acc.costTotal;

    // A) FTEs: SUMA anual (no promedio)
    // Regla: Total anual = suma de ene a dic (meses vacíos = 0)
    const totalFtesForecast = acc.ftesForecast; // Ya es suma
    const totalFtesAsignados = acc.ftesAsignados; // Ya es suma
    const totalFtesNoAsignados = totalFtesForecast - totalFtesAsignados;

    // B) Blend Rate y Blend Cost: PROMEDIO de meses con valor
    // Regla: Promedio simple de meses donde hay número, ignorar meses vacíos
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

    const avgBlendRate = countBlendRate > 0 ? sumBlendRate / countBlendRate : null;
    const avgBlendCost = countBlendCost > 0 ? sumBlendCost / countBlendCost : null;

    // C) GM%: RECALCULAR con valores anuales
    // Regla: GM% anual = (Revenue anual - Costos anuales) / Revenue anual
    // No promediar porcentajes mensuales
    const gmPctAnual = acc.revAsignado > 0
      ? ((acc.revAsignado - acc.costTotal) / acc.revAsignado) * 100
      : null;

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
        // A) FTEs: Suma anual (no promedio)
        ftesForecast: round2(totalFtesForecast),
        ftesAsignados: round2(totalFtesAsignados),
        ftesNoAsignados: round2(totalFtesNoAsignados),
        diffAmount: round2(annualDiff),
        diffPct:
          acc.revAsignado > 0
            ? round2((annualDiff / acc.revAsignado) * 100)
            : null,
        // C) GM%: Recalculado con valores anuales (no promedio de meses)
        gmPct: gmPctAnual !== null ? round2(gmPctAnual) : null,
        // B) Blend Rate/Cost: Promedio de meses con valor
        blendRate: avgBlendRate !== null ? round2(avgBlendRate) : null,
        blendCost: avgBlendCost !== null ? round2(avgBlendCost) : null,
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

  /**
   * Calcula P&L consolidado para un cliente, sumando todos sus proyectos activos
   */
  async calculateClientePnlYear(
    clienteId: string,
    year: number,
  ): Promise<PnlYearResult> {
    // 1. Obtener cliente y validar
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { id: true, nombre: true, deletedAt: true },
    });

    if (!cliente || cliente.deletedAt) {
      throw new NotFoundException(
        `Cliente con ID ${clienteId} no encontrado`,
      );
    }

    // 2. Obtener todos los proyectos activos del cliente
    const proyectos = await this.prisma.proyecto.findMany({
      where: {
        clienteId,
        deletedAt: null,
        estado: { not: 'CERRADO' },
      },
      select: { id: true, nombre: true },
    });

    // Si no hay proyectos, retornar P&L vacío
    if (proyectos.length === 0) {
      return this.createEmptyPnlYear(clienteId, cliente.nombre, year);
    }

    // 3. Obtener P&L de cada proyecto
    const pnlProyectos = await Promise.all(
      proyectos.map((p) => this.calculatePnlYear(p.id, year)),
    );

    // 4. Consolidar (sumar) todos los P&L
    const pnlConsolidado = this.consolidatePnls(pnlProyectos, clienteId, cliente.nombre, year);

    // 5. Mezclar datos reales ingresados manualmente
    return this.mixRealDataIntoMonths(pnlConsolidado, clienteId, year);
  }

  /**
   * Crea un P&L vacío (todos los valores en 0)
   */
  private createEmptyPnlYear(
    entityId: string,
    entityName: string,
    year: number,
  ): PnlYearResult {
    const emptyMonth: PnlMonthData = {
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

    const meses: Record<number, PnlMonthData> = {};
    for (let m = 1; m <= 12; m++) {
      meses[m] = { ...emptyMonth };
    }

    const emptyIndicadores: IndicadoresNegocio = {
      ftePotencial: 0,
      fte: 0,
      fcstRevPot: 0,
      fcstRev: 0,
      revenue: 0,
      difEstimacionRev: 0,
      forecastCostPot: 0,
      forecastCostos: 0,
      costosDirectos: 0,
      difEstimacionCD: 0,
      laborMargin: null,
      costosIndirectos: 0,
      costosTotales: 0,
      grossProject: null,
      blendRate: null,
      blendCost: null,
    };

    return {
      proyectoId: entityId,
      proyectoNombre: entityName,
      year,
      monedaTarifario: 'USD',
      costoEmpresaPct: 45,
      fxRates: {},
      meses,
      totalesAnuales: { ...emptyMonth },
      indicadoresNegocio: emptyIndicadores,
    };
  }

  /**
   * Consolida múltiples P&Ls de proyectos en uno solo
   */
  private consolidatePnls(
    pnls: PnlYearResult[],
    entityId: string,
    entityName: string,
    year: number,
  ): PnlYearResult {
    // Inicializar acumuladores mensuales
    const meses: Record<number, PnlMonthData> = {};
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

    // Acumuladores anuales
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

    // Sumar valores de cada proyecto
    for (const pnl of pnls) {
      for (let m = 1; m <= 12; m++) {
        const monthData = pnl.meses[m];
        meses[m].revenue.forecast += monthData.revenue.forecast;
        meses[m].revenue.asignado += monthData.revenue.asignado;
        meses[m].revenue.noAsignado += monthData.revenue.noAsignado;
        meses[m].costos.recursos += monthData.costos.recursos;
        meses[m].costos.otros += monthData.costos.otros;
        meses[m].costos.guardiasExtras += monthData.costos.guardiasExtras;
        meses[m].costos.total += monthData.costos.total;
        meses[m].indicadores.ftesForecast += monthData.indicadores.ftesForecast;
        meses[m].indicadores.ftesAsignados +=
          monthData.indicadores.ftesAsignados;
        meses[m].indicadores.ftesNoAsignados +=
          monthData.indicadores.ftesNoAsignados;
        meses[m].indicadores.diffAmount += monthData.indicadores.diffAmount;
      }

      // Sumar totales anuales
      acc.revForecast += pnl.totalesAnuales.revenue.forecast;
      acc.revAsignado += pnl.totalesAnuales.revenue.asignado;
      acc.revNoAsignado += pnl.totalesAnuales.revenue.noAsignado;
      acc.costRecursos += pnl.totalesAnuales.costos.recursos;
      acc.costOtros += pnl.totalesAnuales.costos.otros;
      acc.costGuardias += pnl.totalesAnuales.costos.guardiasExtras;
      acc.costTotal += pnl.totalesAnuales.costos.total;
      acc.ftesForecast += pnl.totalesAnuales.indicadores.ftesForecast;
      acc.ftesAsignados += pnl.totalesAnuales.indicadores.ftesAsignados;
    }

    // Recalcular indicadores mensuales derivados
    for (let m = 1; m <= 12; m++) {
      const month = meses[m];
      const rev = month.revenue.asignado;
      const cost = month.costos.total;

      month.indicadores.diffPct = rev > 0 ? round2((month.indicadores.diffAmount / rev) * 100) : null;
      month.indicadores.gmPct = rev > 0 ? round2(((rev - cost) / rev) * 100) : null;

      // Blend Rate/Cost mensual: promedio ponderado
      // Solo calcular si hay FTEs asignados
      if (month.indicadores.ftesAsignados > 0) {
        month.indicadores.blendRate = round2(rev / month.indicadores.ftesAsignados);
        month.indicadores.blendCost = round2(month.costos.recursos / month.indicadores.ftesAsignados);
      }
    }

    // Calcular totales anuales consolidados
    const totalFtesNoAsignados = acc.ftesForecast - acc.ftesAsignados;
    const annualDiff = acc.revAsignado - acc.costTotal;

    // Blend Rate/Cost anual: promedio de meses con valor
    let sumBlendRate = 0;
    let countBlendRate = 0;
    let sumBlendCost = 0;
    let countBlendCost = 0;

    for (let m = 1; m <= 12; m++) {
      if (meses[m].indicadores.blendRate !== null) {
        sumBlendRate += meses[m].indicadores.blendRate!;
        countBlendRate++;
      }
      if (meses[m].indicadores.blendCost !== null) {
        sumBlendCost += meses[m].indicadores.blendCost!;
        countBlendCost++;
      }
    }

    const avgBlendRate = countBlendRate > 0 ? sumBlendRate / countBlendRate : null;
    const avgBlendCost = countBlendCost > 0 ? sumBlendCost / countBlendCost : null;

    const gmPctAnual = acc.revAsignado > 0
      ? ((acc.revAsignado - acc.costTotal) / acc.revAsignado) * 100
      : null;

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
        ftesForecast: round2(acc.ftesForecast),
        ftesAsignados: round2(acc.ftesAsignados),
        ftesNoAsignados: round2(totalFtesNoAsignados),
        diffAmount: round2(annualDiff),
        diffPct: acc.revAsignado > 0 ? round2((annualDiff / acc.revAsignado) * 100) : null,
        gmPct: gmPctAnual !== null ? round2(gmPctAnual) : null,
        blendRate: avgBlendRate !== null ? round2(avgBlendRate) : null,
        blendCost: avgBlendCost !== null ? round2(avgBlendCost) : null,
      },
    };

    // Calcular indicadores de negocio consolidados
    const costosDirectos = acc.costRecursos + acc.costGuardias;
    const costosIndirectos = acc.costOtros;
    const costosTotales = costosDirectos + costosIndirectos;
    const fteAnual = acc.ftesAsignados;

    const indicadoresNegocio: IndicadoresNegocio = {
      ftePotencial: 0,
      fte: round2(fteAnual),
      fcstRevPot: 0,
      fcstRev: round2(acc.revForecast),
      revenue: round2(acc.revAsignado),
      difEstimacionRev: round2(acc.revNoAsignado),
      forecastCostPot: 0,
      forecastCostos: 0,
      costosDirectos: round2(costosDirectos),
      difEstimacionCD: 0,
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

    // FX rates: usar las del primer proyecto (asumiendo USD)
    const fxRates = pnls.length > 0 ? pnls[0].fxRates : {};

    return {
      proyectoId: entityId,
      proyectoNombre: entityName,
      year,
      monedaTarifario: 'USD',
      costoEmpresaPct: pnls.length > 0 ? pnls[0].costoEmpresaPct : 45,
      fxRates,
      meses,
      totalesAnuales,
      indicadoresNegocio,
    };
  }

  /**
   * Mezcla datos reales ingresados manualmente en el P&L del cliente
   * Agrega campos de datos reales sin sobrescribir los proyectados
   */
  private async mixRealDataIntoMonths(
    pnl: PnlYearResult,
    clienteId: string,
    year: number,
  ): Promise<PnlYearResult> {
    // 1. Fetch todos los datos reales del cliente para este año
    const realData = await this.prisma.clientePnlMesReal.findMany({
      where: { clienteId, year },
    });

    // Si no hay datos reales, retornar el P&L sin cambios
    if (realData.length === 0) {
      (pnl as any).hasRealData = false;
      return pnl;
    }

    // Marcar que hay datos reales
    (pnl as any).hasRealData = true;

    // 2. Crear un mapa mes -> datos reales
    const realMap: Record<number, typeof realData[0]> = {};
    for (const r of realData) {
      realMap[r.month] = r;
    }

    // 3. Por cada mes, agregar datos reales como campos separados
    for (let m = 1; m <= 12; m++) {
      const real = realMap[m];
      const month: any = pnl.meses[m];

      if (real) {
        // Agregar datos reales como campos separados
        month.revenueReal = real.revenueReal ? Number(real.revenueReal) : null;
        month.recursosReales = real.recursosReales ? Number(real.recursosReales) : null;
        month.otrosReales = real.otrosReales ? Number(real.otrosReales) : null;
        month.ftesReales = real.ftesReales ? Number(real.ftesReales) : null;
      } else {
        // No hay datos reales este mes
        month.revenueReal = null;
        month.recursosReales = null;
        month.otrosReales = null;
        month.ftesReales = null;
      }
    }

    // Los totales anuales no se modifican - se mantienen basados en datos proyectados
    // El frontend decidirá cómo mostrar y calcular totales con datos reales
    return pnl;
  }
}
