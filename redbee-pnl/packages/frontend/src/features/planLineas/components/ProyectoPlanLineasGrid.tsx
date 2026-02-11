import { useState, useEffect } from 'react';
import { Plus, Trash2, DollarSign, AlertCircle, Save, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { usePlanLineas, usePlanLineasMutations } from '../hooks/usePlanLineas';
import { usePerfiles } from '@/features/perfiles';
import { useTarifarios } from '@/features/tarifarios';
import { useFxRates } from '@/features/revenue/hooks/useClienteRevenue';
import { useProyecto } from '@/features/proyectos/hooks/useProyecto';
import { convertCurrency, formatCurrency, buildFxMap } from '@/lib/fx';
import type { PlanLinea } from '../types/planLinea.types';

interface ProyectoPlanLineasGridProps {
  proyectoId: string;
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function ProyectoPlanLineasGrid({ proyectoId }: ProyectoPlanLineasGridProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'ARS'>('USD');
  const [dirtyLineas, setDirtyLineas] = useState<Map<string, PlanLinea>>(new Map());
  const [deletedLineaIds, setDeletedLineaIds] = useState<string[]>([]);

  const { data: proyecto } = useProyecto(proyectoId);
  const { data: planData, isLoading: isLoadingPlan } = usePlanLineas(proyectoId, selectedYear);
  const { data: perfilesData } = usePerfiles({ page: 1, limit: 100 });
  const { data: tarifariosData } = useTarifarios(proyecto?.clienteId ? { clienteId: proyecto.clienteId } : undefined);
  const { data: fxData } = useFxRates(selectedYear);
  const { upsertPlanLineas } = usePlanLineasMutations(proyectoId);

  const [localLineas, setLocalLineas] = useState<PlanLinea[]>([]);

  // Initialize local lineas when plan data loads
  useEffect(() => {
    if (planData) {
      setLocalLineas(planData.lineas);
      setDirtyLineas(new Map());
      setDeletedLineaIds([]);
    }
  }, [planData]);

  const perfiles = perfilesData?.data || [];
  const tarifarios = tarifariosData?.items || [];
  const fxMap = fxData ? buildFxMap(fxData.rates) : {};

  // Get tarifario lineas for rate lookup
  const tarifario = tarifarios.find((t) => t.id === proyecto?.tarifarioId);
  const rateMap = new Map<string, { rate: number; moneda: 'USD' | 'ARS' }>();
  if (tarifario?.lineas) {
    for (const linea of tarifario.lineas) {
      if (linea.perfil?.id) {
        rateMap.set(linea.perfil.id, {
          rate: Number(linea.rate),
          moneda: linea.moneda || tarifario.moneda,
        });
      }
    }
  }

  // Filter perfiles to only those in the assigned tarifario
  const availablePerfiles = tarifario?.lineas
    ?.map((linea) => linea.perfil)
    .filter((perfil): perfil is NonNullable<typeof perfil> => perfil != null) || [];
  const availablePerfilIds = new Set(availablePerfiles.map((p) => p.id));
  const perfilesForSelector = perfiles.filter((p) => availablePerfilIds.has(p.id));

  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);

  const handleAddLinea = () => {
    if (!proyecto?.tarifarioId) {
      toast.error('Proyecto sin tarifario asignado. Asigna un tarifario para agregar líneas.');
      return;
    }

    // Auto-fill months from current month to Dec with 0
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const meses: Record<number, number> = {};
    if (selectedYear === currentYear) {
      for (let month = currentMonth; month <= 12; month++) {
        meses[month] = 0;
      }
    }

    const newLinea: PlanLinea = {
      id: `temp-${Date.now()}`,
      perfilId: '',
      perfilNombre: '',
      perfilCategoria: '',
      perfilNivel: null,
      nombreLinea: null,
      meses,
      total: 0,
    };
    setLocalLineas([...localLineas, newLinea]);
    const updated = new Map(dirtyLineas);
    updated.set(newLinea.id, newLinea);
    setDirtyLineas(updated);
  };

  const handleImportFromTarifario = () => {
    if (!proyecto?.tarifarioId) {
      toast.error('Proyecto sin tarifario asignado. Asigna un tarifario para importar líneas.');
      return;
    }

    if (!tarifario?.lineas || tarifario.lineas.length === 0) {
      toast.error('El tarifario no tiene líneas definidas.');
      return;
    }

    // Auto-fill months from current month to Dec with 0
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const meses: Record<number, number> = {};
    if (selectedYear === currentYear) {
      for (let month = currentMonth; month <= 12; month++) {
        meses[month] = 0;
      }
    }

    // Create new lineas for all tarifario lineas (avoiding duplicates)
    const existingPerfilIds = new Set(localLineas.map((l) => l.perfilId));
    const newLineas: PlanLinea[] = [];
    let addedCount = 0;

    for (const lineaTarifario of tarifario.lineas) {
      if (!lineaTarifario.perfil) continue;
      if (existingPerfilIds.has(lineaTarifario.perfil.id)) continue; // Skip duplicates

      const newLinea: PlanLinea = {
        id: `temp-${Date.now()}-${addedCount}`,
        perfilId: lineaTarifario.perfil.id,
        perfilNombre: lineaTarifario.perfil.nombre,
        perfilCategoria: lineaTarifario.perfil.categoria,
        perfilNivel: lineaTarifario.perfil.nivel,
        nombreLinea: null,
        meses: { ...meses },
        total: 0,
      };
      newLineas.push(newLinea);
      addedCount++;
    }

    if (newLineas.length === 0) {
      toast.info('Todas las líneas del tarifario ya están agregadas.');
      return;
    }

    setLocalLineas([...localLineas, ...newLineas]);
    const updated = new Map(dirtyLineas);
    newLineas.forEach((linea) => updated.set(linea.id, linea));
    setDirtyLineas(updated);

    toast.success(`${newLineas.length} línea(s) importada(s) desde tarifario.`);
  };

  const handleRemoveLinea = (id: string) => {
    setLocalLineas(localLineas.filter((l) => l.id !== id));
    const updated = new Map(dirtyLineas);
    updated.delete(id);
    setDirtyLineas(updated);

    // If it's not a temp ID, mark for deletion
    if (!id.startsWith('temp-')) {
      setDeletedLineaIds([...deletedLineaIds, id]);
    }
  };

  const handlePerfilChange = (lineaId: string, perfilId: string) => {
    const perfil = perfiles.find((p) => p.id === perfilId);
    if (!perfil) return;

    const updated = localLineas.map((l) =>
      l.id === lineaId
        ? { ...l, perfilId, perfilNombre: perfil.nombre, perfilCategoria: perfil.categoria, perfilNivel: perfil.nivel }
        : l,
    );
    setLocalLineas(updated);

    const dirty = new Map(dirtyLineas);
    const linea = updated.find((l) => l.id === lineaId);
    if (linea) dirty.set(lineaId, linea);
    setDirtyLineas(dirty);
  };

  const handleNombreLineaChange = (lineaId: string, nombreLinea: string) => {
    const updated = localLineas.map((l) =>
      l.id === lineaId ? { ...l, nombreLinea: nombreLinea || null } : l,
    );
    setLocalLineas(updated);

    const dirty = new Map(dirtyLineas);
    const linea = updated.find((l) => l.id === lineaId);
    if (linea) dirty.set(lineaId, linea);
    setDirtyLineas(dirty);
  };

  const handleFtesChange = (lineaId: string, month: number, ftes: number) => {
    const updated = localLineas.map((l) => {
      if (l.id !== lineaId) return l;
      const newMeses = { ...l.meses, [month]: ftes };
      const total = Object.values(newMeses).reduce((sum, v) => sum + v, 0);
      return { ...l, meses: newMeses, total: Math.round(total * 100) / 100 };
    });
    setLocalLineas(updated);

    const dirty = new Map(dirtyLineas);
    const linea = updated.find((l) => l.id === lineaId);
    if (linea) dirty.set(lineaId, linea);
    setDirtyLineas(dirty);
  };

  const handleSave = () => {
    const lineasToSave = Array.from(dirtyLineas.values()).map((linea) => ({
      id: linea.id.startsWith('temp-') ? undefined : linea.id,
      perfilId: linea.perfilId,
      nombreLinea: linea.nombreLinea || undefined,
      meses: Object.entries(linea.meses).map(([month, ftes]) => ({
        month: parseInt(month),
        ftes,
      })),
    }));

    upsertPlanLineas.mutate({
      year: selectedYear,
      lineas: lineasToSave,
      deletedLineaIds: deletedLineaIds.length > 0 ? deletedLineaIds : undefined,
    });
  };

  // Calculate revenue for a linea in a month
  const calculateLineaRevenue = (linea: PlanLinea, month: number): number => {
    const ftes = linea.meses[month] || 0;
    if (ftes === 0) return 0;

    const rateInfo = rateMap.get(linea.perfilId);
    if (!rateInfo) return 0;

    // revenue = ftes * rate (FTE_MES rate)
    return ftes * rateInfo.rate;
  };

  // Convert revenue to selected currency
  const convertRevenue = (amount: number, fromCurrency: 'USD' | 'ARS', month: number): number => {
    const fxRate = fxMap[month] || null;
    const converted = convertCurrency(amount, fromCurrency, selectedCurrency, fxRate);
    return converted ?? amount;
  };

  // Calculate total revenue for a month (all lineas)
  const calculateMonthRevenue = (month: number): number => {
    return localLineas.reduce((sum, linea) => {
      const revenue = calculateLineaRevenue(linea, month);
      const rateInfo = rateMap.get(linea.perfilId);
      const fromCurrency = rateInfo?.moneda || 'USD';
      return sum + convertRevenue(revenue, fromCurrency, month);
    }, 0);
  };

  // Calculate annual total revenue
  const calculateAnnualRevenue = (): number => {
    let total = 0;
    for (let month = 1; month <= 12; month++) {
      total += calculateMonthRevenue(month);
    }
    return total;
  };

  // Check warnings
  const warnings: string[] = [];
  if (!proyecto?.tarifarioId) {
    warnings.push('Proyecto sin tarifario asignado');
  } else {
    const perfilesSinRate = new Set<string>();
    for (const linea of localLineas) {
      if (linea.perfilId && !rateMap.has(linea.perfilId)) {
        perfilesSinRate.add(linea.perfilNombre || linea.perfilId);
      }
    }
    if (perfilesSinRate.size > 0) {
      warnings.push(`Perfil sin rate: ${Array.from(perfilesSinRate).join(', ')}`);
    }
  }

  const hasDirtyChanges = dirtyLineas.size > 0 || deletedLineaIds.length > 0;

  if (isLoadingPlan) {
    return (
      <Card className="border-stone-200 bg-white">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-stone-200 bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-stone-800 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-stone-600" />
              Revenue Plan
            </CardTitle>
            <CardDescription className="text-stone-500">
              Proyección de revenue mensual usando tarifario asignado
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {/* Currency Toggle */}
            <Select value={selectedCurrency} onValueChange={(val) => setSelectedCurrency(val as 'USD' | 'ARS')}>
              <SelectTrigger className="w-[100px] border-stone-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="ARS">ARS</SelectItem>
              </SelectContent>
            </Select>

            {/* Year Selector */}
            <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
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

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={!hasDirtyChanges || upsertPlanLineas.isPending}
              className="bg-stone-800 hover:bg-stone-700"
            >
              <Save className="mr-2 h-4 w-4" />
              Guardar
            </Button>
          </div>
        </div>

        {/* Tarifario Info */}
        {tarifario && (
          <div className="mt-4">
            <p className="text-sm text-stone-600">
              Tarifario: <span className="font-medium">{tarifario.nombre}</span>{' '}
              <Badge variant="outline" className="ml-2">{tarifario.moneda}</Badge>
            </p>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">Advertencias:</p>
                <ul className="text-sm text-amber-700 mt-1 space-y-1">
                  {warnings.map((warning, idx) => (
                    <li key={idx}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button onClick={handleImportFromTarifario} variant="outline" size="sm" className="border-stone-200">
                <Download className="h-4 w-4 mr-2" />
                Importar desde tarifario
              </Button>
              <Button onClick={handleAddLinea} variant="outline" size="sm" className="border-stone-200">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Línea
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-stone-200">
                  <th className="text-left py-3 px-2 font-semibold text-stone-700 min-w-[180px]">Perfil</th>
                  <th className="text-left py-3 px-2 font-semibold text-stone-700 min-w-[80px]">Seniority</th>
                  <th className="text-left py-3 px-2 font-semibold text-stone-700 min-w-[120px]">Nombre</th>
                  {MONTH_NAMES.map((month, idx) => (
                    <th key={idx} className="text-right py-3 px-2 font-semibold text-stone-700 min-w-[70px]">
                      {month}
                    </th>
                  ))}
                  <th className="text-right py-3 px-2 font-semibold text-stone-700 min-w-[80px] bg-stone-50">Total</th>
                  <th className="text-center py-3 px-2 font-semibold text-stone-700 min-w-[60px]"></th>
                </tr>
              </thead>
              <tbody>
                {localLineas.length === 0 ? (
                  <tr>
                    <td colSpan={17} className="text-center py-8 text-stone-500">
                      No hay líneas en el plan. Agrega líneas para comenzar.
                    </td>
                  </tr>
                ) : (
                  localLineas.map((linea) => (
                    <tr key={linea.id} className="border-b border-stone-100 hover:bg-stone-50">
                      <td className="py-2 px-2">
                        <Select
                          value={linea.perfilId}
                          onValueChange={(val) => handlePerfilChange(linea.id, val)}
                        >
                          <SelectTrigger className="w-full h-8 text-xs">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {perfilesForSelector.map((perfil) => (
                              <SelectItem key={perfil.id} value={perfil.id}>
                                {perfil.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-2 px-2">
                        <span className="text-xs text-stone-600">
                          {linea.perfilNivel || '-'}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          value={linea.nombreLinea || ''}
                          onChange={(e) => handleNombreLineaChange(linea.id, e.target.value)}
                          placeholder="Opcional"
                          className="h-8 text-xs"
                        />
                      </td>
                      {[...Array(12)].map((_, idx) => {
                        const month = idx + 1;
                        return (
                          <td key={month} className="py-2 px-2">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              value={linea.meses[month] || ''}
                              onChange={(e) => handleFtesChange(linea.id, month, parseFloat(e.target.value) || 0)}
                              className="h-8 text-xs text-right tabular-nums"
                            />
                          </td>
                        );
                      })}
                      <td className="py-2 px-2 text-right font-semibold tabular-nums bg-stone-50">
                        {linea.total.toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleRemoveLinea(linea.id)}
                          className="h-8 w-8 border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Revenue Summary */}
          {localLineas.length > 0 && (
            <div className="mt-6 p-4 bg-stone-50 rounded-md">
              <h3 className="text-sm font-semibold text-stone-800 mb-3">Revenue Planificado ({selectedCurrency})</h3>
              <div className="grid grid-cols-12 gap-2">
                {MONTH_NAMES.map((month, idx) => {
                  const revenue = calculateMonthRevenue(idx + 1);
                  return (
                    <div key={idx} className="text-center">
                      <p className="text-xs text-stone-500">{month}</p>
                      <p className="text-sm font-semibold text-stone-800 tabular-nums">
                        {formatCurrency(revenue, selectedCurrency, { decimals: 0 })}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-stone-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-stone-800">Total Anual:</span>
                  <span className="text-lg font-bold text-stone-900 tabular-nums">
                    {formatCurrency(calculateAnnualRevenue(), selectedCurrency, { decimals: 0 })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
