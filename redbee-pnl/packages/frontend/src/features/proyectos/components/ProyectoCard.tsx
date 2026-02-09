import { FolderKanban, Calendar, Users } from 'lucide-react';
import { ProyectoBadge } from './ProyectoBadge';
import type { Proyecto } from '../types/proyecto.types';

interface ProyectoCardProps {
  proyecto: Proyecto;
  onClick?: () => void;
}

const tipoLabels: Record<string, string> = {
  PROYECTO: 'Proyecto',
  POTENCIAL: 'Potencial',
  SOPORTE: 'Soporte',
  RETAINER: 'Retainer',
};

export function ProyectoCard({ proyecto, onClick }: ProyectoCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border border-stone-200 bg-white p-4 space-y-3 transition-colors ${onClick ? 'cursor-pointer hover:bg-stone-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
            <FolderKanban className="h-4 w-4 text-stone-600" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-stone-800 truncate">{proyecto.nombre}</p>
            <p className="text-sm text-stone-500 truncate">
              {proyecto.codigo} · {tipoLabels[proyecto.tipo] || proyecto.tipo}
            </p>
          </div>
        </div>
        <ProyectoBadge estado={proyecto.estado} size="sm" />
      </div>

      <div className="flex items-center gap-4 text-sm text-stone-500">
        {proyecto.cliente && (
          <span className="truncate">{proyecto.cliente.nombre}</span>
        )}
        <div className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatDate(proyecto.fechaInicio)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          <span>{proyecto._count?.asignaciones || 0}</span>
        </div>
      </div>
    </div>
  );
}
