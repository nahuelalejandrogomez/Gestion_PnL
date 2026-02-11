import { useState } from 'react';
import { Pencil, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useTarifario } from '../hooks/useTarifarios';
import type { Tarifario } from '../types/tarifario.types';

interface TarifarioCardProps {
  tarifario: Tarifario;
  onEdit: (tarifario: Tarifario) => void;
  onDelete: (id: string) => void;
  formatDate: (dateString: string) => string;
  getEstadoBadgeVariant: (estado: string) => 'default' | 'secondary' | 'outline';
}

export function TarifarioCard({
  tarifario,
  onEdit,
  onDelete,
  formatDate,
  getEstadoBadgeVariant,
}: TarifarioCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: tarifarioDetalle, isLoading: isLoadingDetalle } = useTarifario(
    isExpanded ? tarifario.id : undefined
  );

  const formatAmount = (amount: number, moneda: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: moneda,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const lineas = tarifarioDetalle?.lineas || tarifario.lineas || [];
  const lineasSorted = [...lineas].sort((a, b) => {
    const nombreA = a.perfil?.nombre || '';
    const nombreB = b.perfil?.nombre || '';
    if (nombreA !== nombreB) return nombreA.localeCompare(nombreB);

    const nivelA = a.perfil?.nivel || '';
    const nivelB = b.perfil?.nivel || '';
    const orden = { JR: 1, SSR: 2, SR: 3, LEAD: 4, MANAGER: 5, STAFF: 6 };
    return (orden[nivelA as keyof typeof orden] || 0) - (orden[nivelB as keyof typeof orden] || 0);
  });

  return (
    <Card className="border-stone-200 hover:bg-stone-50 transition-colors">
      <CardContent className="p-4">
        <button
          onClick={handleToggle}
          className="w-full text-left focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2 rounded"
          aria-expanded={isExpanded}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-stone-800">{tarifario.nombre}</h3>
                <Badge variant={getEstadoBadgeVariant(tarifario.estado)}>
                  {tarifario.estado}
                </Badge>
                <Badge variant="outline" className="border-stone-300">
                  {tarifario.moneda}
                </Badge>
              </div>
              <div className="text-sm text-stone-600 space-y-1">
                <p>
                  Vigencia: {formatDate(tarifario.fechaVigenciaDesde)}
                  {tarifario.fechaVigenciaHasta
                    ? ` - ${formatDate(tarifario.fechaVigenciaHasta)}`
                    : ' - Sin fecha fin'}
                </p>
                <p>
                  {tarifario._count?.lineas || 0} línea(s) • {tarifario._count?.proyectos || 0} proyecto(s)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(tarifario);
                }}
                className="border-stone-200"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border-stone-200" onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-stone-800">
                      ¿Estás seguro?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-stone-500">
                      Esta acción eliminará el tarifario "{tarifario.nombre}" y no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-stone-200 text-stone-600">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(tarifario.id)}
                      className="bg-red-600 text-white hover:bg-red-700"
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <ChevronDown
                className={`h-5 w-5 text-stone-400 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>
        </button>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-stone-200">
            {isLoadingDetalle ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : lineasSorted.length === 0 ? (
              <p className="text-sm text-stone-500 text-center py-4">
                No hay líneas en este tarifario
              </p>
            ) : (
              <div className="rounded-md border border-stone-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-stone-50">
                      <TableHead className="text-stone-700 font-semibold">Perfil</TableHead>
                      <TableHead className="text-stone-700 font-semibold">Seniority</TableHead>
                      <TableHead className="text-stone-700 font-semibold text-right">Importe</TableHead>
                      <TableHead className="text-stone-700 font-semibold text-center">Moneda</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineasSorted.map((linea) => (
                      <TableRow key={linea.id} className="hover:bg-stone-50">
                        <TableCell className="font-medium text-stone-800">
                          {linea.perfil?.nombre || '-'}
                        </TableCell>
                        <TableCell className="text-stone-600">
                          {linea.perfil?.nivel || '-'}
                        </TableCell>
                        <TableCell className="text-right text-stone-800 font-mono">
                          {formatAmount(linea.rate, linea.moneda || tarifario.moneda)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="border-stone-300">
                            {linea.moneda || tarifario.moneda}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
