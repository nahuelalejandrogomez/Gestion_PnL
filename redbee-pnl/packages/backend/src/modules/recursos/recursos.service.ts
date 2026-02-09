import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRecursoDto } from './dto/create-recurso.dto';
import { UpdateRecursoDto } from './dto/update-recurso.dto';
import { QueryRecursoDto } from './dto/query-recurso.dto';
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
}
