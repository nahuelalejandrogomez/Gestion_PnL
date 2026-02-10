/**
 * FX utilities for currency conversion
 * Convention: FX rate (usdArs) = ARS per 1 USD
 *
 * Examples:
 * - USD to ARS: USD * fxRate
 * - ARS to USD: ARS / fxRate
 */

export type Currency = 'ARS' | 'USD';

export interface FxRate {
  month: number;
  real: number | null;
  plan: number | null;
  effective: number | null;
  isFallback: boolean;
}

/**
 * Convert amount from one currency to another using FX rate
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency
 * @param fxRate - FX rate (ARS per 1 USD). Can be null (returns null).
 * @returns Converted amount or null if fxRate is null
 */
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  fxRate: number | null,
): number | null {
  if (fxRate === null || fxRate === 0) return null;
  if (fromCurrency === toCurrency) return amount;

  if (fromCurrency === 'USD' && toCurrency === 'ARS') {
    return amount * fxRate;
  }

  if (fromCurrency === 'ARS' && toCurrency === 'USD') {
    return amount / fxRate;
  }

  return null;
}

/**
 * Format currency amount with symbol
 */
export function formatCurrency(
  amount: number | null,
  currency: Currency,
  options?: { decimals?: number; compact?: boolean },
): string {
  if (amount === null) return '-';

  const { decimals = 2, compact = false } = options || {};

  const formatted = compact
    ? new Intl.NumberFormat('es-AR', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(amount)
    : new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(amount);

  return currency === 'USD' ? `USD ${formatted}` : `$ ${formatted}`;
}

/**
 * Build a map of month -> effective FX rate for quick lookups
 */
export function buildFxMap(rates: FxRate[]): Record<number, number | null> {
  const map: Record<number, number | null> = {};
  for (const r of rates) {
    map[r.month] = r.effective;
  }
  return map;
}

/**
 * Check if any FX rate in the map is a fallback
 */
export function hasFallbackRates(rates: FxRate[]): boolean {
  return rates.some((r) => r.isFallback);
}
