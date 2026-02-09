import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const HORAS_BASE_MES = 176; // 22 días × 8 horas (SPECS)

export interface AsignacionDetalle {
  recursoId: string;
  recursoNombre: string;
  perfilNombre: string;
  porcentajeAsignacion: number;
  tipoTiempo: string;
  rolEnProyecto: string | null;
  costoMensualRecurso: number;
  monedaCosto: string;
  horasMes: number;
  costoAsignacion: number;
  ftes: number;
}

export interface PnlResult {
  proyectoId: string;
  proyectoNombre: string;
  anio: number;
  mes: number;
  horasBaseMes: number;
  revenue: number;
  costosDirectos: number;
  ftes: number;
  margen: number | null;
  margenPorcentaje: number | null;
  requiresTarifarios: boolean;
  revenueWarning: string;
  detalle: AsignacionDetalle[];
}

@Injectable()
export class PnlService {
  constructor(private prisma: PrismaService) {}

  async calculateByProyecto(
    proyectoId: string,
    anio: number,
    mes: number,
  ): Promise<PnlResult> {
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id: proyectoId },
      select: { id: true, nombre: true, deletedAt: true },
    });

    if (!proyecto || proyecto.deletedAt) {
      throw new NotFoundException(`Proyecto con ID ${proyectoId} no encontrado`);
    }

    const primerDia = new Date(anio, mes - 1, 1);
    const ultimoDia = new Date(anio, mes, 0);

    const asignaciones = await this.prisma.asignacionRecurso.findMany({
      where: {
        proyectoId,
        fechaDesde: { lte: ultimoDia },
        OR: [
          { fechaHasta: null },
          { fechaHasta: { gte: primerDia } },
        ],
      },
      include: {
        recurso: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            costoMensual: true,
            monedaCosto: true,
            perfil: { select: { nombre: true } },
          },
        },
        meses: {
          where: { year: anio, month: mes },
        },
      },
    });

    let totalCostos = 0;
    let totalFtes = 0;
    const detalle: AsignacionDetalle[] = [];

    for (const asig of asignaciones) {
      // Use monthly percentage if available, otherwise fallback to 0
      const mesRecord = asig.meses?.[0];
      const porcentaje = mesRecord ? Number(mesRecord.porcentajeAsignacion) : 0;

      if (porcentaje === 0) continue; // Skip resources with 0% for this month

      const costoMensual = Number(asig.recurso.costoMensual);
      const ftes = porcentaje / 100;
      const horasMes = ftes * HORAS_BASE_MES;
      const costoAsignacion = costoMensual * (porcentaje / 100);

      totalCostos += costoAsignacion;
      totalFtes += ftes;

      detalle.push({
        recursoId: asig.recurso.id,
        recursoNombre: `${asig.recurso.nombre} ${asig.recurso.apellido}`,
        perfilNombre: asig.recurso.perfil?.nombre || '-',
        porcentajeAsignacion: porcentaje,
        tipoTiempo: asig.tipoTiempo,
        rolEnProyecto: asig.rolEnProyecto,
        costoMensualRecurso: costoMensual,
        monedaCosto: asig.recurso.monedaCosto,
        horasMes: Math.round(horasMes * 100) / 100,
        costoAsignacion: Math.round(costoAsignacion * 100) / 100,
        ftes: Math.round(ftes * 100) / 100,
      });
    }

    return {
      proyectoId,
      proyectoNombre: proyecto.nombre,
      anio,
      mes,
      horasBaseMes: HORAS_BASE_MES,
      revenue: 0,
      costosDirectos: Math.round(totalCostos * 100) / 100,
      ftes: Math.round(totalFtes * 100) / 100,
      margen: null,
      margenPorcentaje: null,
      requiresTarifarios: true,
      revenueWarning: 'Revenue no disponible: módulo Tarifarios pendiente de implementación',
      detalle,
    };
  }
}
