import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAsignacionDto } from './dto/create-asignacion.dto';
import { UpdateAsignacionDto } from './dto/update-asignacion.dto';
import { QueryAsignacionDto } from './dto/query-asignacion.dto';
import { UpsertMesBatchDto } from './dto/planner-mes.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AsignacionesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryAsignacionDto) {
    const { proyectoId, recursoId, page = 1, limit = 50 } = query;

    const where: Prisma.AsignacionRecursoWhereInput = {};

    if (proyectoId) {
      where.proyectoId = proyectoId;
    }
    if (recursoId) {
      where.recursoId = recursoId;
    }

    const [total, data] = await Promise.all([
      this.prisma.asignacionRecurso.count({ where }),
      this.prisma.asignacionRecurso.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { fechaDesde: 'desc' },
        include: {
          recurso: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
              costoMensual: true,
              monedaCosto: true,
              perfil: { select: { id: true, nombre: true } },
            },
          },
          proyecto: {
            select: { id: true, nombre: true, codigo: true },
          },
        },
      }),
    ]);

    return {
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const asignacion = await this.prisma.asignacionRecurso.findUnique({
      where: { id },
      include: {
        recurso: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            costoMensual: true,
            monedaCosto: true,
            perfil: { select: { id: true, nombre: true } },
          },
        },
        proyecto: {
          select: { id: true, nombre: true, codigo: true },
        },
      },
    });

    if (!asignacion) {
      throw new NotFoundException(`Asignación con ID ${id} no encontrada`);
    }

    return asignacion;
  }

  async create(dto: CreateAsignacionDto) {
    this.validateDates(dto);
    const warnings = await this.checkOverAllocation(dto.recursoId, dto.porcentajeAsignacion, dto.fechaDesde, dto.fechaHasta);

    const data = await this.prisma.asignacionRecurso.create({
      data: dto,
      include: {
        recurso: {
          select: { id: true, nombre: true, apellido: true, perfil: { select: { nombre: true } } },
        },
        proyecto: {
          select: { id: true, nombre: true, codigo: true },
        },
      },
    });

    return { ...data, warnings };
  }

  async update(id: string, dto: UpdateAsignacionDto) {
    const existing = await this.findOne(id);
    this.validateDates(dto);

    const recursoId = dto.recursoId || existing.recursoId;
    const porcentaje = dto.porcentajeAsignacion ?? Number(existing.porcentajeAsignacion);
    const fechaDesde = dto.fechaDesde || existing.fechaDesde;
    const fechaHasta = dto.fechaHasta !== undefined ? dto.fechaHasta : existing.fechaHasta;

    const warnings = await this.checkOverAllocation(recursoId, porcentaje, fechaDesde, fechaHasta, id);

    const data = await this.prisma.asignacionRecurso.update({
      where: { id },
      data: dto,
      include: {
        recurso: {
          select: { id: true, nombre: true, apellido: true, perfil: { select: { nombre: true } } },
        },
        proyecto: {
          select: { id: true, nombre: true, codigo: true },
        },
      },
    });

    return { ...data, warnings };
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.asignacionRecurso.delete({ where: { id } });
  }

  private validateDates(dto: Partial<Pick<CreateAsignacionDto, 'fechaDesde' | 'fechaHasta'>>) {
    if (dto.fechaDesde && dto.fechaHasta && dto.fechaHasta < dto.fechaDesde) {
      throw new BadRequestException('La fecha hasta debe ser igual o posterior a fecha desde');
    }
  }

  async findPlannerByProyecto(proyectoId: string, year: number) {
    const asignaciones = await this.prisma.asignacionRecurso.findMany({
      where: { proyectoId },
      orderBy: [
        { recurso: { apellido: 'asc' } },
        { recurso: { nombre: 'asc' } },
      ],
      include: {
        recurso: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            costoMensual: true,
            monedaCosto: true,
            perfil: { select: { id: true, nombre: true } },
          },
        },
        meses: {
          where: { year },
        },
      },
    });

    const rows = asignaciones.map((a) => {
      const meses: Record<number, number> = {};
      for (const m of a.meses) {
        meses[m.month] = Number(m.porcentajeAsignacion);
      }
      return {
        asignacionId: a.id,
        recursoId: a.recurso.id,
        recursoNombre: a.recurso.nombre,
        recursoApellido: a.recurso.apellido,
        perfilNombre: a.recurso.perfil?.nombre || '-',
        tipoTiempo: a.tipoTiempo,
        costoMensual: Number(a.recurso.costoMensual),
        monedaCosto: a.recurso.monedaCosto,
        meses,
      };
    });

    return { proyectoId, year, rows };
  }

  async upsertMesBatch(dto: UpsertMesBatchDto) {
    const results = await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.asignacionRecursoMes.upsert({
          where: {
            asignacionId_year_month: {
              asignacionId: item.asignacionId,
              year: item.year,
              month: item.month,
            },
          },
          update: { porcentajeAsignacion: item.porcentajeAsignacion },
          create: {
            asignacionId: item.asignacionId,
            year: item.year,
            month: item.month,
            porcentajeAsignacion: item.porcentajeAsignacion,
          },
        }),
      ),
    );

    return { updated: results.length };
  }

  private async checkOverAllocation(
    recursoId: string,
    porcentaje: number,
    fechaDesde: Date,
    fechaHasta: Date | null | undefined,
    excludeId?: string,
  ): Promise<string[]> {
    const endDate = fechaHasta || new Date('2099-12-31');
    const warnings: string[] = [];

    const existing = await this.prisma.asignacionRecurso.findMany({
      where: {
        recursoId,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        fechaDesde: { lte: endDate },
        OR: [
          { fechaHasta: null },
          { fechaHasta: { gte: fechaDesde } },
        ],
      },
    });

    let total = porcentaje;
    for (const a of existing) {
      total += Number(a.porcentajeAsignacion);
    }

    if (total > 150) {
      warnings.push(`Recurso sobre-asignado: ${total}% (supera 150%)`);
    } else if (total > 100) {
      warnings.push(`Recurso sobre-asignado: ${total}% (supera 100%)`);
    }

    return warnings;
  }
}
