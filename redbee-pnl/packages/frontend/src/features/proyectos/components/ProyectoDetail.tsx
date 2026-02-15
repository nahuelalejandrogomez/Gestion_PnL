import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, FolderKanban, Users, Pencil, Trash2, BarChart3, Receipt, DollarSign, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
import { useProyecto } from '../hooks/useProyecto';
import { useProyectoMutations } from '../hooks/useProyectoMutations';
import { ProyectoBadge } from './ProyectoBadge';
import { ProyectoForm } from './ProyectoForm';
import { AsignacionesPlanner } from '@/features/asignaciones';
import { ProyectoPnlGrid, useProyectoPnlYear } from '@/features/pnl';
import { ProyectoPlanLineasGrid } from '@/features/planLineas';
import { ProyectoTarifarioPlanGrid } from '@/features/proyecto-tarifario-plan';
import { formatCurrencyFull, formatPercentage, formatNumberFull } from '@/lib/formatNumber';
import type { UpdateProyectoDto } from '../types/proyecto.types';

const tipoLabels: Record<string, string> = {
  PROYECTO: 'Proyecto',
  POTENCIAL: 'Potencial',
  SOPORTE: 'Soporte',
  RETAINER: 'Retainer',
};

export function ProyectoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: proyecto, isLoading, error } = useProyecto(id);
  const { updateProyecto, deleteProyecto } = useProyectoMutations();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const { data: pnlData } = useProyectoPnlYear(id, currentYear);

  const handleUpdate = (data: UpdateProyectoDto) => {
    if (!id) return;
    updateProyecto.mutate(
      { id, data },
      {
        onSuccess: () => setIsEditDialogOpen(false),
      },
    );
  };

  const handleDelete = () => {
    if (!id) return;
    deleteProyecto.mutate(id, {
      onSuccess: () => navigate('/proyectos'),
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

  if (error || !proyecto) {
    return (
      <div className="space-y-4 bg-stone-50 min-h-screen -m-6 p-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/proyectos')}
          className="text-stone-600 hover:text-stone-900 hover:bg-stone-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a proyectos
        </Button>
        <Card className="border-stone-200">
          <CardContent className="pt-12 pb-12">
            <p className="text-stone-500 text-center">
              No se pudo cargar el proyecto.
            </p>
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
            onClick={() => navigate('/proyectos')}
            className="text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-stone-800">{proyecto.nombre}</h1>
              <ProyectoBadge estado={proyecto.estado} />
            </div>
            <p className="text-stone-500 mt-1">
              <span className="font-mono">{proyecto.codigo}</span>
              {proyecto.cliente && (
                <> · <button
                  onClick={() => navigate(`/clientes/${proyecto.cliente.id}`)}
                  className="hover:text-stone-700 underline underline-offset-2"
                >
                  {proyecto.cliente.nombre}
                </button></>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsEditDialogOpen(true)}
            className="border-stone-200 text-stone-700 hover:bg-stone-100"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-stone-200">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-stone-800">¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription className="text-stone-500">
                  Esta acción eliminará el proyecto "{proyecto.nombre}" y no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-stone-200 text-stone-600">Cancelar</AlertDialogCancel>
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
          <CardTitle className="text-lg font-semibold text-stone-800">Información General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-stone-500">Tipo</p>
              <p className="font-medium text-stone-800">{tipoLabels[proyecto.tipo] || proyecto.tipo}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-stone-500">Fecha de inicio</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-stone-400" />
                <p className="font-medium text-stone-800">{formatDate(proyecto.fechaInicio)}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-stone-500">Fin estimada</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-stone-400" />
                <p className="font-medium text-stone-800">{formatDate(proyecto.fechaFinEstimada)}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-stone-500">Fin real</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-stone-400" />
                <p className="font-medium text-stone-800">{formatDate(proyecto.fechaFinReal)}</p>
              </div>
            </div>
          </div>

          <Separator className="my-6 bg-stone-200" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-stone-500">Cliente</p>
              <p className="font-medium text-stone-800">{proyecto.cliente?.nombre || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-stone-500">Tarifario</p>
              {(proyecto.tarifario || proyecto.tarifarioRevenuePlan) ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <p className="font-medium text-stone-800">
                    {proyecto.tarifario?.nombre || proyecto.tarifarioRevenuePlan?.nombre}
                  </p>
                </div>
              ) : (
                <p className="font-medium text-stone-400">Sin tarifario</p>
              )}
            </div>
            {proyecto.probabilidadCierre != null && (
              <div className="space-y-1">
                <p className="text-sm text-stone-500">Prob. cierre</p>
                <p className="font-medium text-stone-800">{proyecto.probabilidadCierre}%</p>
              </div>
            )}
          </div>

          {proyecto.notas && (
            <>
              <Separator className="my-6 bg-stone-200" />
              <div className="space-y-1">
                <p className="text-sm text-stone-500">Notas</p>
                <p className="text-stone-700 whitespace-pre-wrap">{proyecto.notas}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Annual KPIs - 16 Indicadores de Negocio */}
      {pnlData && pnlData.indicadoresNegocio && (
        <div className="space-y-4">
          {/* Sección: REVENUE & FORECAST */}
          <Card className="border-stone-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-stone-600 uppercase tracking-wide">Revenue & Forecast {currentYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: 'FTE', value: formatNumberFull(pnlData.indicadoresNegocio.fte) },
                  { label: 'Fcst Rev.', value: formatCurrencyFull(pnlData.indicadoresNegocio.fcstRev, 'USD') },
                  { label: 'Revenue', value: formatCurrencyFull(pnlData.indicadoresNegocio.revenue, 'USD') },
                  { label: 'Dif. Estimación Rev.', value: formatCurrencyFull(pnlData.indicadoresNegocio.difEstimacionRev, 'USD') },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-stone-500 mb-1">{kpi.label}</p>
                    <p className="text-base font-semibold text-stone-800">{kpi.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sección: COSTOS & MÁRGENES */}
          <Card className="border-stone-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-stone-600 uppercase tracking-wide">Costos & Márgenes {currentYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: 'Forecast Costos', value: formatCurrencyFull(pnlData.indicadoresNegocio.forecastCostos, 'USD') },
                  { label: 'Costos Directos', value: formatCurrencyFull(pnlData.indicadoresNegocio.costosDirectos, 'USD') },
                  { label: 'Dif. Estimación CD', value: formatCurrencyFull(pnlData.indicadoresNegocio.difEstimacionCD, 'USD') },
                  {
                    label: 'Labor Margin',
                    value: formatPercentage(pnlData.indicadoresNegocio.laborMargin),
                    color: pnlData.indicadoresNegocio.laborMargin !== null
                      ? (pnlData.indicadoresNegocio.laborMargin >= 40 ? 'text-emerald-600' : pnlData.indicadoresNegocio.laborMargin >= 20 ? 'text-amber-600' : 'text-red-600')
                      : 'text-stone-400'
                  },
                  { label: 'Costos Indirectos', value: formatCurrencyFull(pnlData.indicadoresNegocio.costosIndirectos, 'USD') },
                  { label: 'Costos Totales', value: formatCurrencyFull(pnlData.indicadoresNegocio.costosTotales, 'USD') },
                  {
                    label: 'Gross Margin',
                    value: formatPercentage(pnlData.indicadoresNegocio.grossProject),
                    color: pnlData.indicadoresNegocio.grossProject !== null
                      ? (pnlData.indicadoresNegocio.grossProject >= 20 ? 'text-emerald-600' : pnlData.indicadoresNegocio.grossProject >= 10 ? 'text-amber-600' : 'text-red-600')
                      : 'text-stone-400'
                  },
                  { label: 'Blend Rate', value: pnlData.totalesAnuales.indicadores.blendRate !== null ? formatCurrencyFull(pnlData.totalesAnuales.indicadores.blendRate, 'USD') : '-' },
                  { label: 'Blend Cost', value: pnlData.totalesAnuales.indicadores.blendCost !== null ? formatCurrencyFull(pnlData.totalesAnuales.indicadores.blendCost, 'USD') : '-' },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-stone-500 mb-1">{kpi.label}</p>
                    <p className={`text-base font-semibold ${kpi.color || 'text-stone-800'}`}>{kpi.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs for related data */}
      <Tabs defaultValue="resumen" className="space-y-4">
        <TabsList className="bg-white border border-stone-200 p-1 rounded-lg">
          <TabsTrigger
            value="resumen"
            className="flex items-center gap-2 data-[state=active]:bg-stone-100 data-[state=active]:text-stone-800 rounded-md px-4"
          >
            <FolderKanban className="h-4 w-4" />
            Resumen mes actual
          </TabsTrigger>
          <TabsTrigger
            value="presupuesto"
            className="flex items-center gap-2 data-[state=active]:bg-stone-100 data-[state=active]:text-stone-800 rounded-md px-4"
          >
            <Receipt className="h-4 w-4" />
            Tarifario
          </TabsTrigger>
          <TabsTrigger
            value="plan"
            className="flex items-center gap-2 data-[state=active]:bg-stone-100 data-[state=active]:text-stone-800 rounded-md px-4"
          >
            <DollarSign className="h-4 w-4" />
            Forecast
          </TabsTrigger>
          <TabsTrigger
            value="asignaciones"
            className="flex items-center gap-2 data-[state=active]:bg-stone-100 data-[state=active]:text-stone-800 rounded-md px-4"
          >
            <Users className="h-4 w-4" />
            Asignaciones ({proyecto._count?.asignaciones || 0})
          </TabsTrigger>
          <TabsTrigger
            value="pnl"
            className="flex items-center gap-2 data-[state=active]:bg-stone-100 data-[state=active]:text-stone-800 rounded-md px-4"
          >
            <BarChart3 className="h-4 w-4" />
            P&L
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="mt-6">
          {/* B) TAB "Resumen mes actual": Indicadores del mes corriente */}
          {pnlData && pnlData.meses && (() => {
            const currentMonth = new Date().getMonth() + 1; // 1-12
            const monthData = pnlData.meses[currentMonth];
            
            if (!monthData) {
              return (
                <Card className="border-stone-200 bg-white">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-stone-800">Resumen mes actual</CardTitle>
                    <CardDescription className="text-stone-500">
                      No hay datos para el mes {currentMonth}/{currentYear}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            }

            // Calcular indicadores del mes actual (misma estructura que header pero solo este mes)
            const costosDirectosMes = monthData.costos.recursos + monthData.costos.guardiasExtras;
            const costosTotalesMes = monthData.costos.total;
            const laborMarginMes = monthData.revenue.asignado > 0
              ? ((monthData.revenue.asignado - costosDirectosMes) / monthData.revenue.asignado) * 100
              : null;
            const grossProjectMes = monthData.revenue.asignado > 0
              ? ((monthData.revenue.asignado - costosTotalesMes) / monthData.revenue.asignado) * 100
              : null;

            return (
              <div className="space-y-4">
                {/* Sección: REVENUE & FORECAST - MES ACTUAL */}
                <Card className="border-stone-200 bg-white">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold text-stone-600 uppercase tracking-wide">
                      Revenue & Forecast - Mes {currentMonth}/{currentYear}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {[
                        { label: 'FTE', value: formatNumberFull(monthData.indicadores.ftesAsignados), color: undefined },
                        { label: 'Fcst Rev.', value: formatCurrencyFull(monthData.revenue.forecast, 'USD'), color: undefined },
                        { label: 'Revenue', value: formatCurrencyFull(monthData.revenue.asignado, 'USD'), color: undefined },
                        { label: 'Dif. Estimación Rev.', value: formatCurrencyFull(monthData.revenue.noAsignado, 'USD'), color: undefined },
                      ].map((item, idx) => (
                        <div key={idx} className="rounded-lg border border-stone-200 p-3 bg-white hover:shadow-sm transition-shadow">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400 mb-1">{item.label}</p>
                          <p className={`text-base font-semibold ${item.color || 'text-stone-800'}`}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Sección: COSTOS & MÁRGENES - MES ACTUAL */}
                <Card className="border-stone-200 bg-white">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold text-stone-600 uppercase tracking-wide">
                      Costos & Márgenes - Mes {currentMonth}/{currentYear}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {[
                        { label: 'Forecast Costos', value: formatCurrencyFull(0, 'USD') },
                        { label: 'Costos Directos', value: formatCurrencyFull(costosDirectosMes, 'USD') },
                        { label: 'Dif. Estimación CD', value: formatCurrencyFull(0, 'USD') },
                        {
                          label: 'Labor Margin',
                          value: formatPercentage(laborMarginMes),
                          color: laborMarginMes !== null
                            ? (laborMarginMes >= 40 ? 'text-emerald-600' : laborMarginMes >= 20 ? 'text-amber-600' : 'text-red-600')
                            : 'text-stone-400'
                        },
                        { label: 'Costos Indirectos', value: formatCurrencyFull(monthData.costos.otros, 'USD') },
                        { label: 'Costos Totales', value: formatCurrencyFull(costosTotalesMes, 'USD') },
                        {
                          label: 'Gross Margin',
                          value: formatPercentage(grossProjectMes),
                          color: grossProjectMes !== null
                            ? (grossProjectMes >= 40 ? 'text-emerald-600' : grossProjectMes >= 20 ? 'text-amber-600' : 'text-red-600')
                            : 'text-stone-400'
                        },
                        { label: 'Blend Rate', value: monthData.indicadores.blendRate !== null ? formatCurrencyFull(monthData.indicadores.blendRate, 'USD') : '-' },
                        { label: 'Blend Cost', value: monthData.indicadores.blendCost !== null ? formatCurrencyFull(monthData.indicadores.blendCost, 'USD') : '-' },
                      ].map((item, idx) => (
                        <div key={idx} className="rounded-lg border border-stone-200 p-3 bg-white hover:shadow-sm transition-shadow">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400 mb-1">{item.label}</p>
                          <p className={`text-base font-semibold ${item.color || 'text-stone-800'}`}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })()}

          {!pnlData && (
            <Card className="border-stone-200 bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-stone-800">Resumen mes actual</CardTitle>
                <CardDescription className="text-stone-500">
                  Cargando datos del P&L...
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="presupuesto" className="mt-6">
          <ProyectoTarifarioPlanGrid proyectoId={proyecto.id} clienteId={proyecto.clienteId} />
        </TabsContent>

        <TabsContent value="plan" className="mt-6">
          <ProyectoPlanLineasGrid proyectoId={proyecto.id} />
        </TabsContent>

        <TabsContent value="asignaciones" className="mt-6">
          <Card className="border-stone-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-stone-800">Asignaciones</CardTitle>
              <CardDescription className="text-stone-500">
                Recursos asignados a este proyecto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AsignacionesPlanner proyectoId={id!} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pnl" className="mt-6">
          <ProyectoPnlGrid proyectoId={id!} />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <ProyectoForm
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        proyecto={proyecto}
        onSubmit={handleUpdate}
        isLoading={updateProyecto.isPending}
      />
    </div>
  );
}
