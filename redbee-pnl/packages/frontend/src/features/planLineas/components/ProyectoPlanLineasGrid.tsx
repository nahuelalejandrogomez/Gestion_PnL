import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, DollarSign, AlertCircle, Save, Download, Hash } from 'lucide-react';
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
import { useTarifarios, useTarifario } from '@/features/tarifarios';
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
  const [selectedTarifarioId, setSelectedTarifarioId] = useState<string>('');
  const [dirtyLineas, setDirtyLineas] = useState<Map<string, PlanLinea>>(new Map());
  const [deletedLineaIds, setDeletedLineaIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'fte' | 'money'>('fte');

  // Drag-fill state
  const [dragFillStart, setDragFillStart] = useState<string | null>(null);
  const [dragFillCurrent, setDragFillCurrent] = useState<string | null>(null);
  const [dragFillValue, setDragFillValue] = useState<number | null>(null);
  const [dragMoved, setDragMoved] = useState(false);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const { data: proyecto } = useProyecto(proyectoId);
  const { data: planData, isLoading: isLoadingPlan } = usePlanLineas(proyectoId, selectedYear);
  const { data: perfilesData } = usePerfiles({ page: 1, limit: 100 });
  const { data: tarifariosData } = useTarifarios(proyecto?.clienteId ? { clienteId: proyecto.clienteId, estado: 'ACTIVO' } : undefined);
  const { data: fxData } = useFxRates(selectedYear);
  const { upsertPlanLineas } = usePlanLineasMutations(proyectoId);
  // Fetch selected tarifario with lineas (getById includes lineas, getAll does not)
  const { data: tarifarioWithLineas } = useTarifario(selectedTarifarioId);

  const [localLineas, setLocalLineas] = useState<PlanLinea[]>([]);

  // Initialize selectedTarifarioId: proyecto.tarifarioRevenuePlanId || proyecto.tarifarioId || first ACTIVO tarifario
  useEffect(() => {
    if (proyecto && tarifariosData?.items && !selectedTarifarioId) {
      // Priority: tarifarioRevenuePlanId > tarifarioId > first ACTIVO
      const tarifs = tarifariosData.items.filter((t) => t.estado === 'ACTIVO');
      const defaultId = (proyecto as any).tarifarioRevenuePlanId || proyecto.tarifarioId || tarifs[0]?.id;
      if (defaultId) {
        setSelectedTarifarioId(defaultId);
      }
    }
  }, [proyecto, tarifariosData]); // Removed selectedTarifarioId from deps to avoid timing issues

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

  // Use the fetched tarifario (which includes lineas) for rate lookup
  const tarifario = tarifarioWithLineas;
  const rateMap = new Map<string, { rate: number; moneda: 'USD' | 'ARS'; perfilNivel: string | null }>();
  if (tarifario?.lineas) {
    for (const linea of tarifario.lineas) {
      if (linea.perfil?.id) {
        rateMap.set(linea.perfil.id, {
          rate: Number(linea.rate),
          moneda: linea.moneda || tarifario.moneda,
          perfilNivel: linea.perfil.nivel,
        });
      }
    }
  }

  // Filter perfiles to only those in the selected tarifario (if tarifario selected)
  // Otherwise show all perfiles to allow manual entry
  const availablePerfiles = tarifario?.lineas
    ?.map((linea) => linea.perfil)
    .filter((perfil): perfil is NonNullable<typeof perfil> => perfil != null) || [];
  const availablePerfilIds = new Set(availablePerfiles.map((p) => p.id));
  const perfilesForSelector = selectedTarifarioId && tarifario
    ? perfiles.filter((p) => availablePerfilIds.has(p.id))
    : perfiles; // Show all perfiles if no tarifario selected

  // Get vigencia range for selected tarifario
  const getVigenciaRange = () => {
    if (!tarifario) return null;

    const vigenciaDesde = new Date(tarifario.fechaVigenciaDesde);
    const vigenciaHasta = tarifario.fechaVigenciaHasta
      ? new Date(tarifario.fechaVigenciaHasta)
      : new Date(vigenciaDesde.getFullYear(), 11, 31);

    const yearDesde = vigenciaDesde.getFullYear();
    const yearHasta = vigenciaHasta.getFullYear();

    if (selectedYear < yearDesde || selectedYear > yearHasta) {
      return null;
    }

    let mesInicio: number;
    let mesFin: number;

    if (selectedYear === yearDesde && selectedYear === yearHasta) {
      mesInicio = vigenciaDesde.getMonth() + 1;
      mesFin = vigenciaHasta.getMonth() + 1;
    } else if (selectedYear === yearDesde) {
      mesInicio = vigenciaDesde.getMonth() + 1;
      mesFin = 12;
    } else if (selectedYear === yearHasta) {
      mesInicio = 1;
      mesFin = vigenciaHasta.getMonth() + 1;
    } else {
      mesInicio = 1;
      mesFin = 12;
    }

    return { mesInicio, mesFin };
  };

  const vigenciaRange = getVigenciaRange();

  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);

  // Check for duplicates: Perfil + Seniority
  const isDuplicatePerfilSeniority = (perfilId: string, excludeLineaId?: string): boolean => {
    const rateInfo = rateMap.get(perfilId);
    const seniority = rateInfo?.perfilNivel || null;
    return localLineas.some((l) => {
      if (excludeLineaId && l.id === excludeLineaId) return false;
      return l.perfilId === perfilId && l.perfilNivel === seniority;
    });
  };

  const handleAddLinea = () => {
    if (!selectedTarifarioId) {
      toast.error('Seleccioná un tarifario del cliente para agregar líneas.');
      return;
    }

    // Auto-fill months within vigencia with 0
    const meses: Record<number, number> = {};
    if (vigenciaRange) {
      for (let month = vigenciaRange.mesInicio; month <= vigenciaRange.mesFin; month++) {
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
    if (!selectedTarifarioId) {
      toast.error('Seleccioná un tarifario del cliente arriba para importar sus líneas.');
      return;
    }

    if (!tarifario) {
      toast.error('No se encontró el tarifario seleccionado.');
      return;
    }

    if (!tarifario.lineas || tarifario.lineas.length === 0) {
      toast.error('El tarifario seleccionado no tiene líneas definidas.');
      return;
    }

    // Auto-fill months within vigencia with 0
    const meses: Record<number, number> = {};
    if (vigenciaRange) {
      for (let month = vigenciaRange.mesInicio; month <= vigenciaRange.mesFin; month++) {
        meses[month] = 0;
      }
    }

    // Create new lineas for all tarifario lineas (avoiding duplicates by Perfil+Seniority)
    const newLineas: PlanLinea[] = [];
    let addedCount = 0;
    let skippedCount = 0;

    for (const lineaTarifario of tarifario.lineas) {
      if (!lineaTarifario.perfil) continue;

      // Check duplicate by Perfil + Seniority
      if (isDuplicatePerfilSeniority(lineaTarifario.perfil.id)) {
        skippedCount++;
        continue;
      }

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
      if (skippedCount > 0) {
        toast.info('Todas las líneas del tarifario ya están agregadas (Perfil+Seniority duplicados).');
      } else {
        toast.info('No hay líneas nuevas para importar.');
      }
      return;
    }

    setLocalLineas([...localLineas, ...newLineas]);
    const updated = new Map(dirtyLineas);
    newLineas.forEach((linea) => updated.set(linea.id, linea));
    setDirtyLineas(updated);

    toast.success(`${newLineas.length} línea(s) importada(s) desde tarifario${skippedCount > 0 ? ` (${skippedCount} duplicada(s) omitida(s))` : ''}.`);
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

    // Check duplicate before allowing change
    if (isDuplicatePerfilSeniority(perfilId, lineaId)) {
      toast.error('Ya existe una línea con este Perfil y Seniority.');
      return;
    }

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

  // Drag-fill handlers
  const handleDragFillStart = (lineaId: string, month: number, value: number) => {
    const key = `${lineaId}|${month}`;
    setDragFillStart(key);
    setDragFillCurrent(key);
    setDragFillValue(value);
    setDragMoved(false);
  };

  const handleDragFillMove = (lineaId: string, month: number) => {
    if (dragFillStart) {
      const key = `${lineaId}|${month}`;
      if (key !== dragFillStart) setDragMoved(true);
      setDragFillCurrent(key);
    }
  };

  const handleDragFillEnd = useCallback(() => {
    if (dragFillStart && dragFillCurrent && dragFillValue !== null && dragMoved) {
      const [startLineaId, startMonthStr] = dragFillStart.split('|');
      const [endLineaId, endMonthStr] = dragFillCurrent.split('|');
      const startMonth = parseInt(startMonthStr);
      const endMonth = parseInt(endMonthStr);
      const minMonth = Math.min(startMonth, endMonth);
      const maxMonth = Math.max(startMonth, endMonth);

      const lineaIds = localLineas.map((l) => l.id);
      const startIdx = lineaIds.indexOf(startLineaId);
      const endIdx = lineaIds.indexOf(endLineaId);
      const minIdx = Math.min(startIdx, endIdx);
      const maxIdx = Math.max(startIdx, endIdx);

      if (startIdx >= 0 && endIdx >= 0) {
        let updated = [...localLineas];
        const dirty = new Map(dirtyLineas);

        for (let i = minIdx; i <= maxIdx; i++) {
          const linea = updated[i];
          const newMeses = { ...linea.meses };
          for (let m = minMonth; m <= maxMonth; m++) {
            if (isMonthEnabled(m)) {
              newMeses[m] = dragFillValue;
            }
          }
          const total = Object.values(newMeses).reduce((sum, v) => sum + v, 0);
          updated[i] = { ...linea, meses: newMeses, total: Math.round(total * 100) / 100 };
          dirty.set(linea.id, updated[i]);
        }

        setLocalLineas(updated);
        setDirtyLineas(dirty);
      }
    }

    setDragFillStart(null);
    setDragFillCurrent(null);
    setDragFillValue(null);
    setDragMoved(false);
  }, [dragFillStart, dragFillCurrent, dragFillValue, dragMoved, localLineas, dirtyLineas]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (dragFillStart) handleDragFillEnd();
    };
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [dragFillStart, handleDragFillEnd]);

  // Cell editing
  const handleCellClick = (lineaId: string, month: number, currentValue: number) => {
    const key = `${lineaId}|${month}`;
    setEditingCell(key);
    setEditValue(currentValue > 0 ? currentValue.toString() : '');
  };

  const handleCellSave = useCallback((lineaId: string, month: number) => {
    const newValue = parseFloat(editValue);
    if (editValue === '' || isNaN(newValue) || newValue < 0) {
      handleFtesChange(lineaId, month, 0);
    } else {
      handleFtesChange(lineaId, month, newValue);
    }
    setEditingCell(null);
  }, [editValue]);

  const handleCellKeyDown = (e: React.KeyboardEvent, lineaId: string, month: number) => {
    if (e.key === 'Enter') handleCellSave(lineaId, month);
    else if (e.key === 'Escape') setEditingCell(null);
  };

  // Check if cell is in drag-fill range
  const isDragTarget = (lineaId: string, month: number): boolean => {
    if (!dragFillStart || !dragFillCurrent || !dragMoved) return false;
    const [startLineaId, startMonthStr] = dragFillStart.split('|');
    const [endLineaId, endMonthStr] = dragFillCurrent.split('|');
    const startMonth = parseInt(startMonthStr);
    const endMonth = parseInt(endMonthStr);
    const minMonth = Math.min(startMonth, endMonth);
    const maxMonth = Math.max(startMonth, endMonth);
    if (month < minMonth || month > maxMonth) return false;

    const lineaIds = localLineas.map((l) => l.id);
    const startIdx = lineaIds.indexOf(startLineaId);
    const endIdx = lineaIds.indexOf(endLineaId);
    const lineaIdx = lineaIds.indexOf(lineaId);
    const minIdx = Math.min(startIdx, endIdx);
    const maxIdx = Math.max(startIdx, endIdx);
    return lineaIdx >= minIdx && lineaIdx <= maxIdx;
  };

  const handleSave = () => {
    if (!selectedTarifarioId) {
      toast.error('Seleccioná un tarifario antes de guardar.');
      return;
    }

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
      tarifarioId: selectedTarifarioId, // Send selected tarifario
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

    // revenue = ftes * rate (MONTHLY rate, not hourly)
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
  if (!selectedTarifarioId) {
    if (!proyecto?.clienteId) {
      warnings.push('Proyecto sin cliente asignado');
    } else if (tarifarios.length === 0) {
      warnings.push('El cliente no tiene tarifarios activos');
    } else {
      warnings.push('Seleccioná un tarifario del cliente para cargar FTEs');
    }
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

  // Check if month is enabled (within vigencia)
  const isMonthEnabled = (month: number): boolean => {
    if (!vigenciaRange) return false;
    return month >= vigenciaRange.mesInicio && month <= vigenciaRange.mesFin;
  };

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
              Proyección de revenue mensual por perfil + seniority
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {/* FTE / $ Toggle */}
            <div className="flex items-center border border-stone-200 rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode('fte')}
                className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1 ${viewMode === 'fte' ? 'bg-stone-800 text-white' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
              >
                <Hash className="h-3 w-3" />
                FTE
              </button>
              <button
                onClick={() => setViewMode('money')}
                className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1 ${viewMode === 'money' ? 'bg-stone-800 text-white' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
              >
                <DollarSign className="h-3 w-3" />
                $
              </button>
            </div>

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
              disabled={!hasDirtyChanges || upsertPlanLineas.isPending || !selectedTarifarioId}
              className="bg-stone-800 hover:bg-stone-700"
            >
              <Save className="mr-2 h-4 w-4" />
              Guardar
            </Button>
          </div>
        </div>

        {/* Tarifario Selector */}
        <div className="mt-4">
          <label className="text-sm font-medium text-stone-700 mb-1.5 block">
            Tarifario del Cliente
          </label>
          <Select value={selectedTarifarioId} onValueChange={setSelectedTarifarioId}>
            <SelectTrigger className="w-full max-w-md border-stone-200">
              <SelectValue placeholder="Seleccionar tarifario..." />
            </SelectTrigger>
            <SelectContent>
              {tarifarios.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-stone-500">
                  No hay tarifarios activos
                </div>
              ) : (
                tarifarios.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <div className="flex items-center gap-2">
                      <span>{t.nombre}</span>
                      <Badge variant="outline" className="text-xs">{t.moneda}</Badge>
                      <span className="text-xs text-stone-500">
                        ({new Date(t.fechaVigenciaDesde).toLocaleDateString('es-AR')} -{' '}
                        {t.fechaVigenciaHasta ? new Date(t.fechaVigenciaHasta).toLocaleDateString('es-AR') : 'indefinido'})
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {vigenciaRange && (
            <p className="text-xs text-stone-500 mt-2">
              Meses activos: <strong>{MONTH_NAMES[vigenciaRange.mesInicio - 1]}</strong> a{' '}
              <strong>{MONTH_NAMES[vigenciaRange.mesFin - 1]}</strong> {selectedYear}
            </p>
          )}
        </div>

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
              <Button
                onClick={handleImportFromTarifario}
                variant="outline"
                size="sm"
                className="border-stone-200"
                disabled={!selectedTarifarioId}
              >
                <Download className="h-4 w-4 mr-2" />
                Importar desde tarifario
              </Button>
              <Button
                onClick={handleAddLinea}
                variant="outline"
                size="sm"
                className="border-stone-200"
                disabled={!selectedTarifarioId}
              >
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
                  <th className="text-right py-3 px-2 font-semibold text-stone-700 min-w-[100px]">Rate</th>
                  <th className="text-center py-3 px-2 font-semibold text-stone-700 min-w-[60px]">Moneda</th>
                  <th className="text-left py-3 px-2 font-semibold text-stone-700 min-w-[120px]">Nombre</th>
                  {MONTH_NAMES.map((month, idx) => (
                    <th
                      key={idx}
                      className={`text-right py-3 px-2 font-semibold text-stone-700 min-w-[70px] ${!isMonthEnabled(idx + 1) ? 'bg-stone-100 text-stone-400' : ''}`}
                    >
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
                    <td colSpan={19} className="text-center py-8 text-stone-500">
                      {selectedTarifarioId
                        ? 'No hay líneas en el plan. Agrega líneas para comenzar.'
                        : 'Seleccioná un tarifario del cliente para comenzar.'}
                    </td>
                  </tr>
                ) : (
                  localLineas.map((linea) => {
                    const rateInfo = rateMap.get(linea.perfilId);
                    return (
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
                              {perfilesForSelector.length === 0 ? (
                                <div className="px-2 py-1.5 text-sm text-stone-500">
                                  {selectedTarifarioId ? 'El tarifario no tiene perfiles' : 'Seleccioná un tarifario primero'}
                                </div>
                              ) : (
                                perfilesForSelector.map((perfil) => {
                                  const isDupe = isDuplicatePerfilSeniority(perfil.id, linea.id);
                                  return (
                                    <SelectItem
                                      key={perfil.id}
                                      value={perfil.id}
                                      disabled={isDupe}
                                    >
                                      {perfil.nombre} {perfil.nivel ? `(${perfil.nivel})` : ''} {isDupe ? '(ya existe)' : ''}
                                    </SelectItem>
                                  );
                                })
                              )}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-2 px-2">
                          <span className="text-xs text-stone-600">
                            {linea.perfilNivel || '-'}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right">
                          <span className="text-xs text-stone-600 tabular-nums">
                            {rateInfo ? rateInfo.rate.toLocaleString() : '-'}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className="text-xs text-stone-600">
                            {rateInfo?.moneda || '-'}
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
                          const enabled = isMonthEnabled(month);
                          const fteValue = linea.meses[month] || 0;
                          const cellKey = `${linea.id}|${month}`;
                          const isEditing = editingCell === cellKey;
                          const isDrag = isDragTarget(linea.id, month);

                          // Compute display value
                          let displayValue: string;
                          if (viewMode === 'money' && fteValue > 0) {
                            const rInfo = rateMap.get(linea.perfilId);
                            if (rInfo) {
                              const rev = fteValue * rInfo.rate;
                              const converted = convertRevenue(rev, rInfo.moneda, month);
                              displayValue = Math.round(converted).toLocaleString('es-AR');
                            } else {
                              displayValue = fteValue > 0 ? fteValue.toFixed(1) : '-';
                            }
                          } else {
                            displayValue = fteValue > 0 ? fteValue.toFixed(1) : '-';
                          }

                          return (
                            <td key={month} className={`py-2 px-1 ${!enabled ? 'bg-stone-50' : ''}`}>
                              {!enabled ? (
                                <span className="text-xs text-stone-400 flex justify-center">-</span>
                              ) : isEditing ? (
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => handleCellKeyDown(e, linea.id, month)}
                                  onBlur={() => handleCellSave(linea.id, month)}
                                  autoFocus
                                  className="h-7 text-center text-xs px-1"
                                />
                              ) : (
                                <button
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleDragFillStart(linea.id, month, fteValue);
                                  }}
                                  onMouseUp={() => {
                                    if (!dragMoved) handleCellClick(linea.id, month, fteValue);
                                  }}
                                  onMouseEnter={() => handleDragFillMove(linea.id, month)}
                                  className={`w-full h-7 text-xs font-mono rounded px-1 ${
                                    isDrag
                                      ? 'bg-blue-100 ring-2 ring-blue-400'
                                      : dirtyLineas.has(linea.id)
                                      ? 'bg-amber-50 hover:bg-amber-100'
                                      : 'hover:bg-stone-100'
                                  }`}
                                >
                                  {displayValue}
                                </button>
                              )}
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Revenue Summary */}
          {localLineas.length > 0 && selectedTarifarioId && (
            <div className="mt-6 p-4 bg-stone-50 rounded-md">
              <h3 className="text-sm font-semibold text-stone-800 mb-3">Revenue Planificado ({selectedCurrency})</h3>
              <div className="grid grid-cols-12 gap-2">
                {MONTH_NAMES.map((month, idx) => {
                  const revenue = calculateMonthRevenue(idx + 1);
                  const enabled = isMonthEnabled(idx + 1);
                  return (
                    <div key={idx} className={`text-center ${!enabled ? 'opacity-40' : ''}`}>
                      <p className="text-xs text-stone-500">{month}</p>
                      <p className="text-sm font-semibold text-stone-800 tabular-nums">
                        {enabled ? formatCurrency(revenue, selectedCurrency, { decimals: 0 }) : '-'}
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

          {/* Legend */}
          {selectedTarifarioId && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-800">
                Arrastrá una celda para copiar su valor a múltiples meses/filas. Revenue = FTE × Rate mensual. Usá los toggles FTE/$ y ARS/USD para cambiar la vista.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
