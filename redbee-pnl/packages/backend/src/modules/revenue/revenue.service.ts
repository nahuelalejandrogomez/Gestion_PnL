import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Moneda } from '@prisma/client';

interface ProyectoRevenue {
  proyectoId: string;
  proyectoNombre: string;
  codigo: string;
  revenue: number;
  moneda: Moneda;
  warnings: string[];
}

interface MesRevenue {
  mes: number;
  proyectos: ProyectoRevenue[];
}

export interface ClienteRevenueResponse {
  clienteId: string;
  clienteNombre: string;
  year: number;
  horasBaseMes: number;
  monedaFacturacion: Moneda;
  meses: MesRevenue[];
  warnings: string[];
}

@Injectable()
export class RevenueService {
  constructor(private prisma: PrismaService) {}

  async calculateClienteRevenue(
    clienteId: string,
    year: number,
  ): Promise<ClienteRevenueResponse> {
    // 1. Get cliente
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        nombre: true,
        horasBaseMes: true,
        monedaFacturacion: true,
        deletedAt: true,
      },
    });

    if (!cliente || cliente.deletedAt) {
      throw new NotFoundException(`Cliente con ID ${clienteId} no encontrado`);
    }

    // Use cliente.horasBaseMes with fallback to 160 (not 176 like PnL - tech debt)
    const horasBaseMes = cliente.horasBaseMes ?? 160;

    // 2. Get all proyectos for cliente with tarifarios
    const proyectos = await this.prisma.proyecto.findMany({
      where: {
        clienteId,
        deletedAt: null,
      },
      select: {
        id: true,
        nombre: true,
        codigo: true,
        tarifarioId: true,
        tarifario: {
          select: {
            id: true,
            moneda: true,
            lineas: {
              select: {
                perfilId: true,
                rate: true,
                moneda: true,
              },
            },
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    const globalWarnings: string[] = [];
    const meses: MesRevenue[] = [];

    // 3. Calculate revenue for each month (1-12)
    for (let mes = 1; mes <= 12; mes++) {
      const proyectosRevenue: ProyectoRevenue[] = [];
      const primerDia = new Date(year, mes - 1, 1);
      const ultimoDia = new Date(year, mes, 0);

      for (const proyecto of proyectos) {
        const warnings: string[] = [];
        let totalRevenue = 0;
        let monedaProyecto: Moneda = Moneda.USD;

        // Check if proyecto has tarifario
        if (!proyecto.tarifarioId || !proyecto.tarifario) {
          warnings.push('Proyecto sin tarifario');
        } else {
          monedaProyecto = proyecto.tarifario.moneda;

          // Get BILLABLE asignaciones for this proyecto in this month
          const asignaciones = await this.prisma.asignacionRecurso.findMany({
            where: {
              proyectoId: proyecto.id,
              tipoTiempo: 'BILLABLE',
              fechaDesde: { lte: ultimoDia },
              OR: [
                { fechaHasta: null },
                { fechaHasta: { gte: primerDia } },
              ],
            },
            include: {
              recurso: {
                select: {
                  perfilId: true,
                  perfil: {
                    select: {
                      nombre: true,
                    },
                  },
                },
              },
              meses: {
                where: { year, month: mes },
              },
            },
          });

          // Build rate map from tarifario lineas
          const rateMap = new Map<string, { rate: number; moneda: Moneda }>();
          for (const linea of proyecto.tarifario.lineas) {
            rateMap.set(linea.perfilId, {
              rate: Number(linea.rate),
              moneda: linea.moneda || proyecto.tarifario.moneda,
            });
          }

          // Track perfiles without rate (deterministic warnings)
          const perfilesSinRate = new Set<string>();

          // Calculate revenue for each asignacion
          for (const asig of asignaciones) {
            // Get monthly percentage (fallback to 0 if no record)
            const mesRecord = asig.meses?.[0];
            const porcentaje = mesRecord
              ? Number(mesRecord.porcentajeAsignacion)
              : 0;

            if (porcentaje === 0) continue; // Skip resources with 0% for this month

            // Get rate for this perfil
            const perfilId = asig.recurso.perfilId;
            const rateInfo = rateMap.get(perfilId);

            if (!rateInfo) {
              // Add perfil to missing rate set (deterministic)
              const perfilNombre =
                asig.recurso.perfil?.nombre || `ID:${perfilId}`;
              perfilesSinRate.add(perfilNombre);
              continue; // Revenue = 0 for this resource
            }

            // Calculate revenue: horasMes = horasBaseMes × (% / 100), revenue = horasMes × rate
            const horasMes = horasBaseMes * (porcentaje / 100);
            const revenue = horasMes * rateInfo.rate;
            totalRevenue += revenue;
          }

          // Add deterministic warnings for perfiles without rate
          if (perfilesSinRate.size > 0) {
            const perfiles = Array.from(perfilesSinRate).sort().join(', ');
            warnings.push(`Perfil sin rate: ${perfiles}`);
          }
        }

        // Round to 2 decimals
        totalRevenue = Math.round(totalRevenue * 100) / 100;

        proyectosRevenue.push({
          proyectoId: proyecto.id,
          proyectoNombre: proyecto.nombre,
          codigo: proyecto.codigo,
          revenue: totalRevenue,
          moneda: monedaProyecto,
          warnings,
        });
      }

      meses.push({
        mes,
        proyectos: proyectosRevenue,
      });
    }

    // Collect global warnings (unique)
    const allWarnings = new Set<string>();
    for (const mes of meses) {
      for (const proyecto of mes.proyectos) {
        for (const warning of proyecto.warnings) {
          allWarnings.add(warning);
        }
      }
    }
    globalWarnings.push(...Array.from(allWarnings).sort());

    return {
      clienteId: cliente.id,
      clienteNombre: cliente.nombre,
      year,
      horasBaseMes,
      monedaFacturacion: cliente.monedaFacturacion,
      meses,
      warnings: globalWarnings,
    };
  }
}
