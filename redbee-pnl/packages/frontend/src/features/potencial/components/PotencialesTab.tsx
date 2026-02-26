/**
 * PotencialesTab — Gestión de Potenciales en detalle de cliente (B-27 + B-28)
 * Fuente: SPEC/modules/potencial.md
 *
 * B-27: CRUD de ClientePotencial con líneas y meses
 * B-28: Conversión ACTIVO → GANADO | PERDIDO
 */

import { useState } from 'react';
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { usePotenciales, usePotencialMutations } from '../hooks/usePotenciales';
import { PotencialForm } from './PotencialForm';
import type { ClientePotencial, EstadoPotencial } from '../types/potencial.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function estadoBadge(estado: EstadoPotencial) {
  switch (estado) {
    case 'ACTIVO':
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-medium">Activo</Badge>;
    case 'GANADO':
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-medium">Ganado</Badge>;
    case 'PERDIDO':
      return <Badge className="bg-stone-100 text-stone-500 border-stone-200 font-medium">Perdido</Badge>;
  }
}

function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function calcRevenuePonderado(potencial: ClientePotencial, year: number): number {
  const prob = potencial.probabilidadCierre / 100;
  let total = 0;
  for (const linea of potencial.lineas) {
    for (const mes of linea.meses) {
      if (mes.year === year) {
        total += mes.revenueEstimado * prob;
      }
    }
  }
  return total;
}

// ─── Card individual de Potencial ─────────────────────────────────────────────

function PotencialCard({
  potencial,
  onEdit,
  onEliminar,
  onGanado,
  onPerdido,
  isLoadingEstado,
}: {
  potencial: ClientePotencial;
  onEdit: () => void;
  onEliminar: () => void;
  onGanado: () => void;
  onPerdido: () => void;
  isLoadingEstado: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const currentYear = new Date().getFullYear();
  const revPonderado = calcRevenuePonderado(potencial, currentYear);

  return (
    <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
      {/* Header del card */}
      <div className="flex items-start justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-stone-400 hover:text-stone-600 transition-colors"
          >
            {expanded
              ? <ChevronDown className="h-4 w-4" />
              : <ChevronRight className="h-4 w-4" />
            }
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-800">{potencial.nombre}</span>
              {estadoBadge(potencial.estado)}
              <Badge variant="outline" className="text-xs border-stone-200 text-stone-500">
                {potencial.moneda}
              </Badge>
            </div>
            {potencial.descripcion && (
              <p className="text-xs text-stone-500 mt-0.5">{potencial.descripcion}</p>
            )}
          </div>
        </div>

        {/* KPIs rápidos */}
        <div className="flex items-center gap-6 text-right">
          <div>
            <p className="text-[10px] text-stone-400 uppercase tracking-wide">Prob. cierre</p>
            <p className="font-bold text-stone-800 tabular-nums">{potencial.probabilidadCierre}%</p>
          </div>
          {revPonderado > 0 && (
            <div>
              <p className="text-[10px] text-stone-400 uppercase tracking-wide">Rev. pond. {currentYear}</p>
              <p className="font-bold text-amber-700 tabular-nums">
                {potencial.moneda} {Math.round(revPonderado).toLocaleString('en-US')}
              </p>
            </div>
          )}
          {potencial.fechaEstimadaCierre && (
            <div>
              <p className="text-[10px] text-stone-400 uppercase tracking-wide">Cierre est.</p>
              <p className="font-medium text-stone-600">{fmtDate(potencial.fechaEstimadaCierre)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Detalle expandible: líneas */}
      {expanded && potencial.lineas.length > 0 && (
        <div className="border-t border-stone-100 px-4 py-3 bg-stone-50/40">
          <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide mb-2">
            Líneas ({potencial.lineas.length})
          </p>
          <div className="space-y-1">
            {potencial.lineas.map((linea) => (
              <div key={linea.id} className="flex items-center gap-3 text-xs text-stone-600">
                <span className="font-medium text-stone-700">
                  {linea.perfil ? `${linea.perfil.nombre}${linea.perfil.nivel ? ` ${linea.perfil.nivel}` : ''}` : linea.perfilId}
                </span>
                {linea.nombreLinea && (
                  <span className="text-stone-400">— {linea.nombreLinea}</span>
                )}
                {linea.meses.length > 0 && (
                  <span className="text-stone-400">
                    ({linea.meses.length} mes{linea.meses.length !== 1 ? 'es' : ''})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {expanded && potencial.notas && (
        <div className="border-t border-stone-100 px-4 py-2 bg-stone-50/40">
          <p className="text-xs text-stone-500">{potencial.notas}</p>
        </div>
      )}

      {/* Acciones */}
      <div className="border-t border-stone-100 px-4 py-2 flex items-center justify-between bg-stone-50/20">
        <div className="flex items-center gap-2">
          {/* B-28: Conversión solo disponible para ACTIVO */}
          {potencial.estado === 'ACTIVO' && (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50 h-7"
                    disabled={isLoadingEstado}
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Marcar como ganado
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border-stone-200">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-stone-800">
                      ¿Marcar "{potencial.nombre}" como ganado?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-stone-500">
                      El potencial dejará de aparecer en el P&L y Rolling. Si ya existe un
                      proyecto asociado, quedará vinculado. Esta acción es reversible editando el estado.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-stone-200 text-stone-600">Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onGanado}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Confirmar — Ganado
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs border-stone-200 text-stone-500 hover:bg-stone-50 h-7"
                    disabled={isLoadingEstado}
                  >
                    <TrendingDown className="h-3 w-3 mr-1" />
                    Marcar como perdido
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border-stone-200">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-stone-800">
                      ¿Marcar "{potencial.nombre}" como perdido?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-stone-500">
                      El potencial quedará en histórico y no aparecerá en el P&L activo.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-stone-200 text-stone-600">Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onPerdido}
                      className="bg-stone-700 text-white hover:bg-stone-800"
                    >
                      Confirmar — Perdido
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-stone-500 hover:text-stone-700 h-7"
            onClick={onEdit}
          >
            <Pencil className="h-3 w-3 mr-1" />
            Editar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 h-7"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-stone-200">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-stone-800">¿Eliminar "{potencial.nombre}"?</AlertDialogTitle>
                <AlertDialogDescription className="text-stone-500">
                  Esta acción eliminará el potencial y todas sus líneas. No se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-stone-200 text-stone-600">Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onEliminar}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────────

interface PotencialesTabProps {
  clienteId: string;
  clienteNombre?: string;
}

export function PotencialesTab({ clienteId, clienteNombre }: PotencialesTabProps) {
  const { data: potenciales, isLoading } = usePotenciales(clienteId);
  const { create, update, remove, upsertLineas, cambiarEstado } = usePotencialMutations(clienteId);

  const [formOpen, setFormOpen] = useState(false);
  const [editingPotencial, setEditingPotencial] = useState<ClientePotencial | null>(null);

  const handleOpenCreate = () => {
    setEditingPotencial(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (p: ClientePotencial) => {
    setEditingPotencial(p);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingPotencial(null);
  };

  const handleSubmit = (data: {
    potencial: Parameters<typeof create.mutate>[0];
    lineas: Parameters<typeof upsertLineas.mutate>[0]['lineas'];
  }, potencialId?: string) => {
    if (potencialId) {
      update.mutate(
        { id: potencialId, dto: data.potencial as any },
        {
          onSuccess: (updated) => {
            if (data.lineas.length > 0) {
              upsertLineas.mutate({ potencialId: updated.id, lineas: data.lineas }, {
                onSuccess: handleFormClose,
              });
            } else {
              handleFormClose();
            }
          },
        },
      );
    } else {
      create.mutate(
        { ...data.potencial as any, lineas: undefined },
        {
          onSuccess: (created) => {
            if (data.lineas.length > 0) {
              upsertLineas.mutate({ potencialId: created.id, lineas: data.lineas }, {
                onSuccess: handleFormClose,
              });
            } else {
              handleFormClose();
            }
          },
        },
      );
    }
  };

  if (isLoading) {
    return (
      <Card className="border-stone-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Potenciales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full bg-stone-100" />
          <Skeleton className="h-16 w-full bg-stone-100" />
        </CardContent>
      </Card>
    );
  }

  const activos = potenciales?.filter(p => p.estado === 'ACTIVO') ?? [];
  const inactivos = potenciales?.filter(p => p.estado !== 'ACTIVO') ?? [];

  return (
    <Card className="border-stone-200 bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-stone-800">Potenciales</CardTitle>
            <p className="text-xs text-stone-500 mt-0.5">
              Oportunidades de venta aún no firmadas. Se reflejan en el P&L con ponderación por probabilidad.
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="bg-stone-800 hover:bg-stone-900 text-white text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nuevo potencial
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Activos */}
        {activos.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
              Activos ({activos.length})
            </p>
            {activos.map(p => (
              <PotencialCard
                key={p.id}
                potencial={p}
                onEdit={() => handleOpenEdit(p)}
                onEliminar={() => remove.mutate(p.id)}
                onGanado={() => cambiarEstado.mutate({ id: p.id, dto: { estado: 'GANADO' } })}
                onPerdido={() => cambiarEstado.mutate({ id: p.id, dto: { estado: 'PERDIDO' } })}
                isLoadingEstado={cambiarEstado.isPending}
              />
            ))}
          </div>
        )}

        {/* Histórico (ganados/perdidos) — colapsado por defecto */}
        {inactivos.length > 0 && (
          <HistoricoSection inactivos={inactivos} onEdit={handleOpenEdit} onEliminar={(id) => remove.mutate(id)} />
        )}

        {/* Estado vacío */}
        {(!potenciales || potenciales.length === 0) && (
          <div className="text-center py-12 text-stone-400">
            <p className="text-sm">No hay potenciales registrados para {clienteNombre || 'este cliente'}.</p>
            <p className="text-xs mt-1">Creá uno para que aparezca en el P&L y Rolling.</p>
          </div>
        )}
      </CardContent>

      {/* Formulario de alta/edición */}
      <PotencialForm
        open={formOpen}
        onOpenChange={handleFormClose}
        clienteId={clienteId}
        potencial={editingPotencial}
        onSubmit={handleSubmit}
        isLoading={create.isPending || update.isPending || upsertLineas.isPending}
      />
    </Card>
  );
}

// ─── Sección histórico ─────────────────────────────────────────────────────────

function HistoricoSection({
  inactivos,
  onEdit,
  onEliminar,
}: {
  inactivos: ClientePotencial[];
  onEdit: (p: ClientePotencial) => void;
  onEliminar: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-2 text-[10px] font-semibold text-stone-400 uppercase tracking-wider hover:text-stone-600 transition-colors"
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        Histórico — Ganados / Perdidos ({inactivos.length})
      </button>
      {expanded && (
        <div className="mt-2 space-y-2">
          {inactivos.map(p => (
            <div key={p.id} className="rounded-lg border border-stone-100 bg-stone-50/60 px-4 py-2.5 flex items-center justify-between opacity-70">
              <div className="flex items-center gap-2">
                {estadoBadge(p.estado)}
                <span className="text-sm text-stone-600">{p.nombre}</span>
                <span className="text-xs text-stone-400">{p.probabilidadCierre}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" className="h-6 text-xs text-stone-400" onClick={() => onEdit(p)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-6 text-xs text-red-400 hover:text-red-600">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar "{p.nombre}"?</AlertDialogTitle>
                      <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onEliminar(p.id)} className="bg-red-600 hover:bg-red-700">
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
