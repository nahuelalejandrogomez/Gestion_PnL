import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRecursoDto } from './dto/create-recurso.dto';
import { UpdateRecursoDto } from './dto/update-recurso.dto';
import { QueryRecursoDto } from './dto/query-recurso.dto';
import { UpsertRecursoCostosDto } from './dto/recurso-costo-mes.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class RecursosService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryRecursoDto) {
    const { estado, search, page = 1, limit = 50 } = query;

    const where: Prisma.RecursoWhereInput = {
      deletedAt: null,
    };

    if (estado) {
      where.estado = estado;
    }

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellido: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { perfil: { nombre: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.recurso.count({ where }),
      this.prisma.recurso.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
        include: {
          perfil: { select: { id: true, nombre: true, categoria: true, nivel: true } },
        },
      }),
    ]);

    return {
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const recurso = await this.prisma.recurso.findUnique({
      where: { id },
      include: {
        perfil: { select: { id: true, nombre: true, categoria: true, nivel: true } },
      },
    });
    if (!recurso || recurso.deletedAt) {
      throw new NotFoundException(`Recurso con ID ${id} no encontrado`);
    }
    return recurso;
  }

  async create(dto: CreateRecursoDto) {
    try {
      return await this.prisma.recurso.create({
        data: dto,
        include: {
          perfil: { select: { id: true, nombre: true } },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(`Ya existe un recurso con email "${dto.email}"`);
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateRecursoDto) {
    await this.findOne(id);
    try {
      return await this.prisma.recurso.update({
        where: { id },
        data: dto,
        include: {
          perfil: { select: { id: true, nombre: true } },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(`Ya existe un recurso con ese email`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.recurso.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // =====================
  // RECURSO COSTO MES (salary overrides)
  // =====================

  /**
   * Get salary overrides for all recursos of a proyecto in a given year
   * Returns map: { [recursoId]: { [month]: costoMensual } }
   */
  async getCostosByProyecto(proyectoId: string, year: number) {
    // Get all recursoIds assigned to this project
    const asignaciones = await this.prisma.asignacionRecurso.findMany({
      where: { proyectoId },
      select: { recursoId: true },
      distinct: ['recursoId'],
    });

    const recursoIds = asignaciones.map((a) => a.recursoId);

    if (recursoIds.length === 0) {
      return { overrides: {} };
    }

    // Get all overrides for these recursos in the given year
    const costos = await this.prisma.recursoCostoMes.findMany({
      where: {
        recursoId: { in: recursoIds },
        year,
      },
    });

    // Build map: { [recursoId]: { [month]: costoMensual } }
    const overrides: Record<string, Record<number, number>> = {};
    for (const c of costos) {
      if (!overrides[c.recursoId]) {
        overrides[c.recursoId] = {};
      }
      overrides[c.recursoId][c.month] = Number(c.costoMensual);
    }

    return { overrides };
  }

  /**
   * Upsert salary overrides for a recurso in a given year
   */
  async upsertCostos(recursoId: string, year: number, dto: UpsertRecursoCostosDto) {
    // Validate recurso exists
    await this.findOne(recursoId);

    // Validate year
    if (year < 2020 || year > 2100) {
      throw new BadRequestException('Year must be between 2020 and 2100');
    }

    // Validate items
    if (!dto.items || !Array.isArray(dto.items) || dto.items.length === 0) {
      throw new BadRequestException('items array is required and cannot be empty');
    }

    try {
      // Upsert each item
      const results = await Promise.all(
        dto.items.map((item) =>
          this.prisma.recursoCostoMes.upsert({
            where: {
              recursoId_year_month: {
                recursoId,
                year,
                month: item.month,
              },
            },
            update: {
              costoMensual: item.costoMensual,
            },
            create: {
              recursoId,
              year,
              month: item.month,
              costoMensual: item.costoMensual,
            },
          }),
        ),
      );

      return { updated: results.length };
    } catch (error) {
      console.error('[RecursosService.upsertCostos] Prisma error:', error);
      throw new BadRequestException(`Failed to save salary override: ${error.message}`);
    }
  }

  /**
   * Delete a salary override
   */
  async deleteCosto(recursoId: string, year: number, month: number) {
    await this.findOne(recursoId);

    try {
      await this.prisma.recursoCostoMes.delete({
        where: {
          recursoId_year_month: {
            recursoId,
            year,
            month,
          },
        },
      });
      return { deleted: true };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        // Record not found - that's OK, nothing to delete
        return { deleted: false };
      }
      throw error;
    }
  }
}
