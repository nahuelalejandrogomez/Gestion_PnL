import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAsignaciones } from '../hooks/useAsignaciones';
import { useAsignacionMutations } from '../hooks/useAsignacionMutations';
import { AsignacionForm } from './AsignacionForm';
import type { Asignacion, CreateAsignacionDto, UpdateAsignacionDto } from '../types/asignacion.types';

const tipoLabels: Record<string, string> = {
  BILLABLE: 'Billable',
  NON_BILLABLE: 'Non-billable',
  OVERHEAD: 'Overhead',
  BENCH: 'Bench',
};

const tipoBadgeStyles: Record<string, string> = {
  BILLABLE: 'bg-stone-100 text-stone-700',
  NON_BILLABLE: 'bg-stone-50 text-stone-500',
  OVERHEAD: 'bg-amber-50/60 text-amber-600',
  BENCH: 'bg-stone-200 text-stone-500',
};

interface Props {
  proyectoId: string;
}

export function AsignacionesList({ proyectoId }: Props) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAsignacion, setEditingAsignacion] = useState<Asignacion | null>(null);

  const { data, isLoading } = useAsignaciones({ proyectoId, limit: 100 });
  const { createAsignacion, updateAsignacion, deleteAsignacion } = useAsignacionMutations();

  const handleCreate = (formData: CreateAsignacionDto | UpdateAsignacionDto) => {
    createAsignacion.mutate(formData as CreateAsignacionDto, {
      onSuccess: () => setIsCreateOpen(false),
    });
  };

  const handleUpdate = (formData: CreateAsignacionDto | UpdateAsignacionDto) => {
    if (!editingAsignacion) return;
    updateAsignacion.mutate(
      { id: editingAsignacion.id, data: formData as UpdateAsignacionDto },
      { onSuccess: () => setEditingAsignacion(null) },
    );
  };

  const handleDelete = (id: string) => {
    deleteAsignacion.mutate(id);
  };

  const formatDate = (d: string | null) => {
    if (!d) return 'Indefinida';
    return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const asignaciones = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-500">
          {asignaciones.length} recurso{asignaciones.length !== 1 ? 's' : ''} asignado{asignaciones.length !== 1 ? 's' : ''}
        </p>
        <Button
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="bg-stone-800 hover:bg-stone-700 text-white focus:ring-amber-200"
        >
          <Plus className="mr-2 h-4 w-4" />
          Asignar recurso
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-stone-100 animate-pulse" />
          ))}
        </div>
      ) : asignaciones.length === 0 ? (
        <p className="text-stone-500 text-center py-12">
          No hay recursos asignados a este proyecto.
        </p>
      ) : (
        <div className="divide-y divide-stone-100 rounded-lg border border-stone-200 bg-white overflow-hidden">
          {asignaciones.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-4 hover:bg-stone-50/50 transition-colors">
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium text-stone-600">
                    {a.recurso?.nombre?.[0]}{a.recurso?.apellido?.[0]}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-stone-800 truncate">
                    {a.recurso?.apellido}, {a.recurso?.nombre}
                    {a.rolEnProyecto && <span className="text-stone-400 font-normal"> — {a.rolEnProyecto}</span>}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-stone-500">
                    <span>{a.recurso?.perfil?.nombre || 'Sin perfil'}</span>
                    <span className="text-stone-300">|</span>
                    <span>{a.porcentajeAsignacion}%</span>
                    <span className="text-stone-300">|</span>
                    <span>{formatDate(a.fechaDesde)} → {formatDate(a.fechaHasta)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${tipoBadgeStyles[a.tipoTiempo] || 'bg-stone-100 text-stone-600'}`}>
                  {tipoLabels[a.tipoTiempo] || a.tipoTiempo}
                </span>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-stone-700" onClick={() => setEditingAsignacion(a)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-stone-200">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-stone-800">¿Eliminar asignación?</AlertDialogTitle>
                      <AlertDialogDescription className="text-stone-500">
                        Se eliminará la asignación de {a.recurso?.nombre} {a.recurso?.apellido}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-stone-200 text-stone-600">Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(a.id)} className="bg-red-600 text-white hover:bg-red-700">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <AsignacionForm
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        proyectoId={proyectoId}
        onSubmit={handleCreate}
        isLoading={createAsignacion.isPending}
      />

      {/* Edit Dialog */}
      <AsignacionForm
        open={!!editingAsignacion}
        onOpenChange={(v) => { if (!v) setEditingAsignacion(null); }}
        proyectoId={proyectoId}
        asignacion={editingAsignacion}
        onSubmit={handleUpdate}
        isLoading={updateAsignacion.isPending}
      />
    </div>
  );
}
