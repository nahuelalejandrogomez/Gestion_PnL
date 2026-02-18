/**
 * Helpers compartidos para formateo P&L
 * Usados en ProyectoPnlGrid y Rolling
 */

export type Moneda = 'USD' | 'ARS';

export const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/**
 * Formatea un valor monetario sin abreviaciones (números completos)
 * @param val Valor numérico
 * @param moneda Moneda USD o ARS
 * @returns String formateado ej: "USD 1,234,567"
 */
export function fmtCurrency(val: number, moneda: Moneda): string {
  const symbol = moneda === 'USD' ? 'USD' : 'ARS';
  const formatted = Math.round(val).toLocaleString('en-US');
  return `${symbol} ${formatted}`;
}

/**
 * Formatea un porcentaje con 1 decimal
 * @param val Valor numérico o null
 * @returns String formateado ej: "45.3%" o "-" si null
 */
export function fmtPct(val: number | null): string {
  if (val === null) return '-';
  return `${val.toFixed(1)}%`;
}

/**
 * Formatea FTEs con 1 decimal, muestra "-" si es 0
 * @param val Valor numérico
 * @returns String formateado ej: "12.5" o "-" si 0
 */
export function fmtFte(val: number): string {
  if (val === 0) return '-';
  return val.toFixed(1);
}

/**
 * Retorna clase CSS color para GM% según valor
 * >= 40%: verde
 * >= 20%: amarillo
 * < 20%: rojo
 * null: gris
 * @param gm GM% o null
 * @returns Clase Tailwind CSS
 */
export function colorForGm(gm: number | null): string {
  if (gm === null) return 'text-stone-400';
  if (gm >= 40) return 'text-emerald-600';
  if (gm >= 20) return 'text-amber-600';
  return 'text-red-600';
}

/**
 * Retorna clase CSS color para diferencias monetarias
 * > 0: verde
 * < 0: rojo
 * = 0: gris
 * @param diff Diferencia numérica
 * @returns Clase Tailwind CSS
 */
export function colorForDiff(diff: number): string {
  if (diff > 0) return 'text-emerald-600';
  if (diff < 0) return 'text-red-600';
  return 'text-stone-500';
}
