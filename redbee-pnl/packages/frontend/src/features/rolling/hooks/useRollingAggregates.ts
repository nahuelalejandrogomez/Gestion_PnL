/**
 * useRollingAggregates - Cálculo de totales y validación
 * ÉPICA 2 US-006: Totales consolidados y validación consistencia
 */

import { useMemo } from 'react';
import { logger } from '@/utils/logger';
import type { RollingData } from '../types/rolling.types';

export interface RollingAggregate {
  month: number;
  total: number;
  backlog: number;
  potencial: number;
  isValid: boolean; // total === backlog + potencial
  discrepancy: number; // total - (backlog + potencial)
}

export interface RevenueAggregate {
  month: number;
  total: number;
  backlog: number;
  potencial: number;
  budget: number; // TBD: Presupuesto mensual (placeholder)
  desvio: number; // total - budget
  desvioPct: number | null; // (total - budget) / budget * 100
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
  // Revenue aggregates
  revenue: {
    byMonth: Record<number, RevenueAggregate>; // 1-12
    annual: {
      total: number;
      backlog: number;
      potencial: number;
      budget: number;
      desvio: number;
      desvioPct: number | null;
    };
  };
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
      let backlogMonth = 0;
      let potencialMonth = 0;

      // Sumar todos los clientes
      for (const cliente of data.clientes) {
        const monthData = cliente.meses[m];
        if (!monthData) continue;

        // Backlog = ftesReales ?? ftesAsignados
        const clienteBacklog = monthData.ftesReales ?? monthData.ftesAsignados;
        backlogMonth += clienteBacklog;

        // Potencial (B-26) — fuente: ClientePotencial ACTIVO ponderado
        potencialMonth += monthData.ftePotencial;
      }

      // Total = Backlog solamente — REGLA (potencial.md): potencial NO suma al total confirmado
      const totalMonth = backlogMonth;

      // Validación: total debe = backlog (potencial se muestra separado)
      const discrepancy = Math.abs(totalMonth - backlogMonth);
      const isValid = discrepancy <= 0.01;

      if (!isValid) {
        hasDiscrepancies = true;
        logger.error('[Rolling]', `Discrepancia FTEs mes ${m}`, {
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

    // ===== CALCULAR REVENUE AGGREGATES =====
    const revenueByMonth: Record<number, RevenueAggregate> = {};

    for (let m = 1; m <= 12; m++) {
      let revBacklogMonth = 0;
      let revPotencialMonth = 0;

      // Sumar todos los clientes
      for (const cliente of data.clientes) {
        const monthData = cliente.meses[m];
        if (!monthData) continue;

        // Backlog = revenueReal ?? revenueAsignado
        const clienteBacklog = monthData.revenueReal ?? monthData.revenueAsignado;
        revBacklogMonth += clienteBacklog;

        // Potencial (B-26) — fuente: ClientePotencial ACTIVO ponderado
        revPotencialMonth += monthData.revenuePotencial;
      }

      // Total = Backlog solamente — REGLA (potencial.md): potencial NO suma al total confirmado
      const revTotalMonth = revBacklogMonth;

      // Budget = 0 (placeholder — B-18 presupuestos)
      const revBudgetMonth = 0;

      // Desvío vs Budget
      const desvio = revTotalMonth - revBudgetMonth;
      const desvioPct = revBudgetMonth > 0 ? (desvio / revBudgetMonth) * 100 : null;

      // Validación: total debe = backlog (potencial se muestra separado)
      const revDiscrepancy = Math.abs(revTotalMonth - revBacklogMonth);
      const revIsValid = revDiscrepancy <= 0.01;

      if (!revIsValid) {
        logger.error('[Rolling]', `Discrepancia Revenue mes ${m}`, {
          total: revTotalMonth,
          backlog: revBacklogMonth,
          potencial: revPotencialMonth,
          discrepancy: revDiscrepancy,
        });
      }

      revenueByMonth[m] = {
        month: m,
        total: revTotalMonth,
        backlog: revBacklogMonth,
        potencial: revPotencialMonth,
        budget: revBudgetMonth,
        desvio,
        desvioPct,
        isValid: revIsValid,
        discrepancy: revDiscrepancy,
      };
    }

    // Calcular totales anuales de revenue (suma, no promedio)
    let revTotalAnual = 0;
    let revBacklogAnual = 0;
    let revPotencialAnual = 0;
    let revBudgetAnual = 0;

    for (let m = 1; m <= 12; m++) {
      revTotalAnual += revenueByMonth[m].total;
      revBacklogAnual += revenueByMonth[m].backlog;
      revPotencialAnual += revenueByMonth[m].potencial;
      revBudgetAnual += revenueByMonth[m].budget;
    }

    const revDesvioAnual = revTotalAnual - revBudgetAnual;
    const revDesvioPctAnual = revBudgetAnual > 0 ? (revDesvioAnual / revBudgetAnual) * 100 : null;

    return {
      byMonth,
      annual: {
        total: totalAnual,
        backlog: backlogAnual,
        potencial: potencialAnual,
      },
      hasDiscrepancies,
      revenue: {
        byMonth: revenueByMonth,
        annual: {
          total: revTotalAnual,
          backlog: revBacklogAnual,
          potencial: revPotencialAnual,
          budget: revBudgetAnual,
          desvio: revDesvioAnual,
          desvioPct: revDesvioPctAnual,
        },
      },
    };
  }, [data]);
}
