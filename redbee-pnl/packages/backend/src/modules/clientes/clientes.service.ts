import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { QueryClienteDto } from './dto/query-cliente.dto';
import { UpdateClientePnlRealDto } from './dto/update-cliente-pnl-real.dto';

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
          orderBy: [
            { estado: 'asc' },
            { nombre: 'asc' },
          ],
        },
        contratos: true,
      },
    });

    if (!cliente || cliente.deletedAt) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    // Count contratos vigentes (estado === VIGENTE)
    const contratosVigentes = await this.prisma.contrato.count({
      where: {
        clienteId: id,
        estado: 'VIGENTE',
        deletedAt: null,
      },
    });

    return {
      ...cliente,
      contratosVigentes,
    };
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

  async updatePnlReal(
    clienteId: string,
    year: number,
    dto: UpdateClientePnlRealDto,
  ) {
    // Validar que el cliente existe
    await this.findOne(clienteId);

    // Validar año razonable
    if (year < 2020 || year > 2030) {
      throw new Error('Year must be between 2020 and 2030');
    }

    // Upsert cada mes con datos reales
    const upsertPromises = dto.meses.map((mes) =>
      this.prisma.clientePnlMesReal.upsert({
        where: {
          clienteId_year_month: {
            clienteId,
            year,
            month: mes.month,
          },
        },
        update: {
          revenueReal: mes.revenueReal ?? null,
          recursosReales: mes.recursosReales ?? null,
          otrosReales: mes.otrosReales ?? null,
          ftesReales: mes.ftesReales ?? null,
        },
        create: {
          clienteId,
          year,
          month: mes.month,
          revenueReal: mes.revenueReal ?? null,
          recursosReales: mes.recursosReales ?? null,
          otrosReales: mes.otrosReales ?? null,
          ftesReales: mes.ftesReales ?? null,
        },
      }),
    );

    await Promise.all(upsertPromises);

    return { success: true, updated: dto.meses.length };
  }
}
