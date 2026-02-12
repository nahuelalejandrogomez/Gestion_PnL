import { Injectable, NotFoundException, BadRequestException, UnprocessableEntityException } from '@nestjs/common';
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
            fechaVigenciaDesde: true,
            fechaVigenciaHasta: true,
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
        rateSnapshot: Number(linea.rateSnapshot) || 0,
        monedaSnapshot: linea.monedaSnapshot,
        perfil: linea.lineaTarifario.perfil,
        meses: linea.meses.map((mes) => ({
          month: mes.month,
          cantidad: Number(mes.cantidad) || 0,
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
      // Find matching linea from tarifario - try by ID first
      let tarifarioLinea = tarifario.lineas.find((l) => l.id === lineaTarifarioId);

      // If not found, try to reconcile by perfilId
      if (!tarifarioLinea && meses[0]?.perfilId) {
        const perfilId = meses[0].perfilId;
        tarifarioLinea = tarifario.lineas.find((l) => l.perfilId === perfilId);

        if (tarifarioLinea) {
          // Reconciled - log for awareness
          console.log(`[updatePlan] Reconciled lineaTarifarioId ${lineaTarifarioId} -> ${tarifarioLinea.id} via perfilId ${perfilId}`);
        }
      }

      // If still not found, return 422
      if (!tarifarioLinea) {
        const perfilId = meses[0]?.perfilId;
        throw new UnprocessableEntityException(
          `Línea del tarifario no encontrada (ID: ${lineaTarifarioId}${perfilId ? `, perfil: ${perfilId}` : ''}). ` +
          `El tarifario pudo haber cambiado. Re-aplicá el tarifario o refrescá la página.`
        );
      }

      // Use reconciled ID if different
      const reconciledLineaTarifarioId = tarifarioLinea.id;

      // Find or create plan linea
      let planLinea = await this.prisma.proyectoTarifarioPlanLinea.findUnique({
        where: {
          planId_lineaTarifarioId: {
            planId: plan.id,
            lineaTarifarioId: reconciledLineaTarifarioId,
          },
        },
      });

      if (!planLinea) {
        // Create plan linea with snapshot
        planLinea = await this.prisma.proyectoTarifarioPlanLinea.create({
          data: {
            planId: plan.id,
            lineaTarifarioId: reconciledLineaTarifarioId,
            rateSnapshot: tarifarioLinea.rate || 0,
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

    // Calculate month range based on tarifario vigencia
    const vigenciaDesde = new Date(tarifario.fechaVigenciaDesde);
    const vigenciaHasta = tarifario.fechaVigenciaHasta
      ? new Date(tarifario.fechaVigenciaHasta)
      : new Date(vigenciaDesde.getFullYear(), 11, 31); // Default to Dec 31 of same year

    // Get year of vigencia dates
    const yearDesde = vigenciaDesde.getFullYear();
    const yearHasta = vigenciaHasta.getFullYear();

    // Calculate month range for selected year
    let mesInicio: number;
    let mesFin: number;

    if (year < yearDesde || year > yearHasta) {
      // No intersection with selected year
      throw new BadRequestException(
        `El tarifario tiene vigencia desde ${vigenciaDesde.toLocaleDateString('es-AR')} hasta ${vigenciaHasta.toLocaleDateString('es-AR')}, ` +
        `no aplica para el año ${year}.`
      );
    }

    // Calculate intersection with selected year
    if (year === yearDesde && year === yearHasta) {
      // All within same year
      mesInicio = vigenciaDesde.getMonth() + 1; // 1-12
      mesFin = vigenciaHasta.getMonth() + 1;
    } else if (year === yearDesde) {
      // Start year
      mesInicio = vigenciaDesde.getMonth() + 1;
      mesFin = 12;
    } else if (year === yearHasta) {
      // End year
      mesInicio = 1;
      mesFin = vigenciaHasta.getMonth() + 1;
    } else {
      // Middle year (full year)
      mesInicio = 1;
      mesFin = 12;
    }

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
            rateSnapshot: tarifarioLinea.rate || 0,
            monedaSnapshot: tarifarioLinea.moneda || tarifario.moneda,
          },
        });
      }

      // Create meses within vigencia range with rate from tarifario
      const rate = tarifarioLinea.rate || 0;
      const mesesToCreate = [];
      for (let month = mesInicio; month <= mesFin; month++) {
        mesesToCreate.push({
          lineaId: planLinea.id,
          month,
          cantidad: rate, // Set initial rate from tarifario
          isOverride: false,
        });
      }

      // Upsert (create if not exists, update if exists)
      await Promise.all(
        mesesToCreate.map((mes) =>
          this.prisma.proyectoTarifarioPlanMes.upsert({
            where: {
              lineaId_month: {
                lineaId: mes.lineaId,
                month: mes.month,
              },
            },
            update: {
              cantidad: mes.cantidad,
              isOverride: mes.isOverride,
            },
            create: mes,
          }),
        ),
      );
    }

    // Return plan
    return this.getPlan(proyectoId, year);
  }
}
