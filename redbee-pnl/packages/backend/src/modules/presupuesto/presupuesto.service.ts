import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdatePresupuestoDto } from './dto/update-presupuesto.dto';
import { AplicarClientePresupuestoDto } from './dto/aplicar-cliente-presupuesto.dto';
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

  /**
   * Apply cliente presupuesto to proyecto (from current month to Dec)
   */
  async aplicarClientePresupuesto(
    proyectoId: string,
    year: number,
    dto: AplicarClientePresupuestoDto,
  ) {
    // Validations
    if (year < 2020 || year > 2050) {
      throw new BadRequestException('Year must be between 2020 and 2050');
    }

    // Get proyecto with cliente
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id: proyectoId },
      include: { cliente: true },
    });

    if (!proyecto) {
      throw new NotFoundException(`Proyecto with ID ${proyectoId} not found`);
    }

    // Get cliente presupuesto
    const clientePresupuesto = await this.prisma.clientePresupuesto.findUnique({
      where: { id: dto.clientePresupuestoId },
      include: {
        meses: {
          where: { year },
          orderBy: { month: 'asc' },
        },
        cliente: true,
      },
    });

    if (!clientePresupuesto) {
      throw new NotFoundException(
        `Cliente presupuesto with ID ${dto.clientePresupuestoId} not found`,
      );
    }

    // Validate that proyecto belongs to the same cliente as the presupuesto
    if (proyecto.clienteId !== clientePresupuesto.clienteId) {
      throw new BadRequestException(
        'The proyecto does not belong to the cliente of the selected presupuesto',
      );
    }

    // Determine starting month (default to current month)
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const fromMonth = dto.fromMonth || currentMonth;

    // Get or create proyecto presupuesto
    let proyectoPresupuesto = await this.prisma.proyectoPresupuesto.findUnique({
      where: {
        proyectoId_year: { proyectoId, year },
      },
    });

    if (!proyectoPresupuesto) {
      proyectoPresupuesto = await this.createPresupuesto(proyectoId, year);
    }

    // Build a map of cliente presupuesto months
    const clienteMesesMap = new Map<number, number>();
    for (const mes of clientePresupuesto.meses) {
      clienteMesesMap.set(mes.month, Number(mes.amount));
    }

    // Update proyecto presupuesto months from fromMonth to 12
    const monthsToUpdate: Array<{ month: number; amount: number }> = [];
    for (let month = fromMonth; month <= 12; month++) {
      const amount = clienteMesesMap.get(month) || 0;
      monthsToUpdate.push({ month, amount });
    }

    // Apply updates in transaction
    await this.prisma.$transaction(
      monthsToUpdate.map((mesUpdate) =>
        this.prisma.proyectoPresupuestoMes.upsert({
          where: {
            presupuestoId_month: {
              presupuestoId: proyectoPresupuesto.id,
              month: mesUpdate.month,
            },
          },
          update: {
            amount: mesUpdate.amount,
            isOverride: true,
          },
          create: {
            presupuestoId: proyectoPresupuesto.id,
            month: mesUpdate.month,
            amount: mesUpdate.amount,
            isOverride: true,
          },
        }),
      ),
    );

    // Return updated presupuesto
    return this.getPresupuesto(proyectoId, year);
  }
}
