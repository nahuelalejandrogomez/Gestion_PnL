import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertPlanLineasDto } from './dto/upsert-plan-lineas.dto';

type EstadoCobertura = 'CUBIERTO' | 'PARCIAL' | 'SIN_ASIGNAR';

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
        { perfil: { nombre: 'asc' } },
        { nombreLinea: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    // Get asignaciones for this proyecto to calculate cobertura
    const asignaciones = await this.prisma.asignacionRecurso.findMany({
      where: { proyectoId },
      include: {
        recurso: {
          select: {
            perfil: { select: { id: true, nivel: true } },
          },
        },
        meses: { where: { year } },
      },
    });

    // Build map: perfilId|nivel -> month -> total FTEs asignados
    // Use composite key to distinguish seniority levels (BA JR vs BA SSR vs BA SR)
    const asignadosByPerfil: Record<string, Record<number, number>> = {};
    for (const asig of asignaciones) {
      const perfilId = asig.recurso.perfil?.id;
      const nivel = asig.recurso.perfil?.nivel;
      if (!perfilId) continue;

      // Composite key: perfilId|nivel (handle null nivel as 'null')
      const key = `${perfilId}|${nivel || 'null'}`;

      if (!asignadosByPerfil[key]) {
        asignadosByPerfil[key] = {};
        for (let m = 1; m <= 12; m++) asignadosByPerfil[key][m] = 0;
      }

      for (const mes of asig.meses) {
        const pct = Number(mes.porcentajeAsignacion);
        if (pct === 0) continue;
        const fte = pct / 100;
        asignadosByPerfil[key][mes.month] += fte;
      }
    }

    // Helper: determinar estado de cobertura
    const determinarEstado = (forecast: number, asignado: number): EstadoCobertura => {
      if (forecast === 0) return 'SIN_ASIGNAR';
      if (asignado === 0) return 'SIN_ASIGNAR';
      if (asignado >= forecast) return 'CUBIERTO';
      return 'PARCIAL';
    };

    // Transform to response format with cobertura
    const lineasResponse: PlanLineaResponse[] = lineas.map((linea) => {
      const meses: Record<number, number> = {};
      const cobertura: Record<number, CoberturaMes> = {};
      let total = 0;

      // Fill meses 1-12 with forecast and cobertura
      for (let month = 1; month <= 12; month++) {
        const mesData = linea.meses.find((m) => m.month === month);
        const ftesForecast = mesData ? Number(mesData.ftes) : 0;
        meses[month] = ftesForecast;
        total += ftesForecast;

        // Calculate cobertura for this perfil/month using composite key
        const key = `${linea.perfilId}|${linea.perfil.nivel || 'null'}`;
        const ftesAsignados = asignadosByPerfil[key]?.[month] || 0;
        const porcentaje = ftesForecast > 0 ? (ftesAsignados / ftesForecast) * 100 : null;
        const estado = determinarEstado(ftesForecast, ftesAsignados);

        cobertura[month] = {
          ftesAsignados: Math.round(ftesAsignados * 100) / 100,
          porcentajeCobertura: porcentaje !== null ? Math.round(porcentaje * 100) / 100 : null,
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
    // Verify proyecto exists
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id: proyectoId },
      select: { id: true, deletedAt: true },
    });

    if (!proyecto || proyecto.deletedAt) {
      throw new NotFoundException(`Proyecto con ID ${proyectoId} no encontrado`);
    }

    await this.prisma.$transaction(async (tx) => {
      // 0. Update proyecto.tarifarioRevenuePlanId if tarifarioId provided
      if (dto.tarifarioId) {
        await tx.proyecto.update({
          where: { id: proyectoId },
          data: { tarifarioRevenuePlanId: dto.tarifarioId },
        });
      }

      // 1. Delete marked lineas (soft delete)
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
}
