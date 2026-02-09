import { useState, useEffect } from 'react';
import { Save, Loader2, Info, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useConfig, useUpdateConfig, DEFAULT_CONFIG } from '../hooks/useConfig';
import { useFxRates, useUpsertFxRates } from '../hooks/useFx';
import type { FxRateItemInput } from '../api/fxApi';

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function ConfiguracionPage() {
  const { data: config, isLoading, isError } = useConfig();
  const updateConfig = useUpdateConfig();
  
  const [costoEmpresaPct, setCostoEmpresaPct] = useState<string>('');
  const [isDirty, setIsDirty] = useState(false);

  // Sync local state with fetched config
  useEffect(() => {
    if (config) {
      setCostoEmpresaPct(String(config.costoEmpresaPct));
      setIsDirty(false);
    }
  }, [config]);

  const handleChange = (value: string) => {
    setCostoEmpresaPct(value);
    setIsDirty(true);
  };

  const handleSave = () => {
    const numValue = Number(costoEmpresaPct);
    if (isNaN(numValue) || numValue < 0 || numValue > 200) {
      return;
    }
    updateConfig.mutate(
      { key: 'costoEmpresaPct', value: costoEmpresaPct },
      { onSuccess: () => setIsDirty(false) }
    );
  };

  const isUsingDefault = isError || !config;
  const currentValue = config?.costoEmpresaPct ?? DEFAULT_CONFIG.costoEmpresaPct;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Configuración</h1>
        <p className="text-stone-500 mt-1">Parámetros globales del sistema</p>
      </div>

      <Card className="max-w-lg border-stone-200">
        <CardHeader>
          <CardTitle className="text-lg text-stone-800">Costos de Empresa</CardTitle>
          <CardDescription className="text-stone-500">
            Porcentaje adicional sobre el costo base de cada recurso (cargas sociales, beneficios, infraestructura, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="costoEmpresaPct" className="text-stone-700">
                Costo Empresa (%)
              </Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-stone-400" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Se aplica al costo mensual base de cada recurso.
                    <br />
                    Ejemplo: si el salario es $1.000.000 y el % es 45,
                    el costo total empresa es $1.450.000.
                  </p>
                </TooltipContent>
              </Tooltip>
              {isUsingDefault && (
                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                  default
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Input
                id="costoEmpresaPct"
                type="number"
                min={0}
                max={200}
                step={1}
                value={costoEmpresaPct}
                onChange={(e) => handleChange(e.target.value)}
                className="w-32 border-stone-200"
                placeholder={String(DEFAULT_CONFIG.costoEmpresaPct)}
              />
              <span className="text-stone-500">%</span>
            </div>
            <p className="text-xs text-stone-400">
              Valor actual: {currentValue}%
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={!isDirty || updateConfig.isPending}
              className="bg-stone-800 hover:bg-stone-700"
            >
              {updateConfig.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Guardar
            </Button>
            {isDirty && (
              <span className="text-xs text-amber-600">Cambios sin guardar</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* FX Rates Configuration */}
      <FxRatesConfig />
    </div>
  );
}

// =====================
// FX Rates Configuration Component
// =====================

function FxRatesConfig() {
  const [fxYear, setFxYear] = useState(new Date().getFullYear());
  const { data: fxData, isLoading: fxLoading } = useFxRates(fxYear);
  const upsertFx = useUpsertFxRates(fxYear);
  
  // Local state for editable values
  const [fxValues, setFxValues] = useState<Record<number, { real: string; plan: string }>>({});
  const [fxDirty, setFxDirty] = useState(false);

  // Sync with fetched data
  useEffect(() => {
    if (fxData) {
      const values: Record<number, { real: string; plan: string }> = {};
      for (const rate of fxData.rates) {
        values[rate.month] = {
          real: rate.real !== null ? String(rate.real) : '',
          plan: rate.plan !== null ? String(rate.plan) : '',
        };
      }
      setFxValues(values);
      setFxDirty(false);
    }
  }, [fxData]);

  const handleFxChange = (month: number, tipo: 'real' | 'plan', value: string) => {
    setFxValues((prev) => ({
      ...prev,
      [month]: { ...prev[month], [tipo]: value },
    }));
    setFxDirty(true);
  };

  const handleFxSave = () => {
    const items: FxRateItemInput[] = [];
    for (let m = 1; m <= 12; m++) {
      const vals = fxValues[m];
      if (!vals) continue;
      const realNum = vals.real ? parseFloat(vals.real) : null;
      const planNum = vals.plan ? parseFloat(vals.plan) : null;
      
      // Validate: if provided, must be > 0
      if (realNum !== null && (isNaN(realNum) || realNum <= 0)) continue;
      if (planNum !== null && (isNaN(planNum) || planNum <= 0)) continue;
      
      items.push({ month: m, real: realNum, plan: planNum });
    }
    
    upsertFx.mutate(items, {
      onSuccess: () => setFxDirty(false),
    });
  };

  return (
    <Card className="max-w-2xl border-stone-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg text-stone-800">Tipo de Cambio USD</CardTitle>
            <CardDescription className="text-stone-500">
              Cantidad de ARS por 1 USD. Usado para convertir costos entre monedas.
            </CardDescription>
          </div>
          {/* Year selector */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-stone-500 hover:text-stone-800"
              onClick={() => setFxYear((y) => y - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold text-stone-800 min-w-[4ch] text-center">{fxYear}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-stone-500 hover:text-stone-800"
              onClick={() => setFxYear((y) => y + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {fxLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="text-left py-2 px-2 font-medium text-stone-600 w-16">Mes</th>
                    <th className="text-center py-2 px-2 font-medium text-stone-600">
                      <div className="flex items-center justify-center gap-1">
                        REAL
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-stone-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Tipo de cambio histórico confirmado</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </th>
                    <th className="text-center py-2 px-2 font-medium text-stone-600">
                      <div className="flex items-center justify-center gap-1">
                        PLAN
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-stone-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Tipo de cambio proyectado/planificado</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </th>
                    <th className="text-center py-2 px-2 font-medium text-stone-600">Efectivo</th>
                  </tr>
                </thead>
                <tbody>
                  {MONTH_LABELS.map((label, idx) => {
                    const month = idx + 1;
                    const rate = fxData?.rates.find((r) => r.month === month);
                    const vals = fxValues[month] || { real: '', plan: '' };
                    
                    return (
                      <tr key={month} className="border-b border-stone-100">
                        <td className="py-2 px-2 font-medium text-stone-700">{label}</td>
                        <td className="py-1 px-2">
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={vals.real}
                            onChange={(e) => handleFxChange(month, 'real', e.target.value)}
                            className="w-28 h-8 text-sm border-stone-200 text-center"
                            placeholder="—"
                          />
                        </td>
                        <td className="py-1 px-2">
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={vals.plan}
                            onChange={(e) => handleFxChange(month, 'plan', e.target.value)}
                            className="w-28 h-8 text-sm border-stone-200 text-center"
                            placeholder="—"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          {rate?.effective !== null ? (
                            <span className={`text-sm font-medium ${rate?.isFallback ? 'text-amber-600' : 'text-stone-700'}`}>
                              {rate?.effective?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              {rate?.isFallback && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertCircle className="inline-block ml-1 h-3 w-3 text-amber-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Usando valor anterior (fallback)</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </span>
                          ) : (
                            <span className="text-stone-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handleFxSave}
                disabled={!fxDirty || upsertFx.isPending}
                className="bg-stone-800 hover:bg-stone-700"
              >
                {upsertFx.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar
              </Button>
              {fxDirty && (
                <span className="text-xs text-amber-600">Cambios sin guardar</span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
