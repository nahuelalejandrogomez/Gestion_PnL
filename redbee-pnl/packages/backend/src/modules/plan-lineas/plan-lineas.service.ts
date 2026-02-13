import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertPlanLineasDto } from './dto/upsert-plan-lineas.dto';
import { determineMonthCoverageStatus } from '../pnl/helpers/coverage-any-match.helper';

type EstadoCobertura = 'CUBIERTO' | 'PARCIAL' | 'SIN_ASIGNAR' | 'SOBRE_ASIGNADO';

interface CoberturaMes {
  ftesAsignados: number;
  porcentajeCobertura: number | null; // null si forecast = 0
  estado: EstadoCobertura;
}

interface PlanLineaResponse {
  id: string;
  perfilId: string;
  perfilNombre: string;
  perfilCategoria: string;
  perfilNivel: string | null;
  nombreLinea: string | null;
  meses: Record<number, number>; // month -> ftes forecast
  total: number; // sum of all months
  cobertura: Record<number, CoberturaMes>; // month -> cobertura info
}

export interface GetPlanLineasResponse {
  proyectoId: string;
  year: number;
  lineas: PlanLineaResponse[];
}

@Injectable()
export class PlanLineasService {
  constructor(private prisma: PrismaService) {}

  async getPlanLineas(proyectoId: string, year: number): Promise<GetPlanLineasResponse> {
    // Verify proyecto exists
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id: proyectoId },
      select: { id: true, deletedAt: true },
    });

    if (!proyecto || proyecto.deletedAt) {
      throw new NotFoundException(`Proyecto con ID ${proyectoId} no encontrado`);
    }

    // Get all plan lineas for this proyecto
    // IMPORTANTE: Orden estable para asignación distribuida (createdAt + id)
    const lineas = await this.prisma.proyectoPlanLinea.findMany({
      where: {
        proyectoId,
        deletedAt: null,
      },
      include: {
        perfil: {
          select: {
            id: true,
            nombre: true,
            categoria: true,
            nivel: true,
          },
        },
        meses: {
          where: { year },
        },
      },
      orderBy: [
        { createdAt: 'asc' },
        { id: 'asc' },
      ],
    });

    // Get asignaciones for this proyecto to calculate cobertura
    const asignaciones = await this.prisma.asignacionRecurso.findMany({
      where: { proyectoId },
      include: {
        meses: { where: { year } },
      },
    });

    // ============================================================================
    // NUEVA LÓGICA: Coverage ANY Match (sin distinción por perfil/seniority)
    // ============================================================================
    // Build map: month -> total FTEs asignados (ANY perfil/seniority)
    const asignadosByMonth: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) asignadosByMonth[m] = 0;

    for (const asig of asignaciones) {
      for (const mes of asig.meses) {
        const pct = Number(mes.porcentajeAsignacion);
        if (pct === 0) continue;
        const fte = pct / 100;
        asignadosByMonth[mes.month] += fte;
      }
    }

    // Build map: month -> total FTEs forecast (suma de todas las líneas del mes)
    const forecastByMonth: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) forecastByMonth[m] = 0;

    for (const linea of lineas) {
      for (const mes of linea.meses) {
        forecastByMonth[mes.month] += Number(mes.ftes);
      }
    }

    // ============================================================================
    // ASIGNACIÓN DISTRIBUIDA: Distribuir FTEs asignados a líneas en orden
    // ============================================================================
    // Por cada mes, distribuir los FTEs asignados a las líneas en orden (createdAt)
    // Esto permite que cada línea tenga su propia cobertura (verde/amarillo/rojo)
    // según cuántos FTEs le "tocaron" en la distribución.

    // Map: lineId -> month -> lineAssignedEquivalent
    const lineAssignedByMonth: Record<string, Record<number, number>> = {};

    for (let month = 1; month <= 12; month++) {
      let assignedRemaining = asignadosByMonth[month];

      // Distribuir en orden de createdAt (orden estable)
      for (const linea of lineas) {
        if (!lineAssignedByMonth[linea.id]) {
          lineAssignedByMonth[linea.id] = {};
        }

        const mesData = linea.meses.find((m) => m.month === month);
        const lineForecast = mesData ? Number(mesData.ftes) : 0;

        // Asignar lo que se pueda cubrir de esta línea
        const lineAssignedEquivalent = Math.min(lineForecast, assignedRemaining);
        lineAssignedByMonth[linea.id][month] = lineAssignedEquivalent;

        // Restar del remaining
        assignedRemaining -= lineAssignedEquivalent;

        if (assignedRemaining < 0.0001) {
          assignedRemaining = 0; // Evitar errores de floating point
        }
      }
    }

    // Transform to response format with cobertura distribuida
    const lineasResponse: PlanLineaResponse[] = lineas.map((linea) => {
      const meses: Record<number, number> = {};
      const cobertura: Record<number, CoberturaMes> = {};
      let total = 0;

      // Fill meses 1-12 with forecast and cobertura
      for (let month = 1; month <= 12; month++) {
        const mesData = linea.meses.find((m) => m.month === month);
        const lineForecast = mesData ? Number(mesData.ftes) : 0;
        meses[month] = lineForecast;
        total += lineForecast;

        // Cobertura de ESTA LÍNEA (usando asignación distribuida)
        const lineAssignedEquivalent = lineAssignedByMonth[linea.id]?.[month] || 0;
        const coverageRatio =
          lineForecast > 0 ? lineAssignedEquivalent / lineForecast : 0;
        const porcentaje = coverageRatio > 0 ? coverageRatio * 100 : null;
        const estado = determineMonthCoverageStatus(lineForecast, coverageRatio);

        cobertura[month] = {
          ftesAsignados: Math.round(lineAssignedEquivalent * 100) / 100,
          porcentajeCobertura:
            porcentaje !== null ? Math.round(porcentaje * 100) / 100 : null,
          estado,
        };
      }

      return {
        id: linea.id,
        perfilId: linea.perfilId,
        perfilNombre: linea.perfil.nombre,
        perfilCategoria: linea.perfil.categoria,
        perfilNivel: linea.perfil.nivel,
        nombreLinea: linea.nombreLinea,
        meses,
        total: Math.round(total * 100) / 100,
        cobertura,
      };
    });

    return {
      proyectoId,
      year,
      lineas: lineasResponse,
    };
  }

  async upsertPlanLineas(
    proyectoId: string,
    dto: UpsertPlanLineasDto,
  ): Promise<{ success: boolean; updated: number }> {
    // Verify proyecto exists and get current tarifario
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id: proyectoId },
      select: { id: true, deletedAt: true, tarifarioRevenuePlanId: true },
    });

    if (!proyecto || proyecto.deletedAt) {
      throw new NotFoundException(`Proyecto con ID ${proyectoId} no encontrado`);
    }

    await this.prisma.$transaction(async (tx) => {
      // 0. Detect tarifario change and clear year if needed
      const tarifarioChanged = dto.tarifarioId && dto.tarifarioId !== proyecto.tarifarioRevenuePlanId;

      if (tarifarioChanged) {
        // Tarifario changed: clear ALL lines for this year (hard delete for clean slate)
        // This ensures "Aplicar tarifario" is idempotent per (proyectoId, year, tarifarioId)
        const existingLineas = await tx.proyectoPlanLinea.findMany({
          where: { proyectoId, deletedAt: null },
          select: { id: true },
        });

        if (existingLineas.length > 0) {
          const lineaIds = existingLineas.map(l => l.id);

          // Delete associated meses first (foreign key constraint)
          await tx.proyectoPlanLineaMes.deleteMany({
            where: { planLineaId: { in: lineaIds }, year: dto.year },
          });

          // Soft delete the lineas for the year
          await tx.proyectoPlanLinea.updateMany({
            where: { id: { in: lineaIds }, proyectoId },
            data: { deletedAt: new Date() },
          });
        }

        // Update tarifario reference
        await tx.proyecto.update({
          where: { id: proyectoId },
          data: { tarifarioRevenuePlanId: dto.tarifarioId },
        });
      } else if (dto.tarifarioId && !proyecto.tarifarioRevenuePlanId) {
        // First time applying a tarifario
        await tx.proyecto.update({
          where: { id: proyectoId },
          data: { tarifarioRevenuePlanId: dto.tarifarioId },
        });
      }

      // 1. Delete marked lineas (soft delete) - only for manual deletions
      if (dto.deletedLineaIds && dto.deletedLineaIds.length > 0) {
        await tx.proyectoPlanLinea.updateMany({
          where: {
            id: { in: dto.deletedLineaIds },
            proyectoId,
          },
          data: {
            deletedAt: new Date(),
          },
        });
      }

      // 2. Upsert lineas and meses
      for (const lineaDto of dto.lineas) {
        let lineaId: string;

        if (lineaDto.id) {
          // Update existing linea
          const updated = await tx.proyectoPlanLinea.update({
            where: { id: lineaDto.id },
            data: {
              perfilId: lineaDto.perfilId,
              nombreLinea: lineaDto.nombreLinea,
            },
          });
          lineaId = updated.id;
        } else {
          // Create new linea
          const created = await tx.proyectoPlanLinea.create({
            data: {
              proyectoId,
              perfilId: lineaDto.perfilId,
              nombreLinea: lineaDto.nombreLinea,
            },
          });
          lineaId = created.id;
        }

        // Upsert meses
        for (const mesDto of lineaDto.meses) {
          await tx.proyectoPlanLineaMes.upsert({
            where: {
              planLineaId_year_month: {
                planLineaId: lineaId,
                year: dto.year,
                month: mesDto.month,
              },
            },
            update: {
              ftes: mesDto.ftes,
            },
            create: {
              planLineaId: lineaId,
              year: dto.year,
              month: mesDto.month,
              ftes: mesDto.ftes,
            },
          });
        }
      }
    });

    return {
      success: true,
      updated: dto.lineas.length,
    };
  }

  async deletePlanLineas(
    proyectoId: string,
    year: number,
  ): Promise<{ ok: boolean; deletedLines: number; deletedCells: number }> {
    // Verify proyecto exists
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id: proyectoId },
      select: { id: true, deletedAt: true },
    });

    if (!proyecto || proyecto.deletedAt) {
      throw new NotFoundException(`Proyecto con ID ${proyectoId} no encontrado`);
    }

    let deletedLines = 0;
    let deletedCells = 0;

    await this.prisma.$transaction(async (tx) => {
      // Get all plan lineas for this proyecto (not deleted)
      const lineas = await tx.proyectoPlanLinea.findMany({
        where: { proyectoId, deletedAt: null },
        select: { id: true },
      });

      if (lineas.length === 0) {
        // No plan exists - idempotent operation
        return;
      }

      const lineaIds = lineas.map(l => l.id);

      // Delete all meses for this year (hard delete)
      const deletedMesesResult = await tx.proyectoPlanLineaMes.deleteMany({
        where: {
          planLineaId: { in: lineaIds },
          year,
        },
      });
      deletedCells = deletedMesesResult.count;

      // Soft delete all lineas (regardless of year, clean slate)
      const deletedLineasResult = await tx.proyectoPlanLinea.updateMany({
        where: {
          id: { in: lineaIds },
          proyectoId,
        },
        data: {
          deletedAt: new Date(),
        },
      });
      deletedLines = deletedLineasResult.count;

      // Clear tarifario reference if exists
      await tx.proyecto.update({
        where: { id: proyectoId },
        data: { tarifarioRevenuePlanId: null },
      });
    });

    return {
      ok: true,
      deletedLines,
      deletedCells,
    };
  }
}
