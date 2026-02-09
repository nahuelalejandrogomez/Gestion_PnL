import type { EstadoProyecto } from '../types/proyecto.types';

const estadoStyles: Record<EstadoProyecto, string> = {
  ACTIVO: 'bg-stone-100 text-stone-700',
  PAUSADO: 'bg-stone-50 text-stone-500',
  CERRADO: 'bg-stone-200 text-stone-600',
  POTENCIAL: 'bg-amber-50 text-amber-700',
  TENTATIVO: 'bg-amber-50/60 text-amber-600',
};

const estadoLabels: Record<EstadoProyecto, string> = {
  ACTIVO: 'Activo',
  PAUSADO: 'Pausado',
  CERRADO: 'Cerrado',
  POTENCIAL: 'Potencial',
  TENTATIVO: 'Tentativo',
};

interface ProyectoBadgeProps {
  estado: EstadoProyecto;
  size?: 'sm' | 'default';
}

export function ProyectoBadge({ estado, size = 'default' }: ProyectoBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${estadoStyles[estado]} ${sizeClasses}`}
    >
      {estadoLabels[estado]}
    </span>
  );
}
