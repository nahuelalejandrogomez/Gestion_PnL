/**
 * Formatea números sin abreviaciones, con separadores de miles
 * Ejemplo: 18000 → "18,000"
 */
export function formatNumberFull(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

/**
 * Formatea moneda sin abreviaciones
 * Ejemplo: 18000 → "USD 18,000"
 */
export function formatCurrencyFull(value: number, currency: string = 'USD'): string {
  return `${currency} ${formatNumberFull(value)}`;
}

/**
 * Formatea porcentajes
 * Ejemplo: 45.5 → "45.5%"
 */
export function formatPercentage(value: number | null): string {
  if (value === null) return '-';
  return `${value.toFixed(1)}%`;
}
