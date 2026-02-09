import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePerfilDto } from './dto/create-perfil.dto';
import { QueryPerfilDto } from './dto/query-perfil.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PerfilesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryPerfilDto) {
    const { search } = query;

    const where: Prisma.PerfilWhereInput = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { categoria: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.perfil.findMany({
      where,
      orderBy: { nombre: 'asc' },
    });
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
