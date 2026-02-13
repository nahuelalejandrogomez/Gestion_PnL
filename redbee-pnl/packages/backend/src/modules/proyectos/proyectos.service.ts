import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProyectoDto } from './dto/create-proyecto.dto';
import { UpdateProyectoDto } from './dto/update-proyecto.dto';
import { QueryProyectoDto } from './dto/query-proyecto.dto';
import { UpsertCostosManualesDto } from './dto/costos-manuales.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProyectosService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryProyectoDto) {
    const { clienteId, estado, tipo, search, page = 1, limit = 20 } = query;

    const where: Prisma.ProyectoWhereInput = {
      deletedAt: null,
    };

    if (clienteId) {
      where.clienteId = clienteId;
    }

    if (estado) {
      where.estado = estado;
    }

    if (tipo) {
      where.tipo = tipo;
    }

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { codigo: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.proyecto.count({ where }),
      this.prisma.proyecto.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { estado: 'asc' }, // ACTIVO first (alphabetically)
          { nombre: 'asc' },
        ],
        include: {
          cliente: {
            select: { id: true, nombre: true },
          },
          _count: {
            select: { asignaciones: true, lineasPnL: true },
          },
        },
      }),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id },
      include: {
        cliente: {
          select: { id: true, nombre: true, razonSocial: true },
        },
        tarifario: {
          select: { id: true, nombre: true },
        },
        contrato: {
          select: { id: true, nombre: true, tipo: true },
        },
        _count: {
          select: { asignaciones: true, lineasPnL: true, skillsRequeridos: true },
        },
      },
    });

    if (!proyecto || proyecto.deletedAt) {
      throw new NotFoundException(`Proyecto con ID ${id} no encontrado`);
    }

    return proyecto;
  }

  async create(dto: CreateProyectoDto) {
    this.validateDates(dto);

    try {
      return await this.prisma.proyecto.create({
        data: dto,
        include: {
          cliente: {
            select: { id: true, nombre: true },
          },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Ya existe un proyecto con código "${dto.codigo}" para este cliente`,
        );
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateProyectoDto) {
    await this.findOne(id);
    this.validateDates(dto);

    try {
      return await this.prisma.proyecto.update({
        where: { id },
        data: dto,
        include: {
          cliente: {
            select: { id: true, nombre: true },
          },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Ya existe un proyecto con ese código para este cliente`,
        );
      }
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.proyecto.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // =====================
  // COSTOS MANUALES
  // =====================

  async getCostosManuales(proyectoId: string, year: number) {
    await this.findOne(proyectoId);

    const rows = await this.prisma.proyectoCostoManualesMes.findMany({
      where: { proyectoId, year },
      orderBy: { month: 'asc' },
    });

    const otrosCostos: Record<number, number> = {};
    const guardiasExtras: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) {
      otrosCostos[m] = 0;
      guardiasExtras[m] = 0;
    }
    for (const r of rows) {
      otrosCostos[r.month] = Number(r.otrosCostos);
      guardiasExtras[r.month] = Number(r.guardiasExtras);
    }

    return { otrosCostos, guardiasExtras };
  }

  async upsertCostosManuales(
    proyectoId: string,
    year: number,
    dto: UpsertCostosManualesDto,
  ) {
    await this.findOne(proyectoId);

    if (year < 2020 || year > 2100) {
      throw new BadRequestException('Year must be between 2020 and 2100');
    }

    const results = await Promise.all(
      dto.items.map((item) =>
        this.prisma.proyectoCostoManualesMes.upsert({
          where: {
            proyectoId_year_month: { proyectoId, year, month: item.month },
          },
          update: {
            otrosCostos: item.otrosCostos,
            guardiasExtras: item.guardiasExtras,
          },
          create: {
            proyectoId,
            year,
            month: item.month,
            otrosCostos: item.otrosCostos,
            guardiasExtras: item.guardiasExtras,
          },
        }),
      ),
    );

    return { updated: results.length };
  }

  // =====================
  // TARIFARIO MANAGEMENT
  // =====================

  /**
   * Remove tarifario assignment from proyecto and cascade delete all related data
   * Returns counts of deleted records
   */
  async removeTarifario(proyectoId: string): Promise<{
    ok: boolean;
    deletedPlanLineas: number;
    deletedPlanCells: number;
    deletedForecastPlans: number;
    deletedForecastLineas: number;
    deletedForecastCells: number;
  }> {
    // Verify proyecto exists
    const proyecto = await this.findOne(proyectoId);

    if (!proyecto.tarifarioRevenuePlanId) {
      // No tarifario assigned - idempotent operation
      return {
        ok: true,
        deletedPlanLineas: 0,
        deletedPlanCells: 0,
        deletedForecastPlans: 0,
        deletedForecastLineas: 0,
        deletedForecastCells: 0,
      };
    }

    let deletedPlanLineas = 0;
    let deletedPlanCells = 0;
    let deletedForecastPlans = 0;
    let deletedForecastLineas = 0;
    let deletedForecastCells = 0;

    await this.prisma.$transaction(async (tx) => {
      // 1. Delete ProyectoPlanLinea + ProyectoPlanLineaMes (tarifario plan)
      const planLineas = await tx.proyectoPlanLinea.findMany({
        where: { proyectoId, deletedAt: null },
        select: { id: true },
      });

      if (planLineas.length > 0) {
        const planLineaIds = planLineas.map((l) => l.id);

        // Delete meses first (foreign key constraint)
        const deletedMeses = await tx.proyectoPlanLineaMes.deleteMany({
          where: { planLineaId: { in: planLineaIds } },
        });
        deletedPlanCells = deletedMeses.count;

        // Soft delete lineas
        const deletedLineas = await tx.proyectoPlanLinea.updateMany({
          where: { id: { in: planLineaIds } },
          data: { deletedAt: new Date() },
        });
        deletedPlanLineas = deletedLineas.count;
      }

      // 2. Delete ProyectoTarifarioPlan + lineas + meses (forecast/revenue plan)
      const forecastPlans = await tx.proyectoTarifarioPlan.findMany({
        where: { proyectoId },
        select: { id: true },
      });

      if (forecastPlans.length > 0) {
        const forecastPlanIds = forecastPlans.map((p) => p.id);

        // Get forecast lineas
        const forecastLineas = await tx.proyectoTarifarioPlanLinea.findMany({
          where: { planId: { in: forecastPlanIds } },
          select: { id: true },
        });

        if (forecastLineas.length > 0) {
          const forecastLineaIds = forecastLineas.map((l) => l.id);

          // Delete meses first
          const deletedForecastMeses = await tx.proyectoTarifarioPlanMes.deleteMany({
            where: { lineaId: { in: forecastLineaIds } },
          });
          deletedForecastCells = deletedForecastMeses.count;

          // Delete lineas
          const deletedLineas = await tx.proyectoTarifarioPlanLinea.deleteMany({
            where: { id: { in: forecastLineaIds } },
          });
          deletedForecastLineas = deletedLineas.count;
        }

        // Delete plans
        const deletedPlans = await tx.proyectoTarifarioPlan.deleteMany({
          where: { id: { in: forecastPlanIds } },
        });
        deletedForecastPlans = deletedPlans.count;
      }

      // 3. Clear tarifario reference
      await tx.proyecto.update({
        where: { id: proyectoId },
        data: { tarifarioRevenuePlanId: null },
      });
    });

    return {
      ok: true,
      deletedPlanLineas,
      deletedPlanCells,
      deletedForecastPlans,
      deletedForecastLineas,
      deletedForecastCells,
    };
  }

  private validateDates(
    dto: Partial<Pick<CreateProyectoDto, 'fechaInicio' | 'fechaFinEstimada' | 'fechaFinReal'>>,
  ) {
    const { fechaInicio, fechaFinEstimada, fechaFinReal } = dto;

    if (fechaInicio && fechaFinEstimada && fechaFinEstimada < fechaInicio) {
      throw new BadRequestException(
        'La fecha fin estimada debe ser igual o posterior a la fecha de inicio',
      );
    }

    if (fechaInicio && fechaFinReal && fechaFinReal < fechaInicio) {
      throw new BadRequestException(
        'La fecha fin real debe ser igual o posterior a la fecha de inicio',
      );
    }
  }
}
