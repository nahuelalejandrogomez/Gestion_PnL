import { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { useProyectoPresupuesto, useUpdatePresupuesto, useClientePresupuestos, useAplicarClientePresupuesto } from '../hooks/useProyectoPresupuesto';

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// Format currency without decimals
function formatCurrency(value: number, currency: string): string {
  if (value === 0) return '-';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : currency === 'ARS' ? 'ARS' : 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface Props {
  proyectoId: string;
  clienteId: string;
}

export function ProyectoPresupuestoGrid({ proyectoId, clienteId }: Props) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [editingMonth, setEditingMonth] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [selectedPresupuestoId, setSelectedPresupuestoId] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { data, isLoading } = useProyectoPresupuesto(proyectoId, year);
  const updateMutation = useUpdatePresupuesto();
  const { data: clientePresupuestos, isLoading: isLoadingPresupuestos, error: presupuestosError } = useClientePresupuestos(clienteId);
  const aplicarMutation = useAplicarClientePresupuesto();

  const handleYearChange = (delta: number) => {
    setYear((prev) => prev + delta);
  };

  const handleCellClick = (month: number, currentAmount: number) => {
    setEditingMonth(month);
    setEditValue(currentAmount.toString());
  };

  const handleSave = useCallback(
    (month: number) => {
      if (!data) return;

      const newAmount = parseFloat(editValue);
      if (isNaN(newAmount) || newAmount < 0) {
        setEditingMonth(null);
        return;
      }

      updateMutation.mutate({
        proyectoId,
        year,
        dto: {
          months: [{ month, amount: newAmount, isOverride: true }],
        },
      });

      setEditingMonth(null);
    },
    [editValue, data, proyectoId, year, updateMutation]
  );

  const handleKeyDown = (e: React.KeyboardEvent, month: number) => {
    if (e.key === 'Enter') {
      handleSave(month);
    } else if (e.key === 'Escape') {
      setEditingMonth(null);
    }
  };

  const handleBlur = (month: number) => {
    handleSave(month);
  };

  const handleAplicarClick = () => {
    if (!selectedPresupuestoId) return;
    setShowConfirmDialog(true);
  };

  const handleConfirmAplicar = () => {
    if (!selectedPresupuestoId) return;

    aplicarMutation.mutate(
      {
        proyectoId,
        year,
        dto: {
          clientePresupuestoId: selectedPresupuestoId,
        },
      },
      {
        onSuccess: () => {
          setShowConfirmDialog(false);
        },
      }
    );
  };

  // Get current month name for confirmation dialog
  const currentMonth = new Date().getMonth();
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const currentMonthName = monthNames[currentMonth];

  // Debug: log presupuestos data
  console.log('[ProyectoPresupuestoGrid] Debug info:', {
    proyectoId,
    clienteId,
    year,
    selectedPresupuestoId,
    isLoadingPresupuestos,
    presupuestosError: presupuestosError ? String(presupuestosError) : null,
    clientePresupuestos,
    presupuestosCount: clientePresupuestos?.length || 0,
    presupuestosActivos: clientePresupuestos?.filter((p) => p.estado?.toUpperCase() === 'ACTIVO').length || 0,
  });

  // Debug: log when Select opens/closes
  const handleSelectOpenChange = (open: boolean) => {
    console.log('[ProyectoPresupuestoGrid] Select open state changed:', open);
  };

  // Show error toast if presupuestos query fails
  useEffect(() => {
    if (presupuestosError) {
      console.error('[ProyectoPresupuestoGrid] Error loading cliente presupuestos:', presupuestosError);
      toast.error('No se pudieron cargar los presupuestos del cliente');
    }
  }, [presupuestosError]);

  if (isLoading) {
    return (
      <Card className="border-stone-200 bg-white">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="border-stone-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-stone-800">Presupuesto</CardTitle>
          <CardDescription className="text-stone-500">
            No se pudo cargar el presupuesto
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-stone-200 bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-stone-800">
              Presupuesto
            </CardTitle>
            <CardDescription className="text-stone-500">
              Revenue planificado mensual • {data.moneda}
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
        {/* Selector de presupuesto del cliente */}
        <div className="mb-6 p-4 bg-stone-50 rounded-lg border border-stone-200">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label htmlFor="cliente-presupuesto" className="text-sm font-medium text-stone-700 mb-2 block">
                Presupuesto del cliente
              </Label>
              <Select
                value={selectedPresupuestoId}
                onValueChange={setSelectedPresupuestoId}
                onOpenChange={handleSelectOpenChange}
              >
                <SelectTrigger id="cliente-presupuesto" className="w-full" disabled={isLoadingPresupuestos}>
                  <SelectValue placeholder={
                    isLoadingPresupuestos
                      ? "Cargando..."
                      : presupuestosError
                        ? "Error al cargar presupuestos"
                        : "Seleccionar presupuesto"
                  } />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[200] max-h-[300px] overflow-y-auto">
                  {isLoadingPresupuestos ? (
                    <div className="p-2 text-sm text-stone-500">Cargando presupuestos...</div>
                  ) : presupuestosError ? (
                    <div className="p-2 text-sm text-red-600">
                      Error: {presupuestosError instanceof Error ? presupuestosError.message : 'Error desconocido'}
                    </div>
                  ) : clientePresupuestos && clientePresupuestos.length > 0 ? (
                    <>
                      {clientePresupuestos
                        .filter((p) => p.estado?.toUpperCase() === 'ACTIVO')
                        .map((presupuesto) => (
                          <SelectItem key={presupuesto.id} value={presupuesto.id}>
                            {presupuesto.nombre} • {presupuesto.moneda}
                          </SelectItem>
                        ))}
                      {clientePresupuestos.filter((p) => p.estado?.toUpperCase() === 'ACTIVO').length === 0 && (
                        <div className="p-2 text-sm text-stone-500">
                          El cliente no tiene presupuestos activos
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-2 text-sm text-stone-500">
                      El cliente no tiene presupuestos
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAplicarClick}
              disabled={!selectedPresupuestoId || aplicarMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {aplicarMutation.isPending ? 'Aplicando...' : 'Aplicar'}
            </Button>
          </div>
          <p className="text-xs text-stone-500 mt-2">
            Se aplicarán los montos desde {currentMonthName} hasta Dic. Los meses previos no se modificarán.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-stone-200">
                <th className="text-left text-xs font-semibold text-stone-600 py-2 px-3 sticky left-0 bg-white z-10">
                  Concepto
                </th>
                {MONTH_LABELS.map((label, idx) => (
                  <th
                    key={idx}
                    className="text-center text-xs font-semibold text-stone-600 py-2 px-2 min-w-[80px]"
                  >
                    {label}
                  </th>
                ))}
                <th className="text-center text-xs font-semibold text-stone-600 py-2 px-3 min-w-[100px] bg-stone-50">
                  TOTAL
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-stone-100 hover:bg-stone-50">
                <td className="py-2 px-3 text-sm font-medium text-stone-700 sticky left-0 bg-white">
                  Presupuesto
                </td>
                {data.months.map((mes) => {
                  const isEditing = editingMonth === mes.month;
                  return (
                    <td
                      key={mes.month}
                      className="py-2 px-2 text-center relative"
                    >
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, mes.month)}
                          onBlur={() => handleBlur(mes.month)}
                          autoFocus
                          className="h-7 text-right text-xs px-1"
                          min={0}
                        />
                      ) : (
                        <button
                          onClick={() => handleCellClick(mes.month, mes.amount)}
                          className="w-full h-7 text-xs font-mono text-stone-800 hover:bg-stone-100 rounded px-1 text-right relative"
                        >
                          {formatCurrency(mes.amount, data.moneda)}
                          {mes.isOverride && (
                            <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          )}
                        </button>
                      )}
                    </td>
                  );
                })}
                <td className="py-2 px-3 text-center bg-stone-50">
                  <span className="text-sm font-bold font-mono text-stone-800">
                    {formatCurrency(data.totalAnual, data.moneda)}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-stone-500">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
            <span>Valor modificado manualmente</span>
          </div>
        </div>
      </CardContent>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="border-stone-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-stone-800">
              ¿Aplicar presupuesto del cliente?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-stone-500">
              Esto completará los meses desde <strong>{currentMonthName}</strong> hasta <strong>Dic</strong> con los valores del presupuesto seleccionado.
              <br />
              <br />
              Los meses previos no se modificarán. Los valores aplicados se marcarán como editados manualmente.
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
