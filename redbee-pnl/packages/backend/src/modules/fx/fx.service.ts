import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertFxRatesDto, FxRatesResponse, FxRateMonthResponse } from './fx.dto';
import { FxRateTipo } from '@prisma/client';

@Injectable()
export class FxService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all FX rates for a year, with effective values calculated
   */
  async getByYear(year: number): Promise<FxRatesResponse> {
    // Get all rates for this year
    const rates = await this.prisma.fxRateMensual.findMany({
      where: { year },
      orderBy: [{ month: 'asc' }, { tipo: 'asc' }],
    });

    // Build a map: month -> { real, plan }
    const monthMap: Record<number, { real: number | null; plan: number | null }> = {};
    for (let m = 1; m <= 12; m++) {
      monthMap[m] = { real: null, plan: null };
    }
    for (const r of rates) {
      if (r.tipo === FxRateTipo.REAL) {
        monthMap[r.month].real = Number(r.usdArs);
      } else {
        monthMap[r.month].plan = Number(r.usdArs);
      }
    }

    // Find last known value for fallback (search backwards from current year)
    const lastKnown = await this.findLastKnownRate(year);

    // Build response with effective values
    const result: FxRateMonthResponse[] = [];
    let lastEffective = lastKnown;

    for (let m = 1; m <= 12; m++) {
      const { real, plan } = monthMap[m];
      let effective: number | null = null;
      let isFallback = false;

      if (real !== null) {
        effective = real;
      } else if (plan !== null) {
        effective = plan;
      } else if (lastEffective !== null) {
        effective = lastEffective;
        isFallback = true;
      }

      // Update lastEffective for next month's fallback
      if (effective !== null && !isFallback) {
        lastEffective = effective;
      }

      result.push({ month: m, real, plan, effective, isFallback });
    }

    return { year, rates: result };
  }

  /**
   * Find the last known FX rate before a given year (for fallback)
   */
  private async findLastKnownRate(beforeYear: number): Promise<number | null> {
    // First check current year for any REAL or PLAN
    const currentYearRate = await this.prisma.fxRateMensual.findFirst({
      where: { year: beforeYear },
      orderBy: [{ month: 'desc' }],
    });
    if (currentYearRate) {
      return Number(currentYearRate.usdArs);
    }

    // Then check previous years
    const lastRate = await this.prisma.fxRateMensual.findFirst({
      where: { year: { lt: beforeYear } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    return lastRate ? Number(lastRate.usdArs) : null;
  }

  /**
   * Upsert FX rates for a year
   */
  async upsertRates(year: number, dto: UpsertFxRatesDto): Promise<{ updated: number }> {
    let updated = 0;

    for (const item of dto.items) {
      // Upsert REAL if provided
      if (item.real !== null && item.real !== undefined) {
        await this.prisma.fxRateMensual.upsert({
          where: {
            year_month_tipo: { year, month: item.month, tipo: FxRateTipo.REAL },
          },
          update: { usdArs: item.real },
          create: { year, month: item.month, tipo: FxRateTipo.REAL, usdArs: item.real },
        });
        updated++;
      } else {
        // Delete REAL if set to null
        await this.prisma.fxRateMensual.deleteMany({
          where: { year, month: item.month, tipo: FxRateTipo.REAL },
        });
      }

      // Upsert PLAN if provided
      if (item.plan !== null && item.plan !== undefined) {
        await this.prisma.fxRateMensual.upsert({
          where: {
            year_month_tipo: { year, month: item.month, tipo: FxRateTipo.PLAN },
          },
          update: { usdArs: item.plan },
          create: { year, month: item.month, tipo: FxRateTipo.PLAN, usdArs: item.plan },
        });
        updated++;
      } else {
        // Delete PLAN if set to null
        await this.prisma.fxRateMensual.deleteMany({
          where: { year, month: item.month, tipo: FxRateTipo.PLAN },
        });
      }
    }

    return { updated };
  }
}
