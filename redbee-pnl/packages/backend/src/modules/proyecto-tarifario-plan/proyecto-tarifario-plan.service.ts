import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProyectoTarifarioPlanDto, AplicarTarifarioDto } from './dto';

@Injectable()
export class ProyectoTarifarioPlanService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get plan for proyecto + year
   */
  async getPlan(proyectoId: string, year: number) {
    // Validate year
    if (year < 2020 || year > 2050) {
      throw new BadRequestException('Year must be between 2020 and 2050');
    }

    // Verify proyecto exists
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id: proyectoId },
    });

    if (!proyecto) {
      throw new NotFoundException(`Proyecto with ID ${proyectoId} not found`);
    }

    // Find plan
    const plan = await this.prisma.proyectoTarifarioPlan.findFirst({
      where: {
        proyectoId,
        year,
      },
      include: {
        tarifario: {
          select: {
            id: true,
            nombre: true,
            moneda: true,
          },
        },
        lineas: {
          include: {
            lineaTarifario: {
              include: {
                perfil: {
                  select: {
                    id: true,
                    nombre: true,
                    categoria: true,
                    nivel: true,
                  },
                },
              },
            },
            meses: {
              orderBy: { month: 'asc' },
            },
          },
          orderBy: [
            { lineaTarifario: { perfil: { nombre: 'asc' } } },
          ],
        },
      },
    });

    if (!plan) {
      return null;
    }

    // Transform to DTO format
    return {
      id: plan.id,
      proyectoId: plan.proyectoId,
      tarifarioId: plan.tarifarioId,
      year: plan.year,
      tarifario: plan.tarifario,
      lineas: plan.lineas.map((linea) => ({
        id: linea.id,
        planId: linea.planId,
        lineaTarifarioId: linea.lineaTarifarioId,
        rateSnapshot: Number(linea.rateSnapshot),
        monedaSnapshot: linea.monedaSnapshot,
        perfil: linea.lineaTarifario.perfil,
        meses: linea.meses.map((mes) => ({
          month: mes.month,
          cantidad: Number(mes.cantidad),
          isOverride: mes.isOverride,
        })),
      })),
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }

  /**
   * Update or create plan
   */
  async updatePlan(
    proyectoId: string,
    year: number,
    dto: UpdateProyectoTarifarioPlanDto,
  ) {
    // Validate year
    if (year < 2020 || year > 2050) {
      throw new BadRequestException('Year must be between 2020 and 2050');
    }

    // Verify proyecto exists
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id: proyectoId },
    });

    if (!proyecto) {
      throw new NotFoundException(`Proyecto with ID ${proyectoId} not found`);
    }

    // Verify tarifario exists and get lineas
    const tarifario = await this.prisma.tarifario.findUnique({
      where: { id: dto.tarifarioId },
      include: {
        lineas: {
          include: {
            perfil: true,
          },
        },
      },
    });

    if (!tarifario) {
      throw new NotFoundException(`Tarifario with ID ${dto.tarifarioId} not found`);
    }

    // Find or create plan
    let plan = await this.prisma.proyectoTarifarioPlan.findFirst({
      where: {
        proyectoId,
        year,
      },
    });

    if (!plan) {
      // Create new plan
      plan = await this.prisma.proyectoTarifarioPlan.create({
        data: {
          proyectoId,
          tarifarioId: dto.tarifarioId,
          year,
        },
      });
    } else if (plan.tarifarioId !== dto.tarifarioId) {
      // If tarifario changed, update it
      plan = await this.prisma.proyectoTarifarioPlan.update({
        where: { id: plan.id },
        data: { tarifarioId: dto.tarifarioId },
      });
    }

    // Group meses by lineaTarifarioId
    const mesesByLinea = dto.meses.reduce((acc, mes) => {
      if (!acc[mes.lineaTarifarioId]) {
        acc[mes.lineaTarifarioId] = [];
      }
      acc[mes.lineaTarifarioId].push(mes);
      return acc;
    }, {} as Record<string, typeof dto.meses>);

    // Process each linea
    for (const [lineaTarifarioId, meses] of Object.entries(mesesByLinea)) {
      // Find matching linea from tarifario
      const tarifarioLinea = tarifario.lineas.find((l) => l.id === lineaTarifarioId);
      if (!tarifarioLinea) {
        throw new BadRequestException(`LineaTarifario with ID ${lineaTarifarioId} not found in tarifario`);
      }

      // Find or create plan linea
      let planLinea = await this.prisma.proyectoTarifarioPlanLinea.findUnique({
        where: {
          planId_lineaTarifarioId: {
            planId: plan.id,
            lineaTarifarioId,
          },
        },
      });

      if (!planLinea) {
        // Create plan linea with snapshot
        planLinea = await this.prisma.proyectoTarifarioPlanLinea.create({
          data: {
            planId: plan.id,
            lineaTarifarioId,
            rateSnapshot: tarifarioLinea.rate,
            monedaSnapshot: tarifarioLinea.moneda || tarifario.moneda,
          },
        });
      }

      // Upsert meses
      await Promise.all(
        meses.map((mes) =>
          this.prisma.proyectoTarifarioPlanMes.upsert({
            where: {
              lineaId_month: {
                lineaId: planLinea.id,
                month: mes.month,
              },
            },
            update: {
              cantidad: mes.cantidad,
              isOverride: mes.isOverride,
            },
            create: {
              lineaId: planLinea.id,
              month: mes.month,
              cantidad: mes.cantidad,
              isOverride: mes.isOverride,
            },
          }),
        ),
      );
    }

    // Return updated plan
    return this.getPlan(proyectoId, year);
  }

  /**
   * Apply tarifario - creates plan structure from current month to Dec
   */
  async aplicarTarifario(
    proyectoId: string,
    year: number,
    dto: AplicarTarifarioDto,
  ) {
    // Validate year
    if (year < 2020 || year > 2050) {
      throw new BadRequestException('Year must be between 2020 and 2050');
    }

    // Verify proyecto exists
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id: proyectoId },
    });

    if (!proyecto) {
      throw new NotFoundException(`Proyecto with ID ${proyectoId} not found`);
    }

    // Verify tarifario exists and get lineas
    const tarifario = await this.prisma.tarifario.findUnique({
      where: { id: dto.tarifarioId },
      include: {
        lineas: {
          include: {
            perfil: true,
          },
        },
      },
    });

    if (!tarifario) {
      throw new NotFoundException(`Tarifario with ID ${dto.tarifarioId} not found`);
    }

    // Get current month
    const currentMonth = new Date().getMonth() + 1; // 1-12

    // Create or update plan
    let plan = await this.prisma.proyectoTarifarioPlan.findFirst({
      where: {
        proyectoId,
        year,
      },
    });

    if (!plan) {
      plan = await this.prisma.proyectoTarifarioPlan.create({
        data: {
          proyectoId,
          tarifarioId: dto.tarifarioId,
          year,
        },
      });
    } else {
      // Update tarifario if different
      if (plan.tarifarioId !== dto.tarifarioId) {
        plan = await this.prisma.proyectoTarifarioPlan.update({
          where: { id: plan.id },
          data: { tarifarioId: dto.tarifarioId },
        });
      }
    }

    // For each linea in tarifario, create plan linea and meses from current month to 12
    for (const tarifarioLinea of tarifario.lineas) {
      // Create or get plan linea
      let planLinea = await this.prisma.proyectoTarifarioPlanLinea.findUnique({
        where: {
          planId_lineaTarifarioId: {
            planId: plan.id,
            lineaTarifarioId: tarifarioLinea.id,
          },
        },
      });

      if (!planLinea) {
        planLinea = await this.prisma.proyectoTarifarioPlanLinea.create({
          data: {
            planId: plan.id,
            lineaTarifarioId: tarifarioLinea.id,
            rateSnapshot: tarifarioLinea.rate,
            monedaSnapshot: tarifarioLinea.moneda || tarifario.moneda,
          },
        });
      }

      // Create meses from current month to December with cantidad = 0
      const mesesToCreate = [];
      for (let month = currentMonth; month <= 12; month++) {
        mesesToCreate.push({
          lineaId: planLinea.id,
          month,
          cantidad: 0,
          isOverride: false,
        });
      }

      // Upsert (create if not exists, skip if exists)
      await Promise.all(
        mesesToCreate.map((mes) =>
          this.prisma.proyectoTarifarioPlanMes.upsert({
            where: {
              lineaId_month: {
                lineaId: mes.lineaId,
                month: mes.month,
              },
            },
            update: {}, // Don't update if exists
            create: mes,
          }),
        ),
      );
    }

    // Return plan
    return this.getPlan(proyectoId, year);
  }
}
