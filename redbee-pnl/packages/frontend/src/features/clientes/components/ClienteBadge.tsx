import { cn } from '@/lib/utils';
import type { EstadoCliente } from '../types/cliente.types';

interface ClienteBadgeProps {
  estado: EstadoCliente;
  size?: 'sm' | 'default';
}

const estadoConfig: Record<EstadoCliente, { label: string; className: string }> = {
  ACTIVO: { 
    label: 'Activo', 
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200' 
  },
  INACTIVO: { 
    label: 'Inactivo', 
    className: 'bg-slate-50 text-slate-600 border-slate-200' 
  },
  POTENCIAL: { 
    label: 'Potencial', 
    className: 'bg-blue-50 text-blue-700 border-blue-200' 
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
