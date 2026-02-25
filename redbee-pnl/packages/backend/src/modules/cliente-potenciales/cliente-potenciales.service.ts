import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientePotencialDto } from './dto/create-cliente-potencial.dto';
import { UpdateClientePotencialDto } from './dto/update-cliente-potencial.dto';

const POTENCIAL_INCLUDE = {
  lineas: {
    where: { deletedAt: null },
    include: {
      perfil: { select: { id: true, nombre: true, nivel: true } },
      meses: { orderBy: [{ year: 'asc' as const }, { month: 'asc' as const }] },
    },
    orderBy: { createdAt: 'asc' as const },
  },
};

@Injectable()
export class ClientePotencialesService {
  constructor(private prisma: PrismaService) {}

  async findAllByCliente(clienteId: string) {
    await this.assertClienteExists(clienteId);
    return this.prisma.clientePotencial.findMany({
      where: { clienteId, deletedAt: null },
      include: POTENCIAL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(clienteId: string, id: string) {
    const potencial = await this.prisma.clientePotencial.findFirst({
      where: { id, clienteId, deletedAt: null },
      include: POTENCIAL_INCLUDE,
    });
    if (!potencial) {
      throw new NotFoundException(`Potencial ${id} no encontrado para el cliente ${clienteId}`);
    }
    return potencial;
  }

  async create(clienteId: string, dto: CreateClientePotencialDto) {
    await this.assertClienteExists(clienteId);

    return this.prisma.clientePotencial.create({
      data: {
        clienteId,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        probabilidadCierre: dto.probabilidadCierre,
        estado: dto.estado,
        fechaEstimadaCierre: dto.fechaEstimadaCierre,
        moneda: dto.moneda,
        notas: dto.notas,
        lineas: dto.lineas
          ? {
              create: dto.lineas.map((linea) => ({
                perfilId: linea.perfilId,
                nombreLinea: linea.nombreLinea,
                meses: linea.meses
                  ? { create: linea.meses }
                  : undefined,
              })),
            }
          : undefined,
      },
      include: POTENCIAL_INCLUDE,
    });
  }

  async update(clienteId: string, id: string, dto: UpdateClientePotencialDto) {
    await this.findOne(clienteId, id);

    return this.prisma.clientePotencial.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        probabilidadCierre: dto.probabilidadCierre,
        estado: dto.estado,
        fechaEstimadaCierre: dto.fechaEstimadaCierre,
        moneda: dto.moneda,
        notas: dto.notas,
        proyectoId: dto.proyectoId,
      },
      include: POTENCIAL_INCLUDE,
    });
  }

  async remove(clienteId: string, id: string) {
    await this.findOne(clienteId, id);
    await this.prisma.clientePotencial.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { deleted: true };
  }

  // ── Líneas ──────────────────────────────────────────────────────────────────

  async upsertLineas(
    clienteId: string,
    potencialId: string,
    lineas: Array<{
      id?: string;
      perfilId: string;
      nombreLinea?: string;
      meses?: Array<{ year: number; month: number; ftes: number; revenueEstimado: number }>;
    }>,
  ) {
    await this.findOne(clienteId, potencialId);

    return this.prisma.$transaction(async (tx) => {
      const results = [];
      for (const linea of lineas) {
        if (linea.id) {
          // Update línea existente
          const updated = await tx.clientePotencialLinea.update({
            where: { id: linea.id },
            data: {
              perfilId: linea.perfilId,
              nombreLinea: linea.nombreLinea,
            },
          });
          if (linea.meses) {
            for (const mes of linea.meses) {
              await tx.clientePotencialLineaMes.upsert({
                where: { lineaId_year_month: { lineaId: linea.id, year: mes.year, month: mes.month } },
                create: { lineaId: linea.id, ...mes },
                update: { ftes: mes.ftes, revenueEstimado: mes.revenueEstimado },
              });
            }
          }
          results.push(updated);
        } else {
          // Crear línea nueva
          const created = await tx.clientePotencialLinea.create({
            data: {
              potencialId,
              perfilId: linea.perfilId,
              nombreLinea: linea.nombreLinea,
              meses: linea.meses ? { create: linea.meses } : undefined,
            },
          });
          results.push(created);
        }
      }
      return results;
    });
  }

  async removeLinea(clienteId: string, potencialId: string, lineaId: string) {
    await this.findOne(clienteId, potencialId);
    await this.prisma.clientePotencialLinea.update({
      where: { id: lineaId },
      data: { deletedAt: new Date() },
    });
    return { deleted: true };
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private async assertClienteExists(clienteId: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { id: true, deletedAt: true },
    });
    if (!cliente || cliente.deletedAt) {
      throw new NotFoundException(`Cliente ${clienteId} no encontrado`);
    }
  }
}
