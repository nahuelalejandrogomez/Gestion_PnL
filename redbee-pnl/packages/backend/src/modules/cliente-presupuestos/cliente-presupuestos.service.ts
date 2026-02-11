import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ClientePresupuestosService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all presupuestos for a cliente, optionally filtered by year
   */
  async getPresupuestosCliente(clienteId: string, year?: number) {
    // Verify cliente exists
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente with ID ${clienteId} not found`);
    }

    const presupuestos = await this.prisma.clientePresupuesto.findMany({
      where: { clienteId },
      include: {
        meses: year
          ? {
              where: { year },
              orderBy: { month: 'asc' },
            }
          : false,
      },
      orderBy: { createdAt: 'desc' },
    });

    return presupuestos.map((p: any) => {
      // Calculate total if meses were included
      let totalAnual = 0;
      if (year && Array.isArray(p.meses)) {
        totalAnual = p.meses.reduce((sum: number, mes: any) => sum + Number(mes.amount), 0);
      }

      return {
        id: p.id,
        nombre: p.nombre,
        moneda: p.moneda,
        estado: p.estado,
        ...(year && {
          meses: p.meses,
          totalAnual,
        }),
      };
    });
  }
}
