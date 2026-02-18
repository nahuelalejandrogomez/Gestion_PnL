/**
 * CurrencyToggle - Toggle USD/ARS para vistas Revenue
 * ÉPICA 3 US-008: Toggle USD/ARS y conversión moneda
 */

import type { Moneda } from '@/features/pnl/utils/pnl.format';

interface CurrencyToggleProps {
  moneda: Moneda;
  onChange: (moneda: Moneda) => void;
}

export function CurrencyToggle({ moneda, onChange }: CurrencyToggleProps) {
  return (
    <div className="inline-flex rounded-md shadow-sm border border-stone-200 bg-white">
      <button
        type="button"
        onClick={() => onChange('USD')}
        className={`
          px-3 py-1.5 text-xs font-medium transition-colors
          ${
            moneda === 'USD'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-stone-600 hover:bg-stone-50'
          }
          rounded-l-md border-r border-stone-200
        `}
      >
        USD
      </button>
      <button
        type="button"
        onClick={() => onChange('ARS')}
        className={`
          px-3 py-1.5 text-xs font-medium transition-colors
          ${
            moneda === 'ARS'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-stone-600 hover:bg-stone-50'
          }
          rounded-r-md
        `}
      >
        ARS
      </button>
    </div>
  );
}
