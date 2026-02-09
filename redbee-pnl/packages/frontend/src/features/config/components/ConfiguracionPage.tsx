import { useState, useEffect } from 'react';
import { Save, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useConfig, useUpdateConfig, DEFAULT_CONFIG } from '../hooks/useConfig';

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
    </div>
  );
}
