import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
} from '@/components/ui/alert-dialog';
import { usePlan, useUpdatePlan, useAplicarTarifario } from '../hooks/usePlan';
import { useTarifarios } from '@/features/tarifarios';

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface Props {
  proyectoId: string;
  clienteId: string;
}

export function ProyectoTarifarioPlanGrid({ proyectoId, clienteId }: Props) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedTarifarioId, setSelectedTarifarioId] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [dirtyCells, setDirtyCells] = useState<Map<string, number>>(new Map());

  const { data: plan, isLoading } = usePlan(proyectoId, year);
  const { data: tarifariosData } = useTarifarios({ clienteId, estado: 'ACTIVO' });
  const updateMutation = useUpdatePlan();
  const aplicarMutation = useAplicarTarifario();

  const handleYearChange = (delta: number) => {
    setYear((prev) => prev + delta);
    setDirtyCells(new Map());
  };

  const handleAplicarClick = () => {
    if (!selectedTarifarioId) return;
    setShowConfirmDialog(true);
  };

  const handleConfirmAplicar = () => {
    if (!selectedTarifarioId) return;
    aplicarMutation.mutate(
      { proyectoId, year, dto: { tarifarioId: selectedTarifarioId } },
      { onSuccess: () => setShowConfirmDialog(false) }
    );
  };

  const handleCellClick = (lineaTarifarioId: string, month: number, currentValue: number) => {
    const key = `${lineaTarifarioId}-${month}`;
    setEditingCell(key);
    setEditValue(currentValue.toString());
  };

  const handleCellSave = useCallback(
    (lineaTarifarioId: string, month: number) => {
      const newValue = parseFloat(editValue);
      if (isNaN(newValue) || newValue < 0) {
        setEditingCell(null);
        return;
      }

      const key = `${lineaTarifarioId}-${month}`;
      const newDirty = new Map(dirtyCells);
      newDirty.set(key, newValue);
      setDirtyCells(newDirty);
      setEditingCell(null);
    },
    [editValue, dirtyCells]
  );

  const handleKeyDown = (e: React.KeyboardEvent, lineaTarifarioId: string, month: number) => {
    if (e.key === 'Enter') {
      handleCellSave(lineaTarifarioId, month);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const handleGuardar = () => {
    if (!plan || dirtyCells.size === 0) return;

    const meses = Array.from(dirtyCells.entries()).map(([key, cantidad]) => {
      const [lineaTarifarioId, monthStr] = key.split('-');
      return {
        lineaTarifarioId,
        month: parseInt(monthStr),
        cantidad,
        isOverride: true,
      };
    });

    updateMutation.mutate(
      {
        proyectoId,
        year,
        dto: {
          tarifarioId: plan.tarifarioId,
          meses,
        },
      },
      {
        onSuccess: () => setDirtyCells(new Map()),
      }
    );
  };

  const getCellValue = (lineaTarifarioId: string, month: number): number => {
    const key = `${lineaTarifarioId}-${month}`;
    if (dirtyCells.has(key)) {
      return dirtyCells.get(key)!;
    }
    if (plan) {
      const linea = plan.lineas.find((l) => l.lineaTarifarioId === lineaTarifarioId);
      const mes = linea?.meses.find((m) => m.month === month);
      return mes?.cantidad || 0;
    }
    return 0;
  };

  const isOverride = (lineaTarifarioId: string, month: number): boolean => {
    if (plan) {
      const linea = plan.lineas.find((l) => l.lineaTarifarioId === lineaTarifarioId);
      const mes = linea?.meses.find((m) => m.month === month);
      return mes?.isOverride || false;
    }
    return false;
  };

  if (isLoading) {
    return (
      <Card className="border-stone-200 bg-white">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const currentMonth = new Date().getMonth();
  const currentMonthName = MONTH_LABELS[currentMonth];

  return (
    <Card className="border-stone-200 bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-stone-800">
              Plan Tarifario Mensual
            </CardTitle>
            <CardDescription className="text-stone-500">
              Cantidad de FTEs por perfil/seniority
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleYearChange(-1)}
              className="h-8 w-8 border-stone-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-stone-700 w-16 text-center">{year}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleYearChange(1)}
              className="h-8 w-8 border-stone-200"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Tarifario selector */}
        <div className="mb-6 p-4 bg-stone-50 rounded-lg border border-stone-200">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label htmlFor="tarifario-selector" className="text-sm font-medium text-stone-700 mb-2 block">
                Tarifario del cliente
              </Label>
              <Select value={selectedTarifarioId} onValueChange={setSelectedTarifarioId}>
                <SelectTrigger id="tarifario-selector" className="w-full">
                  <SelectValue placeholder="Seleccionar tarifario" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[200]">
                  {tarifariosData?.items && tarifariosData.items.length > 0 ? (
                    tarifariosData.items
                      .filter((t) => t.estado === 'ACTIVO')
                      .map((tarifario) => (
                        <SelectItem key={tarifario.id} value={tarifario.id}>
                          {tarifario.nombre} • {tarifario.moneda}
                        </SelectItem>
                      ))
                  ) : (
                    <div className="p-2 text-sm text-stone-500">
                      No hay tarifarios activos
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAplicarClick}
              disabled={!selectedTarifarioId || aplicarMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {aplicarMutation.isPending ? 'Aplicando...' : 'Aplicar'}
            </Button>
          </div>
          <p className="text-xs text-stone-500 mt-2">
            Se creará la estructura desde {currentMonthName} hasta Dic con cantidad = 0
          </p>
        </div>

        {/* Grid */}
        {plan && plan.lineas.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="text-left text-xs font-semibold text-stone-600 py-2 px-3 sticky left-0 bg-white z-10">
                      Perfil
                    </th>
                    <th className="text-left text-xs font-semibold text-stone-600 py-2 px-2">
                      Seniority
                    </th>
                    <th className="text-right text-xs font-semibold text-stone-600 py-2 px-2">
                      Rate
                    </th>
                    {MONTH_LABELS.map((label, idx) => (
                      <th
                        key={idx}
                        className="text-center text-xs font-semibold text-stone-600 py-2 px-2 min-w-[80px]"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plan.lineas.map((linea) => (
                    <tr key={linea.id} className="border-b border-stone-100 hover:bg-stone-50">
                      <td className="py-2 px-3 text-sm font-medium text-stone-700 sticky left-0 bg-white">
                        {linea.perfil?.nombre || '-'}
                      </td>
                      <td className="py-2 px-2 text-sm text-stone-600">
                        {linea.perfil?.nivel || '-'}
                      </td>
                      <td className="py-2 px-2 text-right text-sm font-mono text-stone-600">
                        {linea.rateSnapshot.toLocaleString()} {linea.monedaSnapshot}
                      </td>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => {
                        const key = `${linea.lineaTarifarioId}-${month}`;
                        const isEditing = editingCell === key;
                        const value = getCellValue(linea.lineaTarifarioId, month);
                        const hasOverride = isOverride(linea.lineaTarifarioId, month);
                        const isDirty = dirtyCells.has(key);

                        return (
                          <td key={month} className="py-2 px-2 text-center relative">
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, linea.lineaTarifarioId, month)}
                                onBlur={() => handleCellSave(linea.lineaTarifarioId, month)}
                                autoFocus
                                className="h-7 text-center text-xs px-1"
                                min={0}
                                step={0.1}
                              />
                            ) : (
                              <button
                                onClick={() => handleCellClick(linea.lineaTarifarioId, month, value)}
                                className={`w-full h-7 text-xs font-mono rounded px-1 ${
                                  isDirty
                                    ? 'bg-amber-100 ring-2 ring-amber-400'
                                    : 'hover:bg-stone-100'
                                }`}
                              >
                                {value > 0 ? value.toFixed(1) : '-'}
                                {hasOverride && !isDirty && (
                                  <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                )}
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            {dirtyCells.size > 0 && (
              <div className="mt-4 flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-md">
                <span className="text-sm text-amber-800">
                  {dirtyCells.size} cambio{dirtyCells.size !== 1 ? 's' : ''} sin guardar
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDirtyCells(new Map())}
                    className="border-stone-300"
                  >
                    Descartar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleGuardar}
                    disabled={updateMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center gap-2 text-xs text-stone-500">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>Valor editado</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-4 h-4 bg-amber-100 border-2 border-amber-400 rounded" />
                <span>Cambio sin guardar</span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-stone-500">
            <p className="text-sm">No hay plan cargado para este año.</p>
            <p className="text-xs mt-1">Seleccioná un tarifario y hacé click en "Aplicar" para comenzar.</p>
          </div>
        )}
      </CardContent>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="border-stone-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-stone-800">
              ¿Aplicar tarifario?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-stone-500">
              Esto creará la estructura de planificación desde <strong>{currentMonthName}</strong> hasta{' '}
              <strong>Dic</strong> con los perfiles del tarifario seleccionado.
              <br />
              <br />
              Las cantidades iniciales serán 0 (podés editarlas después).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-stone-200 text-stone-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAplicar}
              className="bg-blue-600 text-white hover:bg-blue-700"
              disabled={aplicarMutation.isPending}
            >
              {aplicarMutation.isPending ? 'Aplicando...' : 'Aplicar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
