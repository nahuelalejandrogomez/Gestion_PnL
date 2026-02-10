import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useTarifarios } from '../hooks/useTarifarios';
import { useFxRates } from '@/features/config/hooks/useFx';
import { buildFxMap, convertCurrency, formatCurrency, type Currency } from '@/lib/fx';
import type { Tarifario } from '../types/tarifario.types';

const estadoBadgeVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
  ACTIVO: 'default',
  INACTIVO: 'secondary',
  DRAFT: 'outline',
};

const estadoLabels: Record<string, string> = {
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
  DRAFT: 'Borrador',
};

export function TarifariosPage() {
  const navigate = useNavigate();
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');

  const { data: tarifariosData, isLoading } = useTarifarios();
  const { data: fxData } = useFxRates(selectedYear);

  const fxMap = fxData ? buildFxMap(fxData.rates) : {};
  const fxRate = fxMap[selectedMonth] ?? null;

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getDisplayRate = (tarifario: Tarifario): string => {
    // Show average rate from lineas if available
    if (!tarifario.lineas || tarifario.lineas.length === 0) return '-';

    const totalRate = tarifario.lineas.reduce((sum, linea) => {
      const lineaMoneda = linea.moneda || tarifario.moneda;
      const converted = convertCurrency(linea.rate, lineaMoneda, selectedCurrency, fxRate);
      return sum + (converted ?? 0);
    }, 0);

    const avgRate = totalRate / tarifario.lineas.length;
    return formatCurrency(avgRate, selectedCurrency);
  };

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);
  const months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 bg-stone-50 min-h-screen -m-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48 bg-stone-200" />
          <Skeleton className="h-10 w-32 bg-stone-200" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-lg bg-stone-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-stone-50 min-h-screen -m-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-stone-800">Tarifarios</h1>
            <p className="text-stone-500">Gestión de tarifas por perfil</p>
          </div>
        </div>
        <Button
          onClick={() => navigate('/tarifarios/new')}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Tarifario
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-stone-200 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-stone-800">
                Vista de Tarifas
              </CardTitle>
              <CardDescription className="text-stone-500">
                Conversión de moneda según tipo de cambio mensual
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={String(selectedMonth)}
                onValueChange={(v) => setSelectedMonth(Number(v))}
              >
                <SelectTrigger className="w-[140px] border-stone-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={String(selectedYear)}
                onValueChange={(v) => setSelectedYear(Number(v))}
              >
                <SelectTrigger className="w-[100px] border-stone-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedCurrency}
                onValueChange={(v) => setSelectedCurrency(v as Currency)}
              >
                <SelectTrigger className="w-[100px] border-stone-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARS">ARS</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {fxRate === null && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ No hay tipo de cambio configurado para {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}.
                Las conversiones no estarán disponibles.
              </p>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow className="border-stone-200">
                <TableHead className="text-stone-600">Nombre</TableHead>
                <TableHead className="text-stone-600">Cliente</TableHead>
                <TableHead className="text-stone-600">Moneda Base</TableHead>
                <TableHead className="text-stone-600">Estado</TableHead>
                <TableHead className="text-stone-600">Vigencia</TableHead>
                <TableHead className="text-stone-600">Líneas</TableHead>
                <TableHead className="text-stone-600 text-right">Rate Promedio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!tarifariosData || tarifariosData.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-stone-500 py-8">
                    No hay tarifarios disponibles
                  </TableCell>
                </TableRow>
              ) : (
                tarifariosData.items.map((tarifario) => (
                  <TableRow
                    key={tarifario.id}
                    className="border-stone-200 hover:bg-stone-50 cursor-pointer"
                    onClick={() => navigate(`/tarifarios/${tarifario.id}`)}
                  >
                    <TableCell className="font-medium text-stone-800">
                      {tarifario.nombre}
                    </TableCell>
                    <TableCell className="text-stone-600">
                      {tarifario.cliente?.nombre || '-'}
                    </TableCell>
                    <TableCell className="text-stone-600">
                      <Badge variant="outline" className="border-stone-300">
                        {tarifario.moneda}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={estadoBadgeVariants[tarifario.estado]}>
                        {estadoLabels[tarifario.estado]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-stone-600">
                      {formatDate(tarifario.fechaVigenciaDesde)}
                    </TableCell>
                    <TableCell className="text-stone-600">
                      {tarifario._count?.lineas || 0}
                    </TableCell>
                    <TableCell className="text-stone-800 text-right font-medium">
                      {getDisplayRate(tarifario)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {tarifariosData && tarifariosData.total > 0 && (
            <div className="mt-4 text-sm text-stone-500">
              Mostrando {tarifariosData.items.length} de {tarifariosData.total} tarifarios
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
