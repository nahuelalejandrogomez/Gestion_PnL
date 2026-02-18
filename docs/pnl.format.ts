/**
 * Formatting utilities for P&L data
 * Shared between ProyectoPnlGrid and Rolling
 */

export type Moneda = 'USD' | 'ARS';

export function fmtCurrency(val: number, moneda: Moneda): string {
  const symbol = moneda === 'USD' ? 'USD' : 'ARS';
  const formatted = Math.round(val).toLocaleString('en-US');
  return `${symbol} ${formatted}`;
}

export function fmtPct(val: number | null): string {
  if (val === null) return '-';
  return `${val.toFixed(1)}%`;
}

export function fmtFte(val: number): string {
  if (val === 0) return '-';
  return val.toFixed(1);
}

export function colorForGm(gm: number | null): string {
  if (gm === null) return 'text-stone-400';
  if (gm >= 40) return 'text-emerald-600';
  if (gm >= 20) return 'text-amber-600';
  return 'text-red-600';
}

export function colorForDiff(diff: number): string {
  if (diff > 0) return 'text-emerald-600';
  if (diff < 0) return 'text-red-600';
  return 'text-stone-500';
}

export const MONTH_LABELS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];
