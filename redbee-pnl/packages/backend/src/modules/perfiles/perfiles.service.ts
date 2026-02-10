import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePerfilDto } from './dto/create-perfil.dto';
import { QueryPerfilDto } from './dto/query-perfil.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PerfilesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryPerfilDto) {
    const { search, page = 1, limit = 50, estado } = query;

    const where: Prisma.PerfilWhereInput = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { categoria: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (estado) {
      where.estado = estado as 'ACTIVO' | 'INACTIVO';
    }

    const [data, total] = await Promise.all([
      this.prisma.perfil.findMany({
        where,
        orderBy: { nombre: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.perfil.count({ where }),
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
    const perfil = await this.prisma.perfil.findUnique({ where: { id } });
    if (!perfil || perfil.deletedAt) {
      throw new NotFoundException(`Perfil con ID ${id} no encontrado`);
    }
    return perfil;
  }

  async create(dto: CreatePerfilDto) {
    try {
      return await this.prisma.perfil.create({ data: dto });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(`Ya existe un perfil con nombre "${dto.nombre}"`);
      }
      throw error;
    }
  }
}
