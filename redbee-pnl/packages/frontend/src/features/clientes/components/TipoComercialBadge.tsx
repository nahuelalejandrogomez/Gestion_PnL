import { cn } from '@/lib/utils';
import type { TipoComercialCliente } from '../types/cliente.types';

interface TipoComercialBadgeProps {
  tipoComercial: TipoComercialCliente;
  size?: 'sm' | 'default';
}

const tipoComercialConfig: Record<TipoComercialCliente, { label: string; className: string }> = {
  BASE_INSTALADA: {
    label: 'Base Instalada',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  NUEVA_VENTA: {
    label: 'Nueva Venta',
    className: 'bg-violet-50 text-violet-700 border-violet-200'
  },
};

export function TipoComercialBadge({ tipoComercial, size = 'default' }: TipoComercialBadgeProps) {
  const config = tipoComercialConfig[tipoComercial];
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium border rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
