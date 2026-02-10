import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Pencil, Trash2 } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useTarifario, useDeleteTarifario } from '../hooks/useTarifarios';
import { useFxRates } from '@/features/config/hooks/useFx';
import { buildFxMap, convertCurrency, formatCurrency, type Currency } from '@/lib/fx';
import type { LineaTarifario } from '../types/tarifario.types';

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

const unidadLabels: Record<string, string> = {
  MES: 'Mes',
  HORA: 'Hora',
  DIA: 'Día',
};

export function TarifarioDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');

  const { data: tarifario, isLoading, error } = useTarifario(id);
  const deleteTarifario = useDeleteTarifario();
  const { data: fxData } = useFxRates(selectedYear);

  const fxMap = fxData ? buildFxMap(fxData.rates) : {};
  const fxRate = fxMap[selectedMonth] ?? null;

  const handleDelete = () => {
    if (!id) return;
    deleteTarifario.mutate(id, {
      onSuccess: () => navigate('/tarifarios'),
    });
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getLineaDisplayRate = (linea: LineaTarifario): string => {
    const lineaMoneda = linea.moneda || tarifario?.moneda || 'USD';
    const converted = convertCurrency(linea.rate, lineaMoneda, selectedCurrency, fxRate);
    return formatCurrency(converted, selectedCurrency);
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
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg bg-stone-200" />
          <Skeleton className="h-8 w-64 bg-stone-200" />
        </div>
        <Skeleton className="h-[200px] w-full rounded-lg bg-stone-200" />
        <Skeleton className="h-[300px] w-full rounded-lg bg-stone-200" />
      </div>
    );
  }

  if (error || !tarifario) {
    return (
      <div className="space-y-4 bg-stone-50 min-h-screen -m-6 p-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/tarifarios')}
          className="text-stone-600 hover:text-stone-900 hover:bg-stone-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a tarifarios
        </Button>
        <Card className="border-stone-200">
          <CardContent className="pt-12 pb-12">
            <p className="text-stone-500 text-center">No se pudo cargar el tarifario.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-stone-50 min-h-screen -m-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/tarifarios')}
            className="text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-stone-800">{tarifario.nombre}</h1>
              <Badge variant={estadoBadgeVariants[tarifario.estado]}>
                {estadoLabels[tarifario.estado]}
              </Badge>
              <Badge variant="outline" className="border-stone-300">
                {tarifario.moneda}
              </Badge>
            </div>
            <p className="text-stone-500 mt-1">
              {tarifario.cliente && (
                <button
                  onClick={() => navigate(`/clientes/${tarifario.cliente!.id}`)}
                  className="hover:text-stone-700 underline underline-offset-2"
                >
                  {tarifario.cliente.nombre}
                </button>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/tarifarios/${id}/edit`)}
            className="border-stone-200 text-stone-700 hover:bg-stone-100"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-stone-200">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-stone-800">¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription className="text-stone-500">
                  Esta acción eliminará el tarifario "{tarifario.nombre}" y no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-stone-200 text-stone-600">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-stone-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-stone-800">
            Información General
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-stone-500">Cliente</p>
              <p className="font-medium text-stone-800">{tarifario.cliente?.nombre || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-stone-500">Contrato</p>
              <p className="font-medium text-stone-800">{tarifario.contrato?.nombre || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-stone-500">Vigencia desde</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-stone-400" />
                <p className="font-medium text-stone-800">
                  {formatDate(tarifario.fechaVigenciaDesde)}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-stone-500">Vigencia hasta</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-stone-400" />
                <p className="font-medium text-stone-800">
                  {formatDate(tarifario.fechaVigenciaHasta)}
                </p>
              </div>
            </div>
          </div>

          {tarifario.notas && (
            <>
              <Separator className="my-6 bg-stone-200" />
              <div className="space-y-1">
                <p className="text-sm text-stone-500">Notas</p>
                <p className="text-stone-700 whitespace-pre-wrap">{tarifario.notas}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Lineas Card */}
      <Card className="border-stone-200 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-stone-800">
                Líneas de Tarifario ({tarifario._count?.lineas || 0})
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
                <TableHead className="text-stone-600">Perfil</TableHead>
                <TableHead className="text-stone-600">Categoría</TableHead>
                <TableHead className="text-stone-600">Moneda Original</TableHead>
                <TableHead className="text-stone-600">Unidad</TableHead>
                <TableHead className="text-stone-600 text-right">
                  Rate Original
                </TableHead>
                <TableHead className="text-stone-600 text-right">
                  Rate ({selectedCurrency})
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!tarifario.lineas || tarifario.lineas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-stone-500 py-8">
                    No hay líneas de tarifario disponibles
                  </TableCell>
                </TableRow>
              ) : (
                tarifario.lineas.map((linea) => {
                  const lineaMoneda = linea.moneda || tarifario.moneda;
                  return (
                    <TableRow key={linea.id} className="border-stone-200">
                      <TableCell className="font-medium text-stone-800">
                        {linea.perfil?.nombre || '-'}
                      </TableCell>
                      <TableCell className="text-stone-600">
                        {linea.perfil?.categoria || '-'}
                      </TableCell>
                      <TableCell className="text-stone-600">
                        <Badge variant="outline" className="border-stone-300">
                          {lineaMoneda}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-stone-600">
                        {unidadLabels[linea.unidad] || linea.unidad}
                      </TableCell>
                      <TableCell className="text-stone-600 text-right font-mono">
                        {formatCurrency(linea.rate, lineaMoneda)}
                      </TableCell>
                      <TableCell className="text-stone-800 text-right font-medium font-mono">
                        {getLineaDisplayRate(linea)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
