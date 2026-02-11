import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdatePresupuestoDto } from './dto/update-presupuesto.dto';
import { Moneda } from '@prisma/client';

@Injectable()
export class PresupuestoService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get presupuesto for proyecto + year (lazy creation if not exists)
   */
  async getPresupuesto(proyectoId: string, year: number) {
    // Validations
    if (year < 2020 || year > 2050) {
      throw new BadRequestException('Year must be between 2020 and 2050');
    }

    // Try to find existing presupuesto
    let presupuesto = await this.prisma.proyectoPresupuesto.findUnique({
      where: {
        proyectoId_year: { proyectoId, year },
      },
      include: {
        meses: {
          orderBy: { month: 'asc' },
        },
      },
    });

    // If not exists, create it (lazy creation)
    if (!presupuesto) {
      presupuesto = await this.createPresupuesto(proyectoId, year);
    }

    // Calculate total
    const totalAnual = presupuesto.meses.reduce((sum, mes) => {
      return sum + Number(mes.amount);
    }, 0);

    return {
      proyectoId: presupuesto.proyectoId,
      year: presupuesto.year,
      moneda: presupuesto.moneda,
      months: presupuesto.meses.map((mes) => ({
        id: mes.id,
        month: mes.month,
        amount: Number(mes.amount),
        isOverride: mes.isOverride,
      })),
      totalAnual,
    };
  }

  /**
   * Create presupuesto with base amount from tarifario
   */
  private async createPresupuesto(proyectoId: string, year: number) {
    // Verify proyecto exists
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id: proyectoId },
      include: {
        tarifario: {
          include: {
            lineas: true,
          },
        },
      },
    });

    if (!proyecto) {
      throw new NotFoundException(`Proyecto with ID ${proyectoId} not found`);
    }

    // Calculate base amount from tarifario
    let baseAmount = 0;
    let moneda: Moneda = Moneda.USD; // default

    if (proyecto.tarifario && proyecto.tarifario.lineas.length > 0) {
      // Sum all rates from tarifario lines
      baseAmount = proyecto.tarifario.lineas.reduce((sum, linea) => {
        return sum + Number(linea.rate);
      }, 0);

      // Use tarifario moneda
      moneda = proyecto.tarifario.moneda;
    }

    // Create presupuesto with 12 months
    const presupuesto = await this.prisma.proyectoPresupuesto.create({
      data: {
        proyectoId,
        year,
        moneda,
        meses: {
          create: Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            amount: baseAmount,
            isOverride: false,
          })),
        },
      },
      include: {
        meses: {
          orderBy: { month: 'asc' },
        },
      },
    });

    return presupuesto;
  }

  /**
   * Update presupuesto (moneda and/or months)
   */
  async updatePresupuesto(proyectoId: string, year: number, dto: UpdatePresupuestoDto) {
    // Validations
    if (year < 2020 || year > 2050) {
      throw new BadRequestException('Year must be between 2020 and 2050');
    }

    // Get or create presupuesto
    let presupuesto = await this.prisma.proyectoPresupuesto.findUnique({
      where: {
        proyectoId_year: { proyectoId, year },
      },
    });

    if (!presupuesto) {
      // Create if not exists
      presupuesto = await this.createPresupuesto(proyectoId, year);
    }

    // Update moneda if provided
    if (dto.moneda) {
      presupuesto = await this.prisma.proyectoPresupuesto.update({
        where: { id: presupuesto.id },
        data: { moneda: dto.moneda },
      });
    }

    // Update months if provided
    if (dto.months && dto.months.length > 0) {
      for (const mesDto of dto.months) {
        await this.prisma.proyectoPresupuestoMes.upsert({
          where: {
            presupuestoId_month: {
              presupuestoId: presupuesto.id,
              month: mesDto.month,
            },
          },
          update: {
            amount: mesDto.amount,
            isOverride: mesDto.isOverride !== undefined ? mesDto.isOverride : true,
          },
          create: {
            presupuestoId: presupuesto.id,
            month: mesDto.month,
            amount: mesDto.amount,
            isOverride: mesDto.isOverride !== undefined ? mesDto.isOverride : true,
          },
        });
      }
    }

    // Return updated presupuesto
    return this.getPresupuesto(proyectoId, year);
  }

  /**
   * Update a single month
   */
  async updateMes(proyectoId: string, year: number, month: number, amount: number) {
    // Validations
    if (year < 2020 || year > 2050) {
      throw new BadRequestException('Year must be between 2020 and 2050');
    }
    if (month < 1 || month > 12) {
      throw new BadRequestException('Month must be between 1 and 12');
    }
    if (amount < 0) {
      throw new BadRequestException('Amount must be >= 0');
    }

    // Get or create presupuesto
    let presupuesto = await this.prisma.proyectoPresupuesto.findUnique({
      where: {
        proyectoId_year: { proyectoId, year },
      },
    });

    if (!presupuesto) {
      presupuesto = await this.createPresupuesto(proyectoId, year);
    }

    // Upsert month
    await this.prisma.proyectoPresupuestoMes.upsert({
      where: {
        presupuestoId_month: {
          presupuestoId: presupuesto.id,
          month,
        },
      },
      update: {
        amount,
        isOverride: true,
      },
      create: {
        presupuestoId: presupuesto.id,
        month,
        amount,
        isOverride: true,
      },
    });

    // Return updated presupuesto
    return this.getPresupuesto(proyectoId, year);
  }
}
