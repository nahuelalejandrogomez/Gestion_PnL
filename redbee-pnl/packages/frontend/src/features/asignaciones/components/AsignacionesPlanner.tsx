import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Save, X, Percent, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useQueryClient } from '@tanstack/react-query';
import { usePlannerData, usePlannerSave, usePlannerDeleteAsignacion, PLANNER_QUERY_KEY } from '../hooks/usePlanner';
import { useAsignacionMutations } from '../hooks/useAsignacionMutations';
import { useConfig, DEFAULT_CONFIG } from '@/features/config';
import { PlannerCell } from './PlannerCell';
import { ResourceCombobox } from './ResourceCombobox';
import type { PlannerRow } from '../types/asignacion.types';

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

type ViewMode = 'percentage' | 'cost';

// Format currency (ARS/USD) without decimals
function formatCurrency(value: number, currency: string): string {
  if (value === 0) return '-';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface Props {
  proyectoId: string;
}

export function AsignacionesPlanner({ proyectoId }: Props) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [dirtyCells, setDirtyCells] = useState<Map<string, number>>(new Map());
  const [viewMode, setViewMode] = useState<ViewMode>('percentage');
  const paintRef = useRef<{ active: boolean; value: number }>({ active: false, value: 0 });

  const queryClient = useQueryClient();
  const { data, isLoading } = usePlannerData(proyectoId, year);
  const saveMutation = usePlannerSave(proyectoId);
  const deleteAsignacion = usePlannerDeleteAsignacion();
  const { createAsignacion } = useAsignacionMutations();
  
  // Config for cost calculations
  const { data: config, isError: configError } = useConfig();
  const costoEmpresaPct = config?.costoEmpresaPct ?? DEFAULT_CONFIG.costoEmpresaPct;
  const isUsingDefaultConfig = configError || !config;

  // Stop paint on mouseup
  useEffect(() => {
    const stop = () => { paintRef.current.active = false; };
    window.addEventListener('mouseup', stop);
    return () => window.removeEventListener('mouseup', stop);
  }, []);

  const rows: PlannerRow[] = data?.rows || [];

  const getCellKey = (asignacionId: string, month: number) => `${asignacionId}-${month}`;

  const getCellValue = useCallback(
    (row: PlannerRow, month: number): number => {
      const key = getCellKey(row.asignacionId, month);
      if (dirtyCells.has(key)) return dirtyCells.get(key)!;
      return row.meses[month] ?? 0;
    },
    [dirtyCells],
  );

  const handleCellChange = useCallback(
    (asignacionId: string, month: number, value: number) => {
      setDirtyCells((prev) => {
        const next = new Map(prev);
        next.set(getCellKey(asignacionId, month), value);
        return next;
      });
    },
    [],
  );

  const handlePaintStart = useCallback(
    (value: number) => {
      paintRef.current = { active: true, value };
    },
    [],
  );

  const handlePaintEnter = useCallback(
    (asignacionId: string, month: number) => {
      if (paintRef.current.active) {
        handleCellChange(asignacionId, month, paintRef.current.value);
      }
    },
    [handleCellChange],
  );

  const handleSave = () => {
    if (dirtyCells.size === 0) return;
    
    // Build items from dirty cells, using rows data to get the correct asignacionId
    const items: { asignacionId: string; year: number; month: number; porcentajeAsignacion: number }[] = [];
    
    for (const [key, porcentajeAsignacion] of dirtyCells.entries()) {
      // Key format: `${asignacionId}-${month}` where asignacionId is a UUID with dashes
      // Use lastIndexOf to correctly split UUID from month
      const lastDash = key.lastIndexOf('-');
      if (lastDash === -1) {
        console.warn('[Planner] Invalid cell key format:', key);
        continue;
      }
      
      const asignacionId = key.substring(0, lastDash);
      const month = Number(key.substring(lastDash + 1));
      
      // Validate: asignacionId must exist in rows, month must be 1-12
      const rowExists = rows.some((r) => r.asignacionId === asignacionId);
      if (!rowExists) {
        console.warn('[Planner] asignacionId not found in rows:', asignacionId);
        continue;
      }
      if (month < 1 || month > 12 || isNaN(month)) {
        console.warn('[Planner] Invalid month:', month, 'from key:', key);
        continue;
      }
      if (isNaN(porcentajeAsignacion) || porcentajeAsignacion < 0) {
        console.warn('[Planner] Invalid porcentaje:', porcentajeAsignacion);
        continue;
      }
      
      items.push({ asignacionId, year, month, porcentajeAsignacion });
    }
    
    if (items.length === 0) {
      console.warn('[Planner] No valid items to save after validation');
      return;
    }
    
    saveMutation.mutate({ items }, {
      onSuccess: () => setDirtyCells(new Map()),
    });
  };

  const handleAddResource = (recursoId: string) => {
    createAsignacion.mutate({
      recursoId,
      proyectoId,
      porcentajeAsignacion: 0,
      fechaDesde: new Date(year, 0, 1).toISOString(),
    }, {
      onSuccess: () => {
        // Invalidate planner queries to refresh the grid with the new resource
        queryClient.invalidateQueries({ queryKey: [PLANNER_QUERY_KEY, proyectoId, year] });
        // Also invalidate without year in case there are other planner queries
        queryClient.invalidateQueries({ queryKey: [PLANNER_QUERY_KEY, proyectoId] });
      },
    });
  };

  const getRowAverage = (row: PlannerRow): number => {
    let sum = 0;
    let count = 0;
    for (const m of MONTHS) {
      const v = getCellValue(row, m);
      if (v > 0) { sum += v; count++; }
    }
    return count > 0 ? Math.round(sum / count) : 0;
  };

  const getColumnTotal = (month: number): number => {
    let total = 0;
    for (const row of rows) {
      total += getCellValue(row, month);
    }
    return total;
  };

  const getColumnFte = (month: number): string => {
    return (getColumnTotal(month) / 100).toFixed(1);
  };

  // Cost calculation helpers
  const getCellCost = useCallback(
    (row: PlannerRow, month: number): number => {
      if (!row.costoMensual || row.costoMensual <= 0) return 0;
      const pct = getCellValue(row, month);
      if (pct === 0) return 0;
      // costoTotal100 = costoMensual * (1 + costoEmpresaPct/100)
      const costoTotal100 = row.costoMensual * (1 + costoEmpresaPct / 100);
      // costoMesProyecto = costoTotal100 * (porcentajeAsignacion / 100)
      return costoTotal100 * (pct / 100);
    },
    [getCellValue, costoEmpresaPct],
  );

  // Get row annual total cost
  const getRowAnnualCost = useCallback(
    (row: PlannerRow): number => {
      return MONTHS.reduce((sum, m) => sum + getCellCost(row, m), 0);
    },
    [getCellCost],
  );

  // Get row monthly average cost (only months with allocation)
  const getRowMonthlyAvgCost = useCallback(
    (row: PlannerRow): number => {
      let sum = 0;
      let count = 0;
      for (const m of MONTHS) {
        const cost = getCellCost(row, m);
        if (cost > 0) { sum += cost; count++; }
      }
      return count > 0 ? sum / count : 0;
    },
    [getCellCost],
  );

  // Column cost totals (by currency)
  const getColumnCostsByCurrency = useMemo(() => {
    return (month: number): { ARS: number; USD: number } => {
      const totals = { ARS: 0, USD: 0 };
      for (const row of rows) {
        const cost = getCellCost(row, month);
        if (cost > 0) {
          const currency = row.monedaCosto === 'USD' ? 'USD' : 'ARS';
          totals[currency] += cost;
        }
      }
      return totals;
    };
  }, [rows, getCellCost]);

  // Check if rows have mixed currencies
  const currencyInfo = useMemo(() => {
    const currencies = new Set(rows.map((r) => r.monedaCosto || 'ARS'));
    const hasMixed = currencies.size > 1;
    const singleCurrency = currencies.size === 1 ? Array.from(currencies)[0] : null;
    return { hasMixed, singleCurrency, currencies: Array.from(currencies) };
  }, [rows]);

  // Check for rows without cost
  const rowsWithoutCost = useMemo(() => {
    return rows.filter((r) => !r.costoMensual || r.costoMensual <= 0);
  }, [rows]);

  const assignedRecursoIds = new Set(rows.map((r) => r.recursoId));

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 rounded bg-stone-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4">
          {/* Year navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-stone-500 hover:text-stone-800"
              onClick={() => { setYear((y) => y - 1); setDirtyCells(new Map()); }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold text-stone-800 min-w-[4ch] text-center">{year}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-stone-500 hover:text-stone-800"
              onClick={() => { setYear((y) => y + 1); setDirtyCells(new Map()); }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* View mode toggle */}
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(v) => v && setViewMode(v as ViewMode)}
            size="sm"
            variant="outline"
          >
            <ToggleGroupItem value="percentage" aria-label="Ver porcentajes">
              <Percent className="h-4 w-4 mr-1" />
              <span className="text-xs">%</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="cost" aria-label="Ver costos">
              <DollarSign className="h-4 w-4 mr-1" />
              <span className="text-xs">Costos</span>
            </ToggleGroupItem>
          </ToggleGroup>
          
          {/* Config indicator */}
          {viewMode === 'cost' && isUsingDefaultConfig && (
            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-xs">
              overhead: {costoEmpresaPct}% (default)
            </Badge>
          )}
          {viewMode === 'cost' && !isUsingDefaultConfig && (
            <span className="text-xs text-stone-400">
              overhead: {costoEmpresaPct}%
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {dirtyCells.size > 0 && (
            <span className="text-xs text-amber-600 mr-2">
              {dirtyCells.size} cambio{dirtyCells.size !== 1 ? 's' : ''} sin guardar
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={dirtyCells.size === 0 || saveMutation.isPending}
            onClick={handleSave}
            className="border-stone-200 text-stone-700"
          >
            <Save className="mr-2 h-4 w-4" />
            {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
          <ResourceCombobox
            assignedRecursoIds={assignedRecursoIds}
            onSelect={handleAddResource}
            isLoading={createAsignacion.isPending}
          />
        </div>
      </div>

      {/* Warning for resources without cost */}
      {viewMode === 'cost' && rowsWithoutCost.length > 0 && (
        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          ⚠️ {rowsWithoutCost.length} recurso{rowsWithoutCost.length !== 1 ? 's' : ''} sin costo configurado: mostrar "—"
        </div>
      )}

      {/* Grid */}
      {rows.length === 0 ? (
        <p className="text-stone-500 text-center py-12">
          No hay recursos asignados. Usá "Agregar recurso" para empezar.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left px-3 py-2 font-medium text-stone-600 min-w-[180px] sticky left-0 bg-stone-50 z-10">
                  Recurso
                </th>
                {MONTHS.map((m, i) => (
                  <th key={m} className={`text-center px-1 py-2 font-medium text-stone-500 ${viewMode === 'cost' ? 'w-24' : 'w-16'}`}>
                    {MONTH_LABELS[i]}
                  </th>
                ))}
                <th className={`text-center px-2 py-2 font-medium text-stone-500 ${viewMode === 'cost' ? 'w-28' : 'w-16'}`}>
                  {viewMode === 'cost' ? 'Total Anual' : 'Prom'}
                </th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const hasNoCost = !row.costoMensual || row.costoMensual <= 0;
                
                return (
                <tr key={row.asignacionId} className="border-b border-stone-50 hover:bg-stone-50/30">
                  <td className="px-3 py-1 sticky left-0 bg-white z-10">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="truncate max-w-[170px]">
                          <span className="font-medium text-stone-800">
                            {row.recursoApellido}, {row.recursoNombre}
                          </span>
                          <span className="text-stone-400 text-xs ml-1">{row.perfilNombre}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{row.recursoApellido}, {row.recursoNombre}</p>
                        <p className="text-xs text-stone-400">{row.perfilNombre} · {row.tipoTiempo}</p>
                        {viewMode === 'cost' && (
                          <p className="text-xs text-stone-400 mt-1">
                            Costo base: {formatCurrency(row.costoMensual, row.monedaCosto)} ({row.monedaCosto})
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  
                  {viewMode === 'percentage' ? (
                    // Percentage view - editable cells
                    <>
                      {MONTHS.map((m) => (
                        <PlannerCell
                          key={m}
                          value={getCellValue(row, m)}
                          isDirty={dirtyCells.has(getCellKey(row.asignacionId, m))}
                          onChange={(v) => handleCellChange(row.asignacionId, m, v)}
                          onPaintStart={(v) => handlePaintStart(v)}
                          onPaintEnter={() => handlePaintEnter(row.asignacionId, m)}
                        />
                      ))}
                      <td className="text-center text-xs text-stone-500 font-medium">
                        {getRowAverage(row) > 0 ? `${getRowAverage(row)}%` : '-'}
                      </td>
                    </>
                  ) : (
                    // Cost view - read-only cells showing cost
                    <>
                      {MONTHS.map((m) => {
                        const cost = getCellCost(row, m);
                        const pct = getCellValue(row, m);
                        return (
                          <td key={m} className="text-center px-1 py-1">
                            {hasNoCost ? (
                              <span className="text-stone-300">—</span>
                            ) : pct === 0 ? (
                              <span className="text-stone-300">-</span>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className={`text-xs font-medium ${
                                    cost > 0 
                                      ? 'text-stone-700' 
                                      : 'text-stone-400'
                                  }`}>
                                    {formatCurrency(cost, row.monedaCosto)}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">{pct}% asignado</p>
                                  <p className="text-xs text-stone-400">
                                    Base: {formatCurrency(row.costoMensual, row.monedaCosto)}
                                  </p>
                                  <p className="text-xs text-stone-400">
                                    + {costoEmpresaPct}% overhead
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </td>
                        );
                      })}
                      <td className="text-center px-1 py-1">
                        {hasNoCost ? (
                          <span className="text-stone-300">—</span>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs font-semibold text-stone-700">
                                {formatCurrency(getRowAnnualCost(row), row.monedaCosto)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Total anual: {formatCurrency(getRowAnnualCost(row), row.monedaCosto)}</p>
                              <p className="text-xs text-stone-400">
                                Promedio mensual: {formatCurrency(getRowMonthlyAvgCost(row), row.monedaCosto)}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </td>
                    </>
                  )}
                  
                  <td className="px-1">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="p-1 text-stone-300 hover:text-red-500 transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="border-stone-200">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-stone-800">¿Quitar recurso?</AlertDialogTitle>
                          <AlertDialogDescription className="text-stone-500">
                            Se eliminará la asignación de {row.recursoNombre} {row.recursoApellido} de este proyecto.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-stone-200 text-stone-600">Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteAsignacion.mutate(row.asignacionId)}
                            className="bg-red-600 text-white hover:bg-red-700"
                          >
                            Quitar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              );
              })}
            </tbody>
            <tfoot>
              {viewMode === 'percentage' ? (
                <tr className="bg-stone-50 border-t border-stone-200">
                  <td className="px-3 py-2 text-xs font-medium text-stone-500 sticky left-0 bg-stone-50 z-10">
                    FTEs
                  </td>
                  {MONTHS.map((m) => (
                    <td key={m} className="text-center text-xs font-medium text-stone-600 py-2">
                      {Number(getColumnFte(m)) > 0 ? getColumnFte(m) : '-'}
                    </td>
                  ))}
                  <td />
                  <td />
                </tr>
              ) : (
                // Cost view footer - show totals by currency
                <>
                  <tr className="bg-stone-50 border-t border-stone-200">
                    <td className="px-3 py-2 text-xs font-medium text-stone-500 sticky left-0 bg-stone-50 z-10">
                      {currencyInfo.hasMixed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>Costos Totales <span className="text-amber-500">*</span></span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Monedas mixtas: {currencyInfo.currencies.join(', ')}</p>
                            <p className="text-xs text-stone-400">Totales separados por moneda</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        'Costos Totales'
                      )}
                    </td>
                    {MONTHS.map((m) => {
                      const costs = getColumnCostsByCurrency(m);
                      const hasARS = costs.ARS > 0;
                      const hasUSD = costs.USD > 0;
                      
                      if (!hasARS && !hasUSD) {
                        return (
                          <td key={m} className="text-center text-xs font-medium text-stone-400 py-2">
                            -
                          </td>
                        );
                      }
                      
                      if (currencyInfo.hasMixed) {
                        // Show both currencies in tooltip
                        return (
                          <td key={m} className="text-center text-xs py-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="font-medium text-stone-600 cursor-help">
                                  —
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {hasARS && <p className="text-xs">ARS: {formatCurrency(costs.ARS, 'ARS')}</p>}
                                {hasUSD && <p className="text-xs">USD: {formatCurrency(costs.USD, 'USD')}</p>}
                              </TooltipContent>
                            </Tooltip>
                          </td>
                        );
                      }
                      
                      // Single currency - show total directly
                      const total = hasARS ? costs.ARS : costs.USD;
                      const currency = hasARS ? 'ARS' : 'USD';
                      return (
                        <td key={m} className="text-center text-xs font-semibold text-stone-700 py-2">
                          {formatCurrency(total, currency)}
                        </td>
                      );
                    })}
                    <td className="text-center text-xs font-semibold text-stone-700 py-2">
                      {(() => {
                        // Calculate annual totals
                        let totalARS = 0;
                        let totalUSD = 0;
                        for (const m of MONTHS) {
                          const costs = getColumnCostsByCurrency(m);
                          totalARS += costs.ARS;
                          totalUSD += costs.USD;
                        }
                        
                        if (currencyInfo.hasMixed) {
                          return (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help">—</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {totalARS > 0 && <p className="text-xs">ARS: {formatCurrency(totalARS, 'ARS')}</p>}
                                {totalUSD > 0 && <p className="text-xs">USD: {formatCurrency(totalUSD, 'USD')}</p>}
                              </TooltipContent>
                            </Tooltip>
                          );
                        }
                        
                        const total = totalARS > 0 ? totalARS : totalUSD;
                        const currency = totalARS > 0 ? 'ARS' : 'USD';
                        return total > 0 ? formatCurrency(total, currency) : '-';
                      })()}
                    </td>
                    <td />
                  </tr>
                  {/* FTEs row in cost view too */}
                  <tr className="bg-stone-50 border-t border-stone-100">
                    <td className="px-3 py-1 text-xs text-stone-400 sticky left-0 bg-stone-50 z-10">
                      FTEs
                    </td>
                    {MONTHS.map((m) => (
                      <td key={m} className="text-center text-xs text-stone-400 py-1">
                        {Number(getColumnFte(m)) > 0 ? getColumnFte(m) : '-'}
                      </td>
                    ))}
                    <td />
                    <td />
                  </tr>
                </>
              )}
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
