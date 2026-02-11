import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useProyectoPresupuesto, useUpdatePresupuesto } from '../hooks/useProyectoPresupuesto';

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
}

export function ProyectoPresupuestoGrid({ proyectoId }: Props) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [editingMonth, setEditingMonth] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const { data, isLoading } = useProyectoPresupuesto(proyectoId, year);
  const updateMutation = useUpdatePresupuesto();

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
    </Card>
  );
}
