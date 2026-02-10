import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContratoDto, UpdateContratoDto } from './dto/contratos.dto';
import { EstadoContrato, Prisma } from '@prisma/client';

@Injectable()
export class ContratosService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all contracts for a client, ordered by estado (VIGENTE first) then by fechaInicioVigencia desc
   */
  async findByClienteId(clienteId: string) {
    return this.prisma.contrato.findMany({
      where: { 
        clienteId,
        deletedAt: null,
      },
      orderBy: [
        { estado: 'asc' }, // VIGENTE comes before VENCIDO/TERMINADO alphabetically
        { fechaInicioVigencia: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Get a single contract by ID
   */
  async findById(id: string) {
    const contrato = await this.prisma.contrato.findFirst({
      where: { id, deletedAt: null },
    });
    if (!contrato) {
      throw new NotFoundException(`Contrato ${id} no encontrado`);
    }
    return contrato;
  }

  /**
   * Create a new contract for a client
   * If estado is VIGENTE, set other VIGENTE contracts to VENCIDO
   */
  async create(clienteId: string, dto: CreateContratoDto) {
    const estado = dto.estado ?? EstadoContrato.VIGENTE;

    const data: Prisma.ContratoUncheckedCreateInput = {
      clienteId,
      nombre: dto.nombre,
      tipo: dto.tipo,
      fechaFirma: new Date(dto.fechaFirma),
      fechaInicioVigencia: new Date(dto.fechaInicioVigencia),
      fechaFinVigencia: dto.fechaFinVigencia ? new Date(dto.fechaFinVigencia) : null,
      documentoDriveUrl: dto.documentoDriveUrl,
      estado,
      montoTotal: dto.montoTotal,
      moneda: dto.moneda,
      notas: dto.notas,
    };

    // If marking as VIGENTE, unset others in a transaction
    if (estado === EstadoContrato.VIGENTE) {
      return this.prisma.$transaction(async (tx) => {
        // Set other VIGENTE contracts to VENCIDO
        await tx.contrato.updateMany({
          where: {
            clienteId,
            estado: EstadoContrato.VIGENTE,
            deletedAt: null,
          },
          data: { estado: EstadoContrato.VENCIDO },
        });

        // Create the new contract
        return tx.contrato.create({ data });
      });
    }

    // Otherwise just create normally
    return this.prisma.contrato.create({ data });
  }

  /**
   * Update a contract
   * If setting estado to VIGENTE, unset others
   */
  async update(id: string, dto: UpdateContratoDto) {
    const contrato = await this.findById(id);

    const data: Prisma.ContratoUncheckedUpdateInput = {
      nombre: dto.nombre,
      tipo: dto.tipo,
      fechaFirma: dto.fechaFirma ? new Date(dto.fechaFirma) : undefined,
      fechaInicioVigencia: dto.fechaInicioVigencia ? new Date(dto.fechaInicioVigencia) : undefined,
      fechaFinVigencia: dto.fechaFinVigencia ? new Date(dto.fechaFinVigencia) : undefined,
      documentoDriveUrl: dto.documentoDriveUrl,
      estado: dto.estado,
      montoTotal: dto.montoTotal,
      moneda: dto.moneda,
      notas: dto.notas,
    };

    // If setting to VIGENTE, unset others
    if (dto.estado === EstadoContrato.VIGENTE && contrato.estado !== EstadoContrato.VIGENTE) {
      return this.prisma.$transaction(async (tx) => {
        // Set other VIGENTE contracts to VENCIDO
        await tx.contrato.updateMany({
          where: {
            clienteId: contrato.clienteId,
            estado: EstadoContrato.VIGENTE,
            deletedAt: null,
            id: { not: id },
          },
          data: { estado: EstadoContrato.VENCIDO },
        });

        // Update this contract
        return tx.contrato.update({ where: { id }, data });
      });
    }

    // Otherwise just update normally
    return this.prisma.contrato.update({ where: { id }, data });
  }

  /**
   * Soft delete a contract
   */
  async delete(id: string) {
    await this.findById(id);
    return this.prisma.contrato.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
