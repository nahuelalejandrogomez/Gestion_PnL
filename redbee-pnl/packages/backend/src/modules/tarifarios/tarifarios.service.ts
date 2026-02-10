import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTarifarioDto } from './dto/create-tarifario.dto';
import { UpdateTarifarioDto } from './dto/update-tarifario.dto';

@Injectable()
export class TarifariosService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all tarifarios with pagination and filters
   */
  async findAll(params?: {
    skip?: number;
    take?: number;
    clienteId?: string;
    estado?: string;
  }) {
    const { skip = 0, take = 50, clienteId, estado } = params || {};

    const where: any = {};
    if (clienteId) where.clienteId = clienteId;
    if (estado) where.estado = estado;

    const [items, total] = await Promise.all([
      this.prisma.tarifario.findMany({
        where,
        skip,
        take,
        include: {
          cliente: { select: { id: true, nombre: true } },
          contrato: { select: { id: true, nombre: true } },
          _count: { select: { lineas: true, proyectos: true } },
        },
        orderBy: [
          { estado: 'asc' },
          { fechaVigenciaDesde: 'desc' },
        ],
      }),
      this.prisma.tarifario.count({ where }),
    ]);

    return { items, total, skip, take };
  }

  /**
   * Get a single tarifario by ID with lineas
   */
  async findOne(id: string) {
    const tarifario = await this.prisma.tarifario.findUnique({
      where: { id },
      include: {
        cliente: { select: { id: true, nombre: true } },
        contrato: { select: { id: true, nombre: true } },
        lineas: {
          include: {
            perfil: { select: { id: true, nombre: true, categoria: true } },
          },
          orderBy: { perfil: { nombre: 'asc' } },
        },
        _count: { select: { lineas: true, proyectos: true } },
      },
    });

    if (!tarifario) {
      throw new NotFoundException(`Tarifario with ID ${id} not found`);
    }

    return tarifario;
  }

  /**
   * Create a new tarifario with optional lineas
   */
  async create(dto: CreateTarifarioDto) {
    const { lineas, ...tarifarioData } = dto;

    return this.prisma.tarifario.create({
      data: {
        ...tarifarioData,
        lineas: lineas
          ? {
              create: lineas,
            }
          : undefined,
      },
      include: {
        cliente: { select: { id: true, nombre: true } },
        contrato: { select: { id: true, nombre: true } },
        lineas: {
          include: {
            perfil: { select: { id: true, nombre: true, categoria: true } },
          },
        },
        _count: { select: { lineas: true, proyectos: true } },
      },
    });
  }

  /**
   * Update a tarifario (without updating lineas)
   * To update lineas, use dedicated endpoints
   */
  async update(id: string, dto: UpdateTarifarioDto) {
    const exists = await this.prisma.tarifario.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException(`Tarifario with ID ${id} not found`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { lineas, ...tarifarioData } = dto;

    return this.prisma.tarifario.update({
      where: { id },
      data: tarifarioData,
      include: {
        cliente: { select: { id: true, nombre: true } },
        contrato: { select: { id: true, nombre: true } },
        lineas: {
          include: {
            perfil: { select: { id: true, nombre: true, categoria: true } },
          },
        },
        _count: { select: { lineas: true, proyectos: true } },
      },
    });
  }

  /**
   * Delete a tarifario (cascade deletes lineas)
   */
  async remove(id: string) {
    const exists = await this.prisma.tarifario.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException(`Tarifario with ID ${id} not found`);
    }

    await this.prisma.tarifario.delete({ where: { id } });
    return { success: true };
  }
}
