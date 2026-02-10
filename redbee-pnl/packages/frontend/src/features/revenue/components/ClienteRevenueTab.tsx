import { useState } from 'react';
import { AlertCircle, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useClienteRevenue, useFxRates } from '../hooks/useClienteRevenue';
import { convertCurrency, formatCurrency, buildFxMap } from '@/lib/fx';
import type { Moneda } from '../types/revenue.types';

interface ClienteRevenueTabProps {
  clienteId: string;
}

const MONTH_NAMES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

export function ClienteRevenueTab({ clienteId }: ClienteRevenueTabProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedCurrency, setSelectedCurrency] = useState<Moneda>('USD');

  const { data: revenueData, isLoading: isLoadingRevenue } = useClienteRevenue(
    clienteId,
    selectedYear,
  );
  const { data: fxData, isLoading: isLoadingFx } = useFxRates(selectedYear);

  const isLoading = isLoadingRevenue || isLoadingFx;

  // Build FX map for quick lookups (month -> effective rate)
  const fxMap = fxData ? buildFxMap(fxData.rates) : {};

  // Generate year options (current year - 2 to current year + 3)
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);

  // Convert revenue to selected currency
  const convertRevenue = (amount: number, fromCurrency: Moneda, month: number): number => {
    const fxRate = fxMap[month] || null;
    const converted = convertCurrency(amount, fromCurrency, selectedCurrency, fxRate);
    return converted ?? amount; // Fallback to original if conversion fails
  };

  // Calculate totals per project (sum of all months)
  const calculateProjectTotal = (proyectoId: string): number => {
    if (!revenueData) return 0;
    let total = 0;
    for (const mesData of revenueData.meses) {
      const proyecto = mesData.proyectos.find((p) => p.proyectoId === proyectoId);
      if (proyecto) {
        total += convertRevenue(proyecto.revenue, proyecto.moneda, mesData.mes);
      }
    }
    return total;
  };

  // Calculate totals per month (sum of all projects)
  const calculateMonthTotal = (mes: number): number => {
    if (!revenueData) return 0;
    const mesData = revenueData.meses.find((m) => m.mes === mes);
    if (!mesData) return 0;
    return mesData.proyectos.reduce((sum, proyecto) => {
      return sum + convertRevenue(proyecto.revenue, proyecto.moneda, mes);
    }, 0);
  };

  // Calculate grand total (sum of all months and projects)
  const calculateGrandTotal = (): number => {
    if (!revenueData) return 0;
    return revenueData.meses.reduce((sum, mesData) => {
      return (
        sum +
        mesData.proyectos.reduce((monthSum, proyecto) => {
          return monthSum + convertRevenue(proyecto.revenue, proyecto.moneda, mesData.mes);
        }, 0)
      );
    }, 0);
  };

  // Get unique proyectos across all months
  const getUniqueProyectos = () => {
    if (!revenueData) return [];
    const proyectosMap = new Map<
      string,
      { proyectoId: string; proyectoNombre: string; codigo: string }
    >();
    for (const mesData of revenueData.meses) {
      for (const proyecto of mesData.proyectos) {
        if (!proyectosMap.has(proyecto.proyectoId)) {
          proyectosMap.set(proyecto.proyectoId, {
            proyectoId: proyecto.proyectoId,
            proyectoNombre: proyecto.proyectoNombre,
            codigo: proyecto.codigo,
          });
        }
      }
    }
    return Array.from(proyectosMap.values()).sort((a, b) =>
      a.proyectoNombre.localeCompare(b.proyectoNombre),
    );
  };

  // Get revenue for a specific project in a specific month
  const getProyectoRevenue = (proyectoId: string, mes: number): number => {
    if (!revenueData) return 0;
    const mesData = revenueData.meses.find((m) => m.mes === mes);
    if (!mesData) return 0;
    const proyecto = mesData.proyectos.find((p) => p.proyectoId === proyectoId);
    if (!proyecto) return 0;
    return convertRevenue(proyecto.revenue, proyecto.moneda, mes);
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

  if (!revenueData) {
    return (
      <Card className="border-stone-200 bg-white">
        <CardContent className="py-8">
          <p className="text-center text-stone-500">No se pudo cargar la información de revenue</p>
        </CardContent>
      </Card>
    );
  }

  const proyectos = getUniqueProyectos();
  const grandTotal = calculateGrandTotal();

  return (
    <Card className="border-stone-200 bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-stone-800 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-stone-600" />
              Revenue Anual
            </CardTitle>
            <CardDescription className="text-stone-500">
              Proyección de revenue por proyecto (Horas base: {revenueData.horasBaseMes}h/mes)
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {/* Currency Toggle */}
            <Select value={selectedCurrency} onValueChange={(val) => setSelectedCurrency(val as Moneda)}>
              <SelectTrigger className="w-[100px] border-stone-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="ARS">ARS</SelectItem>
              </SelectContent>
            </Select>

            {/* Year Selector */}
            <Select
              value={selectedYear.toString()}
              onValueChange={(val) => setSelectedYear(parseInt(val))}
            >
              <SelectTrigger className="w-[120px] border-stone-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Warnings */}
        {revenueData.warnings.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">Advertencias:</p>
                <ul className="text-sm text-amber-700 mt-1 space-y-1">
                  {revenueData.warnings.map((warning, idx) => (
                    <li key={idx}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-stone-200">
                <th className="text-left py-3 px-2 font-semibold text-stone-700 sticky left-0 bg-white z-10">
                  Proyecto
                </th>
                {MONTH_NAMES.map((month, idx) => (
                  <th
                    key={idx}
                    className="text-right py-3 px-2 font-semibold text-stone-700 min-w-[80px]"
                  >
                    {month}
                  </th>
                ))}
                <th className="text-right py-3 px-2 font-semibold text-stone-700 min-w-[100px] bg-stone-50">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {proyectos.length === 0 ? (
                <tr>
                  <td colSpan={14} className="text-center py-8 text-stone-500">
                    No hay proyectos con revenue en este año
                  </td>
                </tr>
              ) : (
                <>
                  {proyectos.map((proyecto) => {
                    const projectTotal = calculateProjectTotal(proyecto.proyectoId);
                    return (
                      <tr key={proyecto.proyectoId} className="border-b border-stone-100 hover:bg-stone-50">
                        <td className="py-2 px-2 sticky left-0 bg-white">
                          <div>
                            <p className="font-medium text-stone-800">{proyecto.proyectoNombre}</p>
                            <p className="text-xs text-stone-500 font-mono">{proyecto.codigo}</p>
                          </div>
                        </td>
                        {[...Array(12)].map((_, idx) => {
                          const mes = idx + 1;
                          const revenue = getProyectoRevenue(proyecto.proyectoId, mes);
                          return (
                            <td key={mes} className="text-right py-2 px-2 tabular-nums text-stone-700">
                              {revenue > 0 ? formatCurrency(revenue, selectedCurrency, { decimals: 0 }) : '-'}
                            </td>
                          );
                        })}
                        <td className="text-right py-2 px-2 font-semibold tabular-nums text-stone-800 bg-stone-50">
                          {formatCurrency(projectTotal, selectedCurrency, { decimals: 0 })}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Totals Row */}
                  <tr className="border-t-2 border-stone-300 bg-stone-100 font-bold">
                    <td className="py-3 px-2 sticky left-0 bg-stone-100 z-10 text-stone-800">
                      Total
                    </td>
                    {[...Array(12)].map((_, idx) => {
                      const mes = idx + 1;
                      const monthTotal = calculateMonthTotal(mes);
                      return (
                        <td key={mes} className="text-right py-3 px-2 tabular-nums text-stone-800">
                          {formatCurrency(monthTotal, selectedCurrency, { decimals: 0 })}
                        </td>
                      );
                    })}
                    <td className="text-right py-3 px-2 tabular-nums text-stone-900 bg-stone-200">
                      {formatCurrency(grandTotal, selectedCurrency, { decimals: 0 })}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Info */}
        <div className="mt-4 flex items-center justify-between text-sm text-stone-600">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-stone-300">
              {proyectos.length} proyecto{proyectos.length !== 1 ? 's' : ''}
            </Badge>
            {fxData && (
              <span className="text-xs">
                Conversión con TC {selectedYear} ({fxData.rates.some((r) => r.isFallback) ? 'con fallbacks' : 'completo'})
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
