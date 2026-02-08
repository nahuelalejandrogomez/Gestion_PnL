import { cn } from '@/lib/utils';
import type { EstadoCliente } from '../types/cliente.types';

interface ClienteBadgeProps {
  estado: EstadoCliente;
  size?: 'sm' | 'default';
}

const estadoConfig: Record<EstadoCliente, { label: string; className: string }> = {
  ACTIVO: { 
    label: 'Activo', 
    className: 'bg-stone-100 text-stone-700 border-stone-200' 
  },
  INACTIVO: { 
    label: 'Inactivo', 
    className: 'bg-stone-50 text-stone-500 border-stone-200' 
  },
  POTENCIAL: { 
    label: 'Potencial', 
    className: 'bg-amber-50 text-amber-700 border-amber-200' 
  },
};

export function ClienteBadge({ estado, size = 'default' }: ClienteBadgeProps) {
  const config = estadoConfig[estado];
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
