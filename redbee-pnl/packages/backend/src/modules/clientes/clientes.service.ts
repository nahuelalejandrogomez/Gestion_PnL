import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { QueryClienteDto } from './dto/query-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryClienteDto) {
    const { estado, search, page = 1, limit = 20 } = query;

    const where: any = {
      deletedAt: null,
    };

    if (estado) {
      where.estado = estado;
    }

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { razonSocial: { contains: search, mode: 'insensitive' } },
        { cuilCuit: { contains: search } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.cliente.count({ where }),
      this.prisma.cliente.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { nombre: 'asc' },
        include: {
          _count: {
            select: {
              proyectos: true,
              contratos: true,
            },
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
    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
      include: {
        proyectos: {
          where: { deletedAt: null },
          orderBy: { fechaInicio: 'desc' },
        },
        contratos: {
          where: { deletedAt: null },
          orderBy: { fechaFirma: 'desc' },
        },
        objetivos: {
          orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
        },
      },
    });

    if (!cliente || cliente.deletedAt) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    return cliente;
  }

  async create(createClienteDto: CreateClienteDto) {
    return this.prisma.cliente.create({
      data: createClienteDto,
    });
  }

  async update(id: string, updateClienteDto: UpdateClienteDto) {
    await this.findOne(id);

    return this.prisma.cliente.update({
      where: { id },
      data: updateClienteDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.cliente.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
