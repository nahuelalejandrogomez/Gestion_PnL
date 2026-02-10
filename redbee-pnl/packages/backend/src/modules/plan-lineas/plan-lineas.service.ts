import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertPlanLineasDto } from './dto/upsert-plan-lineas.dto';

interface PlanLineaResponse {
  id: string;
  perfilId: string;
  perfilNombre: string;
  perfilCategoria: string;
  nombreLinea: string | null;
  meses: Record<number, number>; // month -> ftes
  total: number; // sum of all months
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

    // Transform to response format
    const lineasResponse: PlanLineaResponse[] = lineas.map((linea) => {
      const meses: Record<number, number> = {};
      let total = 0;

      // Fill meses 1-12
      for (let month = 1; month <= 12; month++) {
        const mesData = linea.meses.find((m) => m.month === month);
        const ftes = mesData ? Number(mesData.ftes) : 0;
        meses[month] = ftes;
        total += ftes;
      }

      return {
        id: linea.id,
        perfilId: linea.perfilId,
        perfilNombre: linea.perfil.nombre,
        perfilCategoria: linea.perfil.categoria,
        nombreLinea: linea.nombreLinea,
        meses,
        total: Math.round(total * 100) / 100,
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
