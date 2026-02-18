/**
 * useRollingAggregates - Cálculo de totales y validación
 * ÉPICA 2 US-006: Totales consolidados y validación consistencia
 */

import { useMemo } from 'react';
import type { RollingData } from '../types/rolling.types';

export interface RollingAggregate {
  month: number;
  total: number;
  backlog: number;
  potencial: number;
  isValid: boolean; // total === backlog + potencial
  discrepancy: number; // total - (backlog + potencial)
}

export interface RollingAggregates {
  byMonth: Record<number, RollingAggregate>; // 1-12
  annual: {
    total: number;
    backlog: number;
    potencial: number;
  };
  hasDiscrepancies: boolean;
}

/**
 * Hook para calcular totales y validar consistencia
 */
export function useRollingAggregates(data: RollingData | undefined): RollingAggregates | null {
  return useMemo(() => {
    if (!data || data.clientes.length === 0) {
      return null;
    }

    const byMonth: Record<number, RollingAggregate> = {};
    let hasDiscrepancies = false;

    // Calcular totales por mes
    for (let m = 1; m <= 12; m++) {
      let totalMonth = 0;
      let backlogMonth = 0;
      let potencialMonth = 0;

      // Sumar todos los clientes
      for (const cliente of data.clientes) {
        const monthData = cliente.meses[m];
        if (!monthData) continue;

        // Total = ftesAsignados + ftesNoAsignados
        const clienteTotal = monthData.ftesAsignados + monthData.ftesNoAsignados;
        totalMonth += clienteTotal;

        // Backlog = ftesReales ?? ftesAsignados
        const clienteBacklog = monthData.ftesReales ?? monthData.ftesAsignados;
        backlogMonth += clienteBacklog;

        // Potencial = ftesNoAsignados
        potencialMonth += monthData.ftesNoAsignados;
      }

      // Validar: Total debe = Backlog + Potencial
      const discrepancy = Math.abs(totalMonth - (backlogMonth + potencialMonth));
      const isValid = discrepancy <= 0.01; // Tolerancia float

      if (!isValid) {
        hasDiscrepancies = true;
        console.error(`[Rolling] Discrepancia mes ${m}`, {
          total: totalMonth,
          backlog: backlogMonth,
          potencial: potencialMonth,
          discrepancy,
        });
      }

      byMonth[m] = {
        month: m,
        total: totalMonth,
        backlog: backlogMonth,
        potencial: potencialMonth,
        isValid,
        discrepancy,
      };
    }

    // Calcular totales anuales (promedio FTEs)
    let totalAnual = 0;
    let backlogAnual = 0;
    let potencialAnual = 0;

    for (let m = 1; m <= 12; m++) {
      totalAnual += byMonth[m].total;
      backlogAnual += byMonth[m].backlog;
      potencialAnual += byMonth[m].potencial;
    }

    // Promedio anual
    totalAnual /= 12;
    backlogAnual /= 12;
    potencialAnual /= 12;

    return {
      byMonth,
      annual: {
        total: totalAnual,
        backlog: backlogAnual,
        potencial: potencialAnual,
      },
      hasDiscrepancies,
    };
  }, [data]);
}
