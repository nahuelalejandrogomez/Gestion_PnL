import { cn } from '@/lib/utils';
import type { PaisCliente } from '../types/cliente.types';

interface PaisBadgeProps {
  pais: PaisCliente;
  size?: 'sm' | 'default';
}

const paisConfig: Record<PaisCliente, { label: string; className: string }> = {
  AR: {
    label: 'AR',
    className: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  UY: {
    label: 'UY',
    className: 'bg-sky-50 text-sky-700 border-sky-200'
  },
  CL: {
    label: 'CL',
    className: 'bg-red-50 text-red-700 border-red-200'
  },
  MX: {
    label: 'MX',
    className: 'bg-green-50 text-green-700 border-green-200'
  },
  US: {
    label: 'US',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  BR: {
    label: 'BR',
    className: 'bg-yellow-50 text-yellow-700 border-yellow-200'
  },
  PE: {
    label: 'PE',
    className: 'bg-orange-50 text-orange-700 border-orange-200'
  },
  CO: {
    label: 'CO',
    className: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  OTRO: {
    label: 'Otro',
    className: 'bg-stone-50 text-stone-600 border-stone-200'
  },
};

export function PaisBadge({ pais, size = 'default' }: PaisBadgeProps) {
  const config = paisConfig[pais];
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
